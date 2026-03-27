-- Results table for Concursul National de Fizica PLANCK.
-- Stores public rankings separated by grade (IX-XII).

CREATE TABLE IF NOT EXISTS public.contest_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grade text NOT NULL CHECK (grade IN ('IX', 'X', 'XI', 'XII')),
  position integer NOT NULL CHECK (position >= 1),
  student_name text NOT NULL,
  school text NOT NULL,
  score numeric(6, 2) NOT NULL CHECK (score >= 0),
  prize text NOT NULL DEFAULT '-',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contest_results_grade_position
  ON public.contest_results (grade, position);

ALTER TABLE public.contest_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contest_results_public_read" ON public.contest_results;
CREATE POLICY "contest_results_public_read"
  ON public.contest_results
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "contest_results_admin_insert" ON public.contest_results;
CREATE POLICY "contest_results_admin_insert"
  ON public.contest_results
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contest_results_admin_update" ON public.contest_results;
CREATE POLICY "contest_results_admin_update"
  ON public.contest_results
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contest_results_admin_delete" ON public.contest_results;
CREATE POLICY "contest_results_admin_delete"
  ON public.contest_results
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.contest_results IS 'Official rankings for Concursul National de Fizica PLANCK';
COMMENT ON COLUMN public.contest_results.grade IS 'Student grade: IX, X, XI, XII';
COMMENT ON COLUMN public.contest_results.position IS 'Ranking number displayed in the table';
COMMENT ON COLUMN public.contest_results.score IS 'Final score of the participant';
