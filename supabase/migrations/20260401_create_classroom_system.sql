-- Classroom system: schema, constraints, RLS, helper functions, and storage bucket.

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  join_code text NOT NULL UNIQUE CHECK (join_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.classroom_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  joined_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (classroom_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '',
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.assignment_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  problem_id text NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  UNIQUE (assignment_id, problem_id)
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  problem_id text NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer text NOT NULL CHECK (char_length(trim(answer)) > 0),
  is_correct boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (assignment_id, problem_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text', 'image', 'file', 'lesson')),
  content text,
  file_url text,
  lesson_slug text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_payload_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_payload_check
  CHECK (
    (
      type = 'text'
      AND content IS NOT NULL
      AND char_length(trim(content)) > 0
      AND file_url IS NULL
      AND lesson_slug IS NULL
    )
    OR (
      type = 'image'
      AND file_url IS NOT NULL
      AND lesson_slug IS NULL
    )
    OR (
      type = 'file'
      AND file_url IS NOT NULL
      AND lesson_slug IS NULL
    )
    OR (
      type = 'lesson'
      AND lesson_slug IS NOT NULL
      AND file_url IS NULL
    )
  );

-- Ensure role privileges exist (RLS still enforces row-level access).
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.classrooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.classroom_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assignment_problems TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated;

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id
  ON public.classrooms (teacher_id);

CREATE INDEX IF NOT EXISTS idx_classrooms_join_code
  ON public.classrooms (join_code);

CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id
  ON public.classroom_members (classroom_id);

CREATE INDEX IF NOT EXISTS idx_classroom_members_user_id
  ON public.classroom_members (user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_classroom_id
  ON public.assignments (classroom_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignment_problems_assignment_id
  ON public.assignment_problems (assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_problems_problem_id
  ON public.assignment_problems (problem_id);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id
  ON public.submissions (assignment_id);

CREATE INDEX IF NOT EXISTS idx_submissions_student_id
  ON public.submissions (student_id);

CREATE INDEX IF NOT EXISTS idx_announcements_classroom_id
  ON public.announcements (classroom_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_classroom_member(
  target_classroom uuid,
  target_user uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = target_classroom
      AND cm.user_id = target_user
  );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_teacher(
  target_classroom uuid,
  target_user uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = target_classroom
      AND c.teacher_id = target_user
  );
$$;

CREATE OR REPLACE FUNCTION public.classroom_id_from_storage_path(path text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  first_segment text;
BEGIN
  first_segment := split_part(path, '/', 1);
  RETURN first_segment::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.storage_user_id_from_path(path text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  second_segment text;
BEGIN
  second_segment := split_part(path, '/', 2);
  RETURN second_segment::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_classroom_members_overview(target_classroom uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role text,
  joined_at timestamptz,
  name text,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.is_classroom_member(target_classroom, auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cm.id AS member_id,
    cm.user_id,
    cm.role,
    cm.joined_at,
    COALESCE(NULLIF(p.nickname, ''), NULLIF(p.name, ''), 'Student') AS name,
    COALESCE(au.email, '') AS email
  FROM public.classroom_members cm
  LEFT JOIN public.profiles p ON p.user_id = cm.user_id
  LEFT JOIN auth.users au ON au.id = cm.user_id
  WHERE cm.classroom_id = target_classroom
  ORDER BY
    CASE WHEN cm.role = 'teacher' THEN 0 ELSE 1 END,
    cm.joined_at ASC;
END;
$$;

DROP TRIGGER IF EXISTS trg_assignment_problems_only_grila ON public.assignment_problems;
DROP FUNCTION IF EXISTS public.ensure_assignment_problem_grila();

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classrooms_select_members" ON public.classrooms;
CREATE POLICY "classrooms_select_members"
  ON public.classrooms
  FOR SELECT
  TO authenticated
  USING (public.is_classroom_member(id));

DROP POLICY IF EXISTS "classrooms_insert_teacher" ON public.classrooms;
CREATE POLICY "classrooms_insert_teacher"
  ON public.classrooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND teacher_id = auth.uid());

DROP POLICY IF EXISTS "classrooms_update_teacher" ON public.classrooms;
CREATE POLICY "classrooms_update_teacher"
  ON public.classrooms
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "classrooms_delete_teacher" ON public.classrooms;
CREATE POLICY "classrooms_delete_teacher"
  ON public.classrooms
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "classroom_members_select_classroom_members" ON public.classroom_members;
CREATE POLICY "classroom_members_select_classroom_members"
  ON public.classroom_members
  FOR SELECT
  TO authenticated
  USING (public.is_classroom_member(classroom_id));

DROP POLICY IF EXISTS "classroom_members_insert_teacher_row" ON public.classroom_members;
CREATE POLICY "classroom_members_insert_teacher_row"
  ON public.classroom_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND role = 'teacher'
    AND public.is_classroom_teacher(classroom_id)
  );

DROP POLICY IF EXISTS "classroom_members_insert_student_row" ON public.classroom_members;
CREATE POLICY "classroom_members_insert_student_row"
  ON public.classroom_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND role = 'student'
    AND EXISTS (
      SELECT 1
      FROM public.classrooms c
      WHERE c.id = classroom_id
    )
  );

DROP POLICY IF EXISTS "classroom_members_delete_teacher_or_self" ON public.classroom_members;
CREATE POLICY "classroom_members_delete_teacher_or_self"
  ON public.classroom_members
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      public.is_classroom_teacher(classroom_id)
      AND role = 'student'
    )
  );

DROP POLICY IF EXISTS "assignments_select_members" ON public.assignments;
CREATE POLICY "assignments_select_members"
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (public.is_classroom_member(classroom_id));

DROP POLICY IF EXISTS "assignments_insert_teacher" ON public.assignments;
CREATE POLICY "assignments_insert_teacher"
  ON public.assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_classroom_teacher(classroom_id));

DROP POLICY IF EXISTS "assignments_update_teacher" ON public.assignments;
CREATE POLICY "assignments_update_teacher"
  ON public.assignments
  FOR UPDATE
  TO authenticated
  USING (public.is_classroom_teacher(classroom_id))
  WITH CHECK (public.is_classroom_teacher(classroom_id));

DROP POLICY IF EXISTS "assignments_delete_teacher" ON public.assignments;
CREATE POLICY "assignments_delete_teacher"
  ON public.assignments
  FOR DELETE
  TO authenticated
  USING (public.is_classroom_teacher(classroom_id));

DROP POLICY IF EXISTS "assignment_problems_select_members" ON public.assignment_problems;
CREATE POLICY "assignment_problems_select_members"
  ON public.assignment_problems
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_classroom_member(a.classroom_id)
    )
  );

DROP POLICY IF EXISTS "assignment_problems_insert_teacher" ON public.assignment_problems;
CREATE POLICY "assignment_problems_insert_teacher"
  ON public.assignment_problems
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_classroom_teacher(a.classroom_id)
    )
  );

DROP POLICY IF EXISTS "assignment_problems_update_teacher" ON public.assignment_problems;
CREATE POLICY "assignment_problems_update_teacher"
  ON public.assignment_problems
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_classroom_teacher(a.classroom_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_classroom_teacher(a.classroom_id)
    )
  );

