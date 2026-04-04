-- Persist classroom header cover image (public URL path under /clase/...).

ALTER TABLE public.classrooms
  ADD COLUMN IF NOT EXISTS cover_image text;

ALTER TABLE public.classrooms
  DROP CONSTRAINT IF EXISTS classrooms_cover_image_check;

ALTER TABLE public.classrooms
  ADD CONSTRAINT classrooms_cover_image_check
  CHECK (
    cover_image IS NULL
    OR (
      cover_image ~ '^/clase/[A-Za-z0-9._-]+$'
      AND char_length(cover_image) <= 200
    )
  );
