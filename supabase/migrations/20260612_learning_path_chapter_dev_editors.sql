-- Per-chapter dev editor grants on learning paths.
-- NULL or {} = only super-dev / admin can edit until admin assigns devs explicitly.

alter table public.learning_path_chapters
  add column if not exists allowed_dev_user_ids uuid[] default null;

create index if not exists idx_learning_path_chapters_allowed_dev_user_ids
  on public.learning_path_chapters using gin (allowed_dev_user_ids)
  where allowed_dev_user_ids is not null;
