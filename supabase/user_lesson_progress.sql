-- ============================================
-- TABLE: user_lesson_progress
-- Tracks completed lessons per user
-- ============================================

create table if not exists public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_user_lesson_progress_user_id on public.user_lesson_progress(user_id);
create index if not exists idx_user_lesson_progress_lesson_id on public.user_lesson_progress(lesson_id);

-- ============================================
-- RLS POLICIES
-- ============================================
alter table public.user_lesson_progress enable row level security;

-- Allow users to view their own progress
create policy "user_lesson_progress_select_own"
  on public.user_lesson_progress for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow users to insert their own progress
create policy "user_lesson_progress_insert_own"
  on public.user_lesson_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to delete their own progress (optional, if we want to allow un-completing)
create policy "user_lesson_progress_delete_own"
  on public.user_lesson_progress for delete
  to authenticated
  using (auth.uid() = user_id);
