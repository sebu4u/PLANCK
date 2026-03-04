alter table public.learning_path_chapters
  add column if not exists slug text;

create unique index if not exists idx_learning_path_chapters_slug
  on public.learning_path_chapters(slug)
  where slug is not null;
