-- Insight chat: optional image attachments (e.g. handwritten solutions). Private bucket per-user paths.
-- App limits (enforced in UI + prepareInsightImageForUpload): max 3 images per message, max 10 MB per image after WebP/JPEG encoding; only authenticated users (RLS below).

ALTER TABLE public.insight_chat_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NULL;

COMMENT ON COLUMN public.insight_chat_messages.attachments IS
  'JSON array: [{ "bucket": "insight-attachments", "path": "<user_id>/<session_id>/<file>", "mime": "image/jpeg", "kind": "solution_sheet" }]';

INSERT INTO storage.buckets (id, name, public)
VALUES ('insight-attachments', 'insight-attachments', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Path: {user_id}/{session_id}/{filename}
DROP POLICY IF EXISTS "insight_attachments_select_own" ON storage.objects;
CREATE POLICY "insight_attachments_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'insight-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "insight_attachments_insert_own" ON storage.objects;
CREATE POLICY "insight_attachments_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'insight-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "insight_attachments_update_own" ON storage.objects;
CREATE POLICY "insight_attachments_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'insight-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'insight-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "insight_attachments_delete_own" ON storage.objects;
CREATE POLICY "insight_attachments_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'insight-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );
