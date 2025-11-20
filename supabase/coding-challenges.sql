-- =============================================
-- Coding Challenges System (Informatică)
-- =============================================
-- Acest script definește tabelele, indexurile, politicile RLS și trigger-ele
-- necesare pentru a gestiona problemele de informatică, testele asociate,
-- soluțiile trimise de utilizatori și progresul acestora.

-- Notă: pagina pentru problemele de informatică poate folosi acest set de tabele,
-- separat de catalogul existent de probleme de fizică.

-- =============================================
-- 1. Tabela principală cu problemele de informatică
-- =============================================

create table if not exists public.coding_problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  statement_markdown text not null,
  difficulty text not null default 'Ușor',
  class integer default 9,
  chapter text default 'Capitol neclasificat',
  points integer not null default 100 check (points >= 0),
  time_limit_ms integer not null default 2000 check (time_limit_ms > 0),
  memory_limit_kb integer not null default 256000 check (memory_limit_kb > 0),
  tags text[] not null default '{}',
  is_active boolean not null default true,
  sample_input text,
  sample_output text,
  explanation_markdown text,
  boilerplate_cpp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.coding_problems
  add column if not exists difficulty text default 'Ușor',
  add column if not exists class integer default 9,
  add column if not exists chapter text default 'Capitol neclasificat';

alter table if exists public.coding_problems
  alter column difficulty set default 'Ușor',
  alter column class set default 9,
  alter column chapter set default 'Capitol neclasificat';

update public.coding_problems
set difficulty = coalesce(difficulty, 'Ușor'),
    class = coalesce(class, 9),
    chapter = coalesce(nullif(trim(chapter), ''), 'Capitol neclasificat')
where difficulty is null
   or class is null
   or chapter is null
   or trim(coalesce(chapter, '')) = '';

alter table if exists public.coding_problems
  alter column difficulty set not null,
  alter column class set not null,
  alter column chapter set not null;

do $$
begin
  alter table public.coding_problems
    add constraint coding_problems_difficulty_check
      check (difficulty in ('Ușor', 'Mediu', 'Avansat', 'Concurs'))
    not valid;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.coding_problems
    add constraint coding_problems_class_check
      check (class in (9, 10, 11, 12))
    not valid;
exception
  when duplicate_object then null;
end;
$$;

alter table if exists public.coding_problems
  validate constraint coding_problems_difficulty_check;

alter table if exists public.coding_problems
  validate constraint coding_problems_class_check;

create index if not exists idx_coding_problems_active
  on public.coding_problems (is_active, difficulty);

create index if not exists idx_coding_problems_class_chapter
  on public.coding_problems (class, chapter);

create index if not exists idx_coding_problems_created_at
  on public.coding_problems (created_at desc);

-- Trigger pentru actualizarea coloanei updated_at
create or replace function public.coding_problems_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_coding_problems_updated_at on public.coding_problems;
create trigger trg_coding_problems_updated_at
  before update on public.coding_problems
  for each row
  execute function public.coding_problems_set_updated_at();

-- =============================================
-- 2. Testele asociate unei probleme
-- =============================================

