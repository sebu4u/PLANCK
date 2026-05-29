-- Short/custom title for the /invata mobile top bar (separate from chapter.title).

alter table public.learning_path_chapters
  add column if not exists nav_title text;

comment on column public.learning_path_chapters.nav_title is
  'Optional short title shown in the /invata mobile top bar; falls back to title when null.';
