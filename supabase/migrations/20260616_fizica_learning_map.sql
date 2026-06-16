-- Harta /invata/fizica: trasee -> capitole -> lecții -> referințe la itemii existenți din learning paths.

create table if not exists public.fizica_routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fizica_routes_slug_allowed
    check (slug in ('mecanica', 'termodinamica', 'electricitate', 'optica'))
);

create table if not exists public.fizica_chapters (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.fizica_routes(id) on delete cascade,
  slug text not null,
  title text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fizica_chapters_route_slug_unique unique (route_id, slug)
);

create table if not exists public.fizica_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.fizica_chapters(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 0,
  lesson_type text not null default 'invata',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fizica_lessons_type_allowed
    check (lesson_type in ('invata', 'scrie', 'exerseaza')),
  constraint fizica_lessons_duration_non_negative
    check (duration_minutes >= 0)
);

create table if not exists public.fizica_lesson_items (
  id uuid primary key default gen_random_uuid(),
  fizica_lesson_id uuid not null references public.fizica_lessons(id) on delete cascade,
  learning_path_lesson_item_id uuid not null references public.learning_path_lesson_items(id) on delete restrict,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fizica_lesson_items_lesson_order_unique unique (fizica_lesson_id, order_index),
  constraint fizica_lesson_items_lesson_item_unique unique (fizica_lesson_id, learning_path_lesson_item_id)
);

create index if not exists idx_fizica_routes_order
  on public.fizica_routes (order_index);

create index if not exists idx_fizica_chapters_route_order
  on public.fizica_chapters (route_id, order_index);

create index if not exists idx_fizica_lessons_chapter_order
  on public.fizica_lessons (chapter_id, order_index);

create index if not exists idx_fizica_lesson_items_lesson_order
  on public.fizica_lesson_items (fizica_lesson_id, order_index);

alter table public.fizica_routes enable row level security;
alter table public.fizica_chapters enable row level security;
alter table public.fizica_lessons enable row level security;
alter table public.fizica_lesson_items enable row level security;

drop policy if exists "public_can_read_fizica_routes" on public.fizica_routes;
create policy "public_can_read_fizica_routes"
  on public.fizica_routes
  for select
  using (is_active = true);

drop policy if exists "public_can_read_fizica_chapters" on public.fizica_chapters;
create policy "public_can_read_fizica_chapters"
  on public.fizica_chapters
  for select
  using (is_active = true);

drop policy if exists "public_can_read_fizica_lessons" on public.fizica_lessons;
create policy "public_can_read_fizica_lessons"
  on public.fizica_lessons
  for select
  using (is_active = true);

drop policy if exists "public_can_read_fizica_lesson_items" on public.fizica_lesson_items;
create policy "public_can_read_fizica_lesson_items"
  on public.fizica_lesson_items
  for select
  using (true);

grant select on public.fizica_routes to anon, authenticated;
grant select on public.fizica_chapters to anon, authenticated;
grant select on public.fizica_lessons to anon, authenticated;
grant select on public.fizica_lesson_items to anon, authenticated;

insert into public.fizica_routes (slug, title, order_index)
values
  ('mecanica', 'Mecanică', 0),
  ('termodinamica', 'Termodinamică', 1),
  ('electricitate', 'Electricitate', 2),
  ('optica', 'Optică', 3)
on conflict (slug) do nothing;

comment on table public.fizica_routes is
  'Cele 4 trasee fixe afișate în sidebar-ul /invata/fizica.';
comment on table public.fizica_chapters is
  'Capitole administrabile, grupate pe traseu.';
comment on table public.fizica_lessons is
  'Lecții afișate pe harta fizică; conțin referințe la itemii existenți din learning paths.';
comment on table public.fizica_lesson_items is
  'Junction: ordinea itemilor din learning paths asignați unei lecții de pe harta fizică.';
