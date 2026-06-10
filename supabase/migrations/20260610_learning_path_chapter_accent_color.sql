-- Dashboard accent color per learning path chapter (hex code, e.g. #7c3aed).

alter table public.learning_path_chapters
  add column if not exists accent_color text;

comment on column public.learning_path_chapters.accent_color is
  'Hex accent color for dashboard learning path cards (e.g. #7c3aed). Falls back to default purple when null.';
