-- Progress per learning_path_lesson for /invata segmented bar

create table if not exists public.user_learning_path_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.learning_path_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_user_lp_lesson_progress_user_id
  on public.user_learning_path_lesson_progress(user_id);

create index if not exists idx_user_lp_lesson_progress_lesson_id
  on public.user_learning_path_lesson_progress(lesson_id);

alter table public.user_learning_path_lesson_progress enable row level security;

create policy "user_lp_lesson_progress_select_own"
  on public.user_learning_path_lesson_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_lp_lesson_progress_insert_own"
  on public.user_learning_path_lesson_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_lp_lesson_progress_update_own"
  on public.user_learning_path_lesson_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_learning_path_lesson_progress to authenticated;
