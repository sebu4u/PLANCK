-- Public bucket for AI-generated lesson/chapter covers for personalized courses.
-- Public read (no auth) because chapter/lesson rows are already publicly readable.
-- Writes happen only via the service_role key (admin client) — there is no
-- client-side upload path, so no INSERT/UPDATE/DELETE policies are defined.

INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-images', 'lesson-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "lesson_images_public_read" ON storage.objects;
CREATE POLICY "lesson_images_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'lesson-images');
