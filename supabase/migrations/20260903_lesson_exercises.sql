-- Solved exercises attached to text-course lessons (/invata/cursuri).
-- Polymorphic content_id points at problems / math_problems / coding_problems / quiz_questions.

create table if not exists public.lesson_exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  content_type text not null,
  content_id text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint lesson_exercises_content_type_check
    check (content_type in ('problem', 'math_problem', 'coding_problem', 'grila'))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesson_exercises_lesson_content_key'
      and conrelid = 'public.lesson_exercises'::regclass
  ) then
    alter table public.lesson_exercises
      add constraint lesson_exercises_lesson_content_key
      unique (lesson_id, content_type, content_id);
  end if;
end $$;

create index if not exists lesson_exercises_lesson_order_idx
  on public.lesson_exercises (lesson_id, order_index);

comment on table public.lesson_exercises is
  'Catalog problems/grile attached to a text-course lesson, shown in the Exerciții rezolvate tab.';

alter table if exists public.lesson_exercises enable row level security;

drop policy if exists "lesson_exercises_select_public" on public.lesson_exercises;
create policy "lesson_exercises_select_public"
  on public.lesson_exercises for select
  to anon, authenticated
  using (true);

drop policy if exists "lesson_exercises_insert_admin" on public.lesson_exercises;
create policy "lesson_exercises_insert_admin"
  on public.lesson_exercises for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "lesson_exercises_update_admin" on public.lesson_exercises;
create policy "lesson_exercises_update_admin"
  on public.lesson_exercises for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "lesson_exercises_delete_admin" on public.lesson_exercises;
create policy "lesson_exercises_delete_admin"
  on public.lesson_exercises for delete
  to authenticated
  using (public.is_admin());
