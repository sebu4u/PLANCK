-- User-scoped AI-generated courses for /invata.
-- These tables intentionally do not write into the official learning_path_* tables.

create table if not exists public.personalized_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_prompt text not null,
  title text not null,
  description text,
  status text not null default 'ready' check (status in ('creating', 'ready', 'failed')),
  source_summary jsonb not null default '[]'::jsonb,
  generation_metadata jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personalized_course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.personalized_courses(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, order_index),
  unique (id, course_id)
);

create table if not exists public.personalized_course_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null,
  course_id uuid not null references public.personalized_courses(id) on delete cascade,
  item_type text not null check (item_type in (
    'text',
    'video',
    'grila',
    'problem',
    'math_problem',
    'coding_problem',
    'poll',
    'custom_text',
    'simulation',
    'test',
    'card_sort',
    'fill_slot',
    'match',
    'graph_build',
    'code_trace',
    'swipe_classify',
    'flow_build',
    'slider_explore',
    'table_fill',
    'memory_flip',
    'speed_round',
    'reveal_steps'
  )),
  title text,
  source_type text not null default 'generated' check (source_type in (
    'generated',
    'learning_path_item',
    'problem',
    'quiz_question',
    'math_problem',
    'coding_problem',
    'lesson'
  )),
  source_id text,
  source_table text,
  source_title text,
  content_json jsonb not null default '{}'::jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personalized_course_items_lesson_course_fk
    foreign key (lesson_id, course_id)
    references public.personalized_course_lessons(id, course_id)
    on delete cascade,
  unique (lesson_id, order_index)
);

create table if not exists public.personalized_course_item_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.personalized_course_items(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists idx_personalized_courses_user_created
  on public.personalized_courses (user_id, created_at desc);

create index if not exists idx_personalized_course_lessons_course_order
  on public.personalized_course_lessons (course_id, order_index);

create index if not exists idx_personalized_course_items_lesson_order
  on public.personalized_course_items (lesson_id, order_index);

create index if not exists idx_personalized_course_items_course
  on public.personalized_course_items (course_id);

create index if not exists idx_personalized_course_item_progress_user
  on public.personalized_course_item_progress (user_id);

create or replace function public.personalized_courses_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_personalized_courses_updated_at on public.personalized_courses;
create trigger trg_personalized_courses_updated_at
  before update on public.personalized_courses
  for each row
  execute function public.personalized_courses_set_updated_at();

drop trigger if exists trg_personalized_course_lessons_updated_at on public.personalized_course_lessons;
create trigger trg_personalized_course_lessons_updated_at
  before update on public.personalized_course_lessons
  for each row
  execute function public.personalized_courses_set_updated_at();

drop trigger if exists trg_personalized_course_items_updated_at on public.personalized_course_items;
create trigger trg_personalized_course_items_updated_at
  before update on public.personalized_course_items
  for each row
  execute function public.personalized_courses_set_updated_at();

alter table public.personalized_courses enable row level security;
alter table public.personalized_course_lessons enable row level security;
alter table public.personalized_course_items enable row level security;
alter table public.personalized_course_item_progress enable row level security;

drop policy if exists "personalized_courses_select_own" on public.personalized_courses;
create policy "personalized_courses_select_own"
  on public.personalized_courses
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "personalized_courses_insert_own" on public.personalized_courses;
drop policy if exists "personalized_courses_update_own" on public.personalized_courses;
-- INSERT/UPDATE on courses/lessons/items is done via service-role (API) only.
-- Authenticated users can only SELECT their own courses and INSERT/UPDATE their own progress.

drop policy if exists "personalized_course_lessons_select_own" on public.personalized_course_lessons;
create policy "personalized_course_lessons_select_own"
  on public.personalized_course_lessons
  for select
  to authenticated
  using (
    exists (
      select 1 from public.personalized_courses c
      where c.id = personalized_course_lessons.course_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "personalized_course_lessons_insert_own" on public.personalized_course_lessons;
drop policy if exists "personalized_course_lessons_update_own" on public.personalized_course_lessons;

drop policy if exists "personalized_course_items_select_own" on public.personalized_course_items;
create policy "personalized_course_items_select_own"
  on public.personalized_course_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.personalized_courses c
      where c.id = personalized_course_items.course_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "personalized_course_items_insert_own" on public.personalized_course_items;
drop policy if exists "personalized_course_items_update_own" on public.personalized_course_items;

drop policy if exists "personalized_course_item_progress_select_own" on public.personalized_course_item_progress;
create policy "personalized_course_item_progress_select_own"
  on public.personalized_course_item_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "personalized_course_item_progress_insert_own" on public.personalized_course_item_progress;
create policy "personalized_course_item_progress_insert_own"
  on public.personalized_course_item_progress
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.personalized_course_items i
      join public.personalized_courses c on c.id = i.course_id
      where i.id = personalized_course_item_progress.item_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "personalized_course_item_progress_update_own" on public.personalized_course_item_progress;
create policy "personalized_course_item_progress_update_own"
  on public.personalized_course_item_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.personalized_course_items i
      join public.personalized_courses c on c.id = i.course_id
      where i.id = personalized_course_item_progress.item_id
        and c.user_id = auth.uid()
    )
  );

grant select on public.personalized_courses to authenticated;
grant select on public.personalized_course_lessons to authenticated;
grant select on public.personalized_course_items to authenticated;
grant select, insert, update on public.personalized_course_item_progress to authenticated;
