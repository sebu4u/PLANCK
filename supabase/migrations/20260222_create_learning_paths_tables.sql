-- Separate schema for /invata learning paths (not /cursuri).

create table if not exists public.learning_path_chapters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_path_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.learning_path_chapters(id) on delete cascade,
  title text not null,
  image_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_learning_path_chapters_order
  on public.learning_path_chapters(order_index);

create index if not exists idx_learning_path_lessons_chapter_order
  on public.learning_path_lessons(chapter_id, order_index);

alter table public.learning_path_chapters enable row level security;
alter table public.learning_path_lessons enable row level security;

drop policy if exists "public_can_read_learning_path_chapters" on public.learning_path_chapters;
create policy "public_can_read_learning_path_chapters"
  on public.learning_path_chapters
  for select
  using (true);

drop policy if exists "public_can_read_learning_path_lessons" on public.learning_path_lessons;
create policy "public_can_read_learning_path_lessons"
  on public.learning_path_lessons
  for select
  using (true);

grant select on public.learning_path_chapters to anon, authenticated;
grant select on public.learning_path_lessons to anon, authenticated;
