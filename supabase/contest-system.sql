-- Contest System for Concursul National de Fizica PLANCK
-- Supports contest scheduling, grade-specific problems, and auto-saved submissions.

CREATE TABLE IF NOT EXISTS public.contests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 120 CHECK (duration_minutes > 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contest_problems (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  statement text NOT NULL,
  image_url text,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  grade text NOT NULL CHECK (grade IN ('IX', 'X', 'XI', 'XII')),
  display_order integer NOT NULL CHECK (display_order >= 1 AND display_order <= 30),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (contest_id, grade, display_order)
);

CREATE TABLE IF NOT EXISTS public.contest_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.contest_problems(id) ON DELETE CASCADE,
  answer text NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
  submitted_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, contest_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_contests_start_time
  ON public.contests(start_time);

CREATE INDEX IF NOT EXISTS idx_contest_problems_lookup
  ON public.contest_problems(contest_id, grade, display_order);

CREATE INDEX IF NOT EXISTS idx_contest_submissions_user_contest
  ON public.contest_submissions(user_id, contest_id);

CREATE INDEX IF NOT EXISTS idx_contest_submissions_problem
  ON public.contest_submissions(problem_id);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_contest_active(p_contest_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contests c
    WHERE c.id = p_contest_id
      AND now() >= c.start_time
      AND now() < c.start_time + make_interval(mins => c.duration_minutes)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_contest_problems_for_user(p_contest_id uuid)
RETURNS TABLE (
  problem_id uuid,
  display_order integer,
  statement text,
  image_url text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  saved_answer text,
  saved_submitted_at timestamptz
) AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_grade text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Neautentificat';
  END IF;

  IF p_contest_id IS NULL THEN
    RAISE EXCEPTION 'Contestul este obligatoriu';
  END IF;

  SELECT cr.grade
  INTO v_grade
  FROM public.contest_registrations cr
  WHERE cr.user_id = v_user_id;

  IF v_grade IS NULL THEN
    RAISE EXCEPTION 'Nu esti inscris la concurs';
  END IF;

  IF NOT public.is_contest_active(p_contest_id) THEN
    RAISE EXCEPTION 'Concursul nu este activ';
  END IF;

  RETURN QUERY
  SELECT
    cp.id,
    cp.display_order,
    cp.statement,
    cp.image_url,
    cp.option_a,
    cp.option_b,
    cp.option_c,
    cp.option_d,
    cs.answer,
    cs.submitted_at
  FROM public.contest_problems cp
  LEFT JOIN public.contest_submissions cs
    ON cs.problem_id = cp.id
   AND cs.contest_id = cp.contest_id
   AND cs.user_id = v_user_id
  WHERE cp.contest_id = p_contest_id
    AND cp.grade = v_grade
  ORDER BY cp.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.submit_contest_answer(
  p_contest_id uuid,
  p_problem_id uuid,
  p_answer text
)
RETURNS TABLE (
  answer text,
  submitted_at timestamptz
) AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_grade text;
  v_answer text := upper(trim(p_answer));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Neautentificat';
  END IF;

  IF p_contest_id IS NULL OR p_problem_id IS NULL THEN
    RAISE EXCEPTION 'Contestul si problema sunt obligatorii';
  END IF;

  IF v_answer NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'Raspuns invalid';
  END IF;

  SELECT cr.grade
  INTO v_grade
  FROM public.contest_registrations cr
  WHERE cr.user_id = v_user_id;

  IF v_grade IS NULL THEN
    RAISE EXCEPTION 'Nu esti inscris la concurs';
  END IF;

  IF NOT public.is_contest_active(p_contest_id) THEN
    RAISE EXCEPTION 'Concursul nu este activ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.contest_problems cp
    WHERE cp.id = p_problem_id
      AND cp.contest_id = p_contest_id
      AND cp.grade = v_grade
  ) THEN
    RAISE EXCEPTION 'Problema nu apartine concursului sau clasei tale';
  END IF;

  RETURN QUERY
  INSERT INTO public.contest_submissions (
    user_id,
    contest_id,
    problem_id,
    answer,
    submitted_at
  )
  VALUES (
    v_user_id,
    p_contest_id,
    p_problem_id,
    v_answer,
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id, contest_id, problem_id)
  DO UPDATE SET
    answer = EXCLUDED.answer,
    submitted_at = timezone('utc'::text, now())
  RETURNING contest_submissions.answer, contest_submissions.submitted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_contest_active(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contest_problems_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contest_answer(uuid, uuid, text) TO authenticated;

DROP POLICY IF EXISTS "contests_public_read" ON public.contests;
CREATE POLICY "contests_public_read"
  ON public.contests
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "contests_admin_insert" ON public.contests;
CREATE POLICY "contests_admin_insert"
  ON public.contests
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contests_admin_update" ON public.contests;
CREATE POLICY "contests_admin_update"
  ON public.contests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contests_admin_delete" ON public.contests;
CREATE POLICY "contests_admin_delete"
  ON public.contests
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contest_problems_admin_select" ON public.contest_problems;
CREATE POLICY "contest_problems_admin_select"
  ON public.contest_problems
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contest_problems_admin_insert" ON public.contest_problems;
CREATE POLICY "contest_problems_admin_insert"
  ON public.contest_problems
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contest_problems_admin_update" ON public.contest_problems;
CREATE POLICY "contest_problems_admin_update"
  ON public.contest_problems
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contest_problems_admin_delete" ON public.contest_problems;
CREATE POLICY "contest_problems_admin_delete"
  ON public.contest_problems
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contest_submissions_select_own" ON public.contest_submissions;
CREATE POLICY "contest_submissions_select_own"
  ON public.contest_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contest_submissions_insert_own" ON public.contest_submissions;
CREATE POLICY "contest_submissions_insert_own"
  ON public.contest_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_contest_active(contest_id)
    AND EXISTS (
      SELECT 1
      FROM public.contest_registrations cr
      JOIN public.contest_problems cp
        ON cp.id = contest_submissions.problem_id
       AND cp.contest_id = contest_submissions.contest_id
       AND cp.grade = cr.grade
      WHERE cr.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "contest_submissions_update_own" ON public.contest_submissions;
CREATE POLICY "contest_submissions_update_own"
  ON public.contest_submissions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND public.is_contest_active(contest_id)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_contest_active(contest_id)
    AND EXISTS (
      SELECT 1
      FROM public.contest_registrations cr
      JOIN public.contest_problems cp
        ON cp.id = contest_submissions.problem_id
       AND cp.contest_id = contest_submissions.contest_id
       AND cp.grade = cr.grade
      WHERE cr.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "contest_submissions_admin_select" ON public.contest_submissions;
CREATE POLICY "contest_submissions_admin_select"
  ON public.contest_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contest_submissions_admin_update" ON public.contest_submissions;
CREATE POLICY "contest_submissions_admin_update"
  ON public.contest_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contest_submissions_admin_delete" ON public.contest_submissions;
CREATE POLICY "contest_submissions_admin_delete"
  ON public.contest_submissions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.contests IS 'Contest schedule for PLANCK competitions';
COMMENT ON COLUMN public.contests.start_time IS 'Contest start time stored as timestamptz; insert in +03:00 or UTC';
COMMENT ON TABLE public.contest_problems IS 'Multiple-choice contest problems by grade and display order';
COMMENT ON COLUMN public.contest_problems.correct_answer IS 'Correct option; hidden from participants through secure server functions';
COMMENT ON TABLE public.contest_submissions IS 'Auto-saved participant answers during active contests';
