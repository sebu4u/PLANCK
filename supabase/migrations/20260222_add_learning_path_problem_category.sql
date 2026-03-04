alter table public.learning_path_chapters
  add column if not exists problem_category text;
