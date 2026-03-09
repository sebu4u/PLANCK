create extension if not exists unaccent;

-- Ensure columns from 20260228 exist (in case that migration was not run)
alter table public.learning_path_lessons
  add column if not exists lesson_type text not null default 'text',
  add column if not exists cursuri_lesson_slug text,
  add column if not exists youtube_url text,
  add column if not exists quiz_question_id uuid references public.quiz_questions(id) on delete set null,
  add column if not exists problem_id text;

alter table public.learning_path_lessons
  drop constraint if exists learning_path_lessons_lesson_type_check;

alter table public.learning_path_lessons
  add constraint learning_path_lessons_lesson_type_check
  check (lesson_type in ('text', 'video', 'grila', 'problem'));

create index if not exists idx_learning_path_lessons_quiz_question_id
  on public.learning_path_lessons(quiz_question_id);

create index if not exists idx_learning_path_lessons_problem_id
  on public.learning_path_lessons(problem_id);

alter table public.learning_path_lessons
  add column if not exists slug text;

with lesson_sources as (
  select
    id,
    chapter_id,
    order_index,
    created_at,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(lower(unaccent(title)), '[^a-z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        ''
      ),
      'lectie'
    ) as base_slug
  from public.learning_path_lessons
),
ranked_slugs as (
  select
    id,
    case
      when row_number() over (
        partition by chapter_id, base_slug
        order by order_index, created_at, id
      ) = 1 then base_slug
      else base_slug || '-' || row_number() over (
        partition by chapter_id, base_slug
        order by order_index, created_at, id
      )
    end as resolved_slug
  from lesson_sources
)
update public.learning_path_lessons as lessons
set slug = ranked_slugs.resolved_slug
from ranked_slugs
where lessons.id = ranked_slugs.id
  and coalesce(nullif(btrim(lessons.slug), ''), '') = '';

create unique index if not exists idx_learning_path_lessons_chapter_slug
  on public.learning_path_lessons(chapter_id, slug)
  where slug is not null;

create table if not exists public.learning_path_lesson_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.learning_path_lessons(id) on delete cascade,
  item_type text not null,
  title text,
  cursuri_lesson_slug text,
  youtube_url text,
  quiz_question_id uuid references public.quiz_questions(id) on delete set null,
  problem_id text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_path_lesson_items_item_type_check
    check (item_type in ('text', 'video', 'grila', 'problem'))
);

create index if not exists idx_learning_path_lesson_items_lesson_order
  on public.learning_path_lesson_items(lesson_id, order_index);

create unique index if not exists idx_learning_path_lesson_items_lesson_order_unique
  on public.learning_path_lesson_items(lesson_id, order_index);

create index if not exists idx_learning_path_lesson_items_quiz_question_id
  on public.learning_path_lesson_items(quiz_question_id);

create index if not exists idx_learning_path_lesson_items_problem_id
  on public.learning_path_lesson_items(problem_id);

alter table public.learning_path_lesson_items enable row level security;

drop policy if exists "public_can_read_learning_path_lesson_items" on public.learning_path_lesson_items;
create policy "public_can_read_learning_path_lesson_items"
  on public.learning_path_lesson_items
  for select
  using (true);

grant select on public.learning_path_lesson_items to anon, authenticated;

insert into public.learning_path_lesson_items (
  lesson_id,
  item_type,
  title,
  cursuri_lesson_slug,
  youtube_url,
  quiz_question_id,
  problem_id,
  order_index
)
select
  lessons.id,
  lessons.lesson_type,
  lessons.title,
  lessons.cursuri_lesson_slug,
  lessons.youtube_url,
  lessons.quiz_question_id,
  lessons.problem_id,
  0
from public.learning_path_lessons as lessons
where (
  coalesce(nullif(btrim(lessons.cursuri_lesson_slug), ''), '') <> ''
  or coalesce(nullif(btrim(lessons.youtube_url), ''), '') <> ''
  or lessons.quiz_question_id is not null
  or coalesce(nullif(btrim(lessons.problem_id), ''), '') <> ''
)
on conflict (lesson_id, order_index) do nothing;
