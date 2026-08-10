-- Practice tests (Exersează → /teste): curated timed tests + attempts

create table if not exists public.practice_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  subject text not null,
  class integer not null,
  chapter text not null default '',
  difficulty text not null,
  time_limit_seconds integer not null default 600,
  items jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_tests_subject_check
    check (subject in ('fizica', 'matematica', 'informatica')),
  constraint practice_tests_class_check
    check (class in (9, 10, 11, 12)),
  constraint practice_tests_difficulty_check
    check (difficulty in ('Ușor', 'Mediu', 'Avansat')),
  constraint practice_tests_time_limit_check
    check (time_limit_seconds >= 30 and time_limit_seconds <= 14400),
  constraint practice_tests_items_array_check
    check (jsonb_typeof(items) = 'array')
);

create index if not exists idx_practice_tests_published_filters
  on public.practice_tests (is_published, subject, class, difficulty);

create index if not exists idx_practice_tests_chapter
  on public.practice_tests (chapter);

create or replace function public.practice_tests_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_practice_tests_updated_at on public.practice_tests;
create trigger trg_practice_tests_updated_at
  before update on public.practice_tests
  for each row
  execute function public.practice_tests_set_updated_at();

alter table public.practice_tests enable row level security;

drop policy if exists "practice_tests_public_select_published" on public.practice_tests;
create policy "practice_tests_public_select_published"
  on public.practice_tests
  for select
  to anon, authenticated
  using (is_published = true);

grant select on public.practice_tests to anon, authenticated;


create table if not exists public.practice_test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.practice_tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  exceeded_time boolean not null default false,
  score_correct integer,
  score_total integer,
  answers jsonb not null default '{}'::jsonb,
  results jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_test_attempts_scores_nonneg
    check (
      (score_correct is null and score_total is null)
      or (
        score_correct is not null
        and score_total is not null
        and score_correct >= 0
        and score_total >= 0
        and score_correct <= score_total
      )
    )
);

create index if not exists idx_practice_test_attempts_user_started
  on public.practice_test_attempts (user_id, started_at desc);

create index if not exists idx_practice_test_attempts_test_user
  on public.practice_test_attempts (test_id, user_id);

create or replace function public.practice_test_attempts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_practice_test_attempts_updated_at on public.practice_test_attempts;
create trigger trg_practice_test_attempts_updated_at
  before update on public.practice_test_attempts
  for each row
  execute function public.practice_test_attempts_set_updated_at();

alter table public.practice_test_attempts enable row level security;

-- Users can read and create their own attempts; scoring writes go through service role.
drop policy if exists "practice_test_attempts_select_own" on public.practice_test_attempts;
create policy "practice_test_attempts_select_own"
  on public.practice_test_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "practice_test_attempts_insert_own" on public.practice_test_attempts;
create policy "practice_test_attempts_insert_own"
  on public.practice_test_attempts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.practice_test_attempts to authenticated;