DROP POLICY IF EXISTS "assignment_problems_delete_teacher" ON public.assignment_problems;
CREATE POLICY "assignment_problems_delete_teacher"
  ON public.assignment_problems
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_classroom_teacher(a.classroom_id)
    )
  );

DROP POLICY IF EXISTS "submissions_select_student_or_teacher" ON public.submissions;
CREATE POLICY "submissions_select_student_or_teacher"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_classroom_teacher(a.classroom_id)
    )
  );

DROP POLICY IF EXISTS "submissions_insert_student" ON public.submissions;
CREATE POLICY "submissions_insert_student"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND student_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.classroom_members cm
        ON cm.classroom_id = a.classroom_id
      WHERE a.id = assignment_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'student'
    )
    AND EXISTS (
      SELECT 1
      FROM public.assignment_problems ap
      WHERE ap.assignment_id = assignment_id
        AND ap.problem_id = problem_id
    )
  );

DROP POLICY IF EXISTS "submissions_update_student" ON public.submissions;
CREATE POLICY "submissions_update_student"
  ON public.submissions
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.classroom_members cm
        ON cm.classroom_id = a.classroom_id
      WHERE a.id = assignment_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'student'
    )
  );

DROP POLICY IF EXISTS "announcements_select_members" ON public.announcements;
CREATE POLICY "announcements_select_members"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (public.is_classroom_member(classroom_id));

DROP POLICY IF EXISTS "announcements_insert_teacher" ON public.announcements;
CREATE POLICY "announcements_insert_teacher"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND public.is_classroom_teacher(classroom_id)
  );

DROP POLICY IF EXISTS "announcements_update_teacher" ON public.announcements;
CREATE POLICY "announcements_update_teacher"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    public.is_classroom_teacher(classroom_id)
    AND author_id = auth.uid()
  )
  WITH CHECK (
    public.is_classroom_teacher(classroom_id)
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "announcements_delete_teacher" ON public.announcements;
CREATE POLICY "announcements_delete_teacher"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    public.is_classroom_teacher(classroom_id)
    AND author_id = auth.uid()
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('classroom-files', 'classroom-files', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "classroom_files_read_members" ON storage.objects;
CREATE POLICY "classroom_files_read_members"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'classroom-files'
    AND public.is_classroom_member(public.classroom_id_from_storage_path(name))
  );

DROP POLICY IF EXISTS "classroom_files_insert_teacher" ON storage.objects;
CREATE POLICY "classroom_files_insert_teacher"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'classroom-files'
    AND public.classroom_id_from_storage_path(name) IS NOT NULL
    AND public.storage_user_id_from_path(name) = auth.uid()
    AND public.is_classroom_teacher(public.classroom_id_from_storage_path(name))
  );

DROP POLICY IF EXISTS "classroom_files_update_teacher" ON storage.objects;
CREATE POLICY "classroom_files_update_teacher"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'classroom-files'
    AND public.is_classroom_teacher(public.classroom_id_from_storage_path(name))
  )
  WITH CHECK (
    bucket_id = 'classroom-files'
    AND public.is_classroom_teacher(public.classroom_id_from_storage_path(name))
  );

DROP POLICY IF EXISTS "classroom_files_delete_teacher" ON storage.objects;
CREATE POLICY "classroom_files_delete_teacher"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'classroom-files'
    AND public.is_classroom_teacher(public.classroom_id_from_storage_path(name))
  );