create table if not exists public.coding_problem_tests (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  stdin text not null default '',
  expected_stdout text not null default '',
  is_sample boolean not null default false,
  weight numeric(6,2) not null default 1.0 check (weight >= 0),
  order_index integer not null default 0,
  time_limit_ms integer check (time_limit_ms > 0),
  memory_limit_kb integer check (memory_limit_kb > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_coding_problem_tests_problem
  on public.coding_problem_tests (problem_id, is_sample, order_index);

-- =============================================
-- 3. Submisiile utilizatorilor
-- =============================================

create table if not exists public.coding_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  status text not null check (
    status in (
      'pending',
      'accepted',
      'partial',
      'wrong_answer',
      'runtime_error',
      'compile_error',
      'time_limit_exceeded',
      'memory_limit_exceeded',
      'internal_error'
    )
  ),
  score numeric(6,2) not null default 0 check (score >= 0),
  total_tests integer,
  passed_tests integer,
  judge0_submission_id text,
  stdout text,
  stderr text,
  compile_output text,
  time_ms numeric(10,3),
  memory_kb integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coding_submissions_user
  on public.coding_submissions (user_id, created_at desc);

create index if not exists idx_coding_submissions_problem
  on public.coding_submissions (problem_id, created_at desc);

create index if not exists idx_coding_submissions_status
  on public.coding_submissions (status);

create or replace function public.coding_submissions_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_coding_submissions_updated_at on public.coding_submissions;
create trigger trg_coding_submissions_updated_at
  before update on public.coding_submissions
  for each row
  execute function public.coding_submissions_set_updated_at();

-- =============================================
-- 4. Rezultatul per test pentru o submisie
-- =============================================

create table if not exists public.coding_submission_tests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.coding_submissions(id) on delete cascade,
  test_id uuid not null references public.coding_problem_tests(id) on delete cascade,
  status text not null check (
    status in (
      'passed',
      'failed',
      'time_limit_exceeded',
      'memory_limit_exceeded',
      'runtime_error',
      'compile_error',
      'internal_error'
    )
  ),
  score numeric(6,2) not null default 0 check (score >= 0),
  time_ms numeric(10,3),
  memory_kb integer,
  stdout text,
  stderr text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_coding_submission_tests_unique
  on public.coding_submission_tests (submission_id, test_id);

create index if not exists idx_coding_submission_tests_submission
  on public.coding_submission_tests (submission_id);

-- =============================================
-- 5. Progresul per utilizator / problemă
-- =============================================

create table if not exists public.coding_problem_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  best_score numeric(6,2) not null default 0 check (best_score >= 0),
  best_status text not null default 'pending',
  last_submission_id uuid references public.coding_submissions(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create index if not exists idx_coding_problem_progress_problem
  on public.coding_problem_progress (problem_id);

-- Funcție pentru actualizarea progresului după fiecare submisie
create or replace function public.coding_touch_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_score numeric(6,2);
begin
  select best_score into previous_score
  from public.coding_problem_progress
  where user_id = new.user_id and problem_id = new.problem_id;

  insert into public.coding_problem_progress (
    user_id,
    problem_id,
    best_score,
    best_status,
    last_submission_id,
    updated_at
  )
  values (
    new.user_id,
    new.problem_id,
    new.score,
    new.status,
    new.id,
    now()
  )
  on conflict (user_id, problem_id)
  do update
  set
    best_score = greatest(excluded.best_score, public.coding_problem_progress.best_score),
    best_status = case
      when excluded.best_score >= public.coding_problem_progress.best_score
        then excluded.best_status
      else public.coding_problem_progress.best_status
    end,
    last_submission_id = case
      when excluded.best_score >= public.coding_problem_progress.best_score
        then excluded.last_submission_id
      else public.coding_problem_progress.last_submission_id
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_coding_touch_progress on public.coding_submissions;
create trigger trg_coding_touch_progress
  after insert on public.coding_submissions
  for each row
  execute function public.coding_touch_progress();

-- =============================================
-- 6. Activarea RLS și politici
-- =============================================

alter table if exists public.coding_problems enable row level security;
alter table if exists public.coding_problem_tests enable row level security;
alter table if exists public.coding_submissions enable row level security;
alter table if exists public.coding_submission_tests enable row level security;
alter table if exists public.coding_problem_progress enable row level security;

-- === coding_problems ===
drop policy if exists "coding_problems_public_select" on public.coding_problems;
create policy "coding_problems_public_select"
  on public.coding_problems
  for select
  to anon, authenticated
  using (is_active = true);

-- === coding_problem_tests ===
-- Doar testele marcate ca exemplu (is_sample) sunt vizibile public.
drop policy if exists "coding_problem_tests_select_samples" on public.coding_problem_tests;
create policy "coding_problem_tests_select_samples"
  on public.coding_problem_tests
  for select
  to anon, authenticated
  using (is_sample = true);

-- === coding_submissions ===
drop policy if exists "coding_submissions_select_own" on public.coding_submissions;
create policy "coding_submissions_select_own"
  on public.coding_submissions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "coding_submissions_insert_own" on public.coding_submissions;
create policy "coding_submissions_insert_own"
  on public.coding_submissions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- === coding_submission_tests ===
drop policy if exists "coding_submission_tests_select_own" on public.coding_submission_tests;
create policy "coding_submission_tests_select_own"
  on public.coding_submission_tests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.coding_submissions s
      where s.id = submission_id
        and s.user_id = (select auth.uid())
    )
  );

-- === coding_problem_progress ===
drop policy if exists "coding_problem_progress_select_own" on public.coding_problem_progress;
create policy "coding_problem_progress_select_own"
  on public.coding_problem_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "coding_problem_progress_insert_own" on public.coding_problem_progress;
create policy "coding_problem_progress_insert_own"
  on public.coding_problem_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "coding_problem_progress_update_own" on public.coding_problem_progress;
create policy "coding_problem_progress_update_own"
  on public.coding_problem_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================
-- Sfârșitul scriptului
-- =============================================


