-- Private photos on assignment submissions: visible to teachers only (storage + metadata RLS).

CREATE TABLE IF NOT EXISTS public.submission_teacher_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_submission_teacher_attachments_submission_id
  ON public.submission_teacher_attachments (submission_id);

GRANT SELECT, INSERT, DELETE ON TABLE public.submission_teacher_attachments TO authenticated;

ALTER TABLE public.submission_teacher_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submission_teacher_attachments_select_teacher" ON public.submission_teacher_attachments;
CREATE POLICY "submission_teacher_attachments_select_teacher"
  ON public.submission_teacher_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = submission_id
        AND public.is_classroom_teacher(a.classroom_id)
    )
  );

DROP POLICY IF EXISTS "submission_teacher_attachments_select_own_student" ON public.submission_teacher_attachments;
CREATE POLICY "submission_teacher_attachments_select_own_student"
  ON public.submission_teacher_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.submissions s
      WHERE s.id = submission_id
        AND s.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "submission_teacher_attachments_insert_own_student" ON public.submission_teacher_attachments;
CREATE POLICY "submission_teacher_attachments_insert_own_student"
  ON public.submission_teacher_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.classroom_members cm
        ON cm.classroom_id = a.classroom_id
       AND cm.user_id = auth.uid()
       AND cm.role = 'student'
      WHERE s.id = submission_id
        AND s.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "submission_teacher_attachments_delete_student_or_teacher" ON public.submission_teacher_attachments;
CREATE POLICY "submission_teacher_attachments_delete_student_or_teacher"
  ON public.submission_teacher_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      WHERE s.id = submission_id
        AND (
          s.student_id = auth.uid()
          OR public.is_classroom_teacher(a.classroom_id)
        )
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-teacher-attachments', 'assignment-teacher-attachments', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Path: {classroom_id}/{student_id}/{assignment_id}/{problem_id}/{filename}
DROP POLICY IF EXISTS "assignment_teacher_attachments_read_teacher" ON storage.objects;
CREATE POLICY "assignment_teacher_attachments_read_teacher"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assignment-teacher-attachments'
    AND public.is_classroom_teacher(public.classroom_id_from_storage_path(name))
  );

DROP POLICY IF EXISTS "assignment_teacher_attachments_insert_student" ON storage.objects;
CREATE POLICY "assignment_teacher_attachments_insert_student"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-teacher-attachments'
    AND public.classroom_id_from_storage_path(name) IS NOT NULL
    AND public.storage_user_id_from_path(name) = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      WHERE cm.classroom_id = public.classroom_id_from_storage_path(name)
        AND cm.user_id = auth.uid()
        AND cm.role = 'student'
    )
  );

DROP POLICY IF EXISTS "assignment_teacher_attachments_delete_student" ON storage.objects;
CREATE POLICY "assignment_teacher_attachments_delete_student"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assignment-teacher-attachments'
    AND public.storage_user_id_from_path(name) = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      WHERE cm.classroom_id = public.classroom_id_from_storage_path(name)
        AND cm.user_id = auth.uid()
        AND cm.role = 'student'
    )
  );
