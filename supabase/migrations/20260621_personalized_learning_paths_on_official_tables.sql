-- Store AI-generated /invata courses in the official learning_path_* backend.
-- Generated chapters are user-scoped via generated_by_user_id, but render through
-- the same chapter/lesson/item tables, helpers, routes, components, and progress.

alter table public.learning_path_chapters
  add column if not exists generated_by_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists is_personalized boolean not null default false,
  add column if not exists original_prompt text,
  add column if not exists generation_status text not null default 'ready',
  add column if not exists source_summary jsonb not null default '[]'::jsonb,
  add column if not exists generation_metadata jsonb not null default '{}'::jsonb;

alter table public.learning_path_chapters
  drop constraint if exists learning_path_chapters_generation_status_check;

alter table public.learning_path_chapters
  add constraint learning_path_chapters_generation_status_check
  check (generation_status in ('creating', 'ready', 'failed'));

create index if not exists idx_learning_path_chapters_generated_user_created
  on public.learning_path_chapters (generated_by_user_id, created_at desc)
  where is_personalized = true;

create index if not exists idx_learning_path_chapters_official_order
  on public.learning_path_chapters (order_index)
  where is_personalized = false;

-- Generated chapters must stay user-owned; official chapters keep generated_by_user_id null.
create or replace function public.learning_path_chapter_is_visible(chapter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_path_chapters c
    where c.id = chapter_id
      and c.is_active = true
      and c.generation_status = 'ready'
      and (
        c.is_personalized = false
        or c.generated_by_user_id = auth.uid()
      )
  );
$$;

-- Replace broad public policies so personalized chapters/items are not visible to other users.
drop policy if exists "public_can_read_learning_path_chapters" on public.learning_path_chapters;
create policy "read_visible_learning_path_chapters"
  on public.learning_path_chapters
  for select
  to anon, authenticated
  using (
    is_active = true
    and generation_status = 'ready'
    and (
      is_personalized = false
      or generated_by_user_id = auth.uid()
    )
  );

drop policy if exists "public_can_read_learning_path_lessons" on public.learning_path_lessons;
create policy "read_visible_learning_path_lessons"
  on public.learning_path_lessons
  for select
  to anon, authenticated
  using (public.learning_path_chapter_is_visible(chapter_id));

drop policy if exists "public_can_read_learning_path_lesson_items" on public.learning_path_lesson_items;
create policy "read_visible_learning_path_lesson_items"
  on public.learning_path_lesson_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.learning_path_lessons l
      where l.id = learning_path_lesson_items.lesson_id
        and l.is_active = true
        and public.learning_path_chapter_is_visible(l.chapter_id)
    )
  );

-- Only service-role/admin code should create/update official or generated learning paths.
-- Do not grant INSERT/UPDATE/DELETE to anon/authenticated here.
grant select on public.learning_path_chapters to anon, authenticated;
grant select on public.learning_path_lessons to anon, authenticated;
grant select on public.learning_path_lesson_items to anon, authenticated;
