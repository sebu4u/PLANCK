-- Trigram indexes for fast ILIKE search with leading wildcards
-- Supports WHERE title ILIKE '%query%' without full table scans
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_problems_title_trgm ON public.problems USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_problems_id_trgm ON public.problems USING gin (id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm ON public.lessons USING gin (title gin_trgm_ops);
