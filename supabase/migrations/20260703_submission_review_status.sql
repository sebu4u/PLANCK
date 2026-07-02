-- Track teacher review of student homework submissions (photo attachments).

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

DROP POLICY IF EXISTS "submissions_update_teacher_review" ON public.submissions;
CREATE POLICY "submissions_update_teacher_review"
  ON public.submissions
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
