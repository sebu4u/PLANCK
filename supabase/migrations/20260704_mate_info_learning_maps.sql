-- Hărți /invata/mate și /invata/info: trasee -> capitole -> lecții -> referințe la itemii din learning paths.

create table if not exists public.mate_routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mate_routes_slug_allowed
    check (slug in ('algebra', 'geometrie', 'analiza', 'trigonometrie'))
);

create table if not exists public.mate_chapters (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.mate_routes(id) on delete cascade,
  slug text not null,
  title text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mate_chapters_route_slug_unique unique (route_id, slug)
);

create table if not exists public.mate_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.mate_chapters(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 0,
  lesson_type text not null default 'invata',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mate_lessons_type_allowed
    check (lesson_type in ('invata', 'scrie', 'exerseaza')),
  constraint mate_lessons_duration_non_negative
    check (duration_minutes >= 0)
);

create table if not exists public.mate_lesson_items (
  id uuid primary key default gen_random_uuid(),
  mate_lesson_id uuid not null references public.mate_lessons(id) on delete cascade,
  learning_path_lesson_item_id uuid not null references public.learning_path_lesson_items(id) on delete restrict,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mate_lesson_items_lesson_order_unique unique (mate_lesson_id, order_index),
  constraint mate_lesson_items_lesson_item_unique unique (mate_lesson_id, learning_path_lesson_item_id)
);

create table if not exists public.info_routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint info_routes_slug_allowed
    check (slug in ('algoritmi', 'structuri-date', 'grafuri', 'programare'))
);

create table if not exists public.info_chapters (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.info_routes(id) on delete cascade,
  slug text not null,
  title text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint info_chapters_route_slug_unique unique (route_id, slug)
);

create table if not exists public.info_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.info_chapters(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 0,
  lesson_type text not null default 'invata',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint info_lessons_type_allowed
    check (lesson_type in ('invata', 'scrie', 'exerseaza')),
  constraint info_lessons_duration_non_negative
    check (duration_minutes >= 0)
);

create table if not exists public.info_lesson_items (
  id uuid primary key default gen_random_uuid(),
  info_lesson_id uuid not null references public.info_lessons(id) on delete cascade,
  learning_path_lesson_item_id uuid not null references public.learning_path_lesson_items(id) on delete restrict,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint info_lesson_items_lesson_order_unique unique (info_lesson_id, order_index),
  constraint info_lesson_items_lesson_item_unique unique (info_lesson_id, learning_path_lesson_item_id)
);

create index if not exists idx_mate_routes_order on public.mate_routes (order_index);
create index if not exists idx_mate_chapters_route_order on public.mate_chapters (route_id, order_index);
create index if not exists idx_mate_lessons_chapter_order on public.mate_lessons (chapter_id, order_index);
create index if not exists idx_mate_lesson_items_lesson_order on public.mate_lesson_items (mate_lesson_id, order_index);

create index if not exists idx_info_routes_order on public.info_routes (order_index);
create index if not exists idx_info_chapters_route_order on public.info_chapters (route_id, order_index);
create index if not exists idx_info_lessons_chapter_order on public.info_lessons (chapter_id, order_index);
create index if not exists idx_info_lesson_items_lesson_order on public.info_lesson_items (info_lesson_id, order_index);

alter table public.mate_routes enable row level security;
alter table public.mate_chapters enable row level security;
alter table public.mate_lessons enable row level security;
alter table public.mate_lesson_items enable row level security;

alter table public.info_routes enable row level security;
alter table public.info_chapters enable row level security;
alter table public.info_lessons enable row level security;
alter table public.info_lesson_items enable row level security;

drop policy if exists "public_can_read_mate_routes" on public.mate_routes;
create policy "public_can_read_mate_routes"
  on public.mate_routes for select using (is_active = true);

drop policy if exists "public_can_read_mate_chapters" on public.mate_chapters;
create policy "public_can_read_mate_chapters"
  on public.mate_chapters for select using (is_active = true);

drop policy if exists "public_can_read_mate_lessons" on public.mate_lessons;
create policy "public_can_read_mate_lessons"
  on public.mate_lessons for select using (is_active = true);

drop policy if exists "public_can_read_mate_lesson_items" on public.mate_lesson_items;
create policy "public_can_read_mate_lesson_items"
  on public.mate_lesson_items for select using (true);

drop policy if exists "public_can_read_info_routes" on public.info_routes;
create policy "public_can_read_info_routes"
  on public.info_routes for select using (is_active = true);

drop policy if exists "public_can_read_info_chapters" on public.info_chapters;
create policy "public_can_read_info_chapters"
  on public.info_chapters for select using (is_active = true);

drop policy if exists "public_can_read_info_lessons" on public.info_lessons;
create policy "public_can_read_info_lessons"
  on public.info_lessons for select using (is_active = true);

drop policy if exists "public_can_read_info_lesson_items" on public.info_lesson_items;
create policy "public_can_read_info_lesson_items"
  on public.info_lesson_items for select using (true);

grant select on public.mate_routes to anon, authenticated;
grant select on public.mate_chapters to anon, authenticated;
grant select on public.mate_lessons to anon, authenticated;
grant select on public.mate_lesson_items to anon, authenticated;

grant select on public.info_routes to anon, authenticated;
grant select on public.info_chapters to anon, authenticated;
grant select on public.info_lessons to anon, authenticated;
grant select on public.info_lesson_items to anon, authenticated;

insert into public.mate_routes (slug, title, order_index)
values
  ('algebra', 'Algebră', 0),
  ('geometrie', 'Geometrie', 1),
  ('analiza', 'Analiză', 2),
  ('trigonometrie', 'Trigonometrie', 3)
on conflict (slug) do nothing;

insert into public.info_routes (slug, title, order_index)
values
  ('algoritmi', 'Algoritmi', 0),
  ('structuri-date', 'Structuri de date', 1),
  ('grafuri', 'Grafuri', 2),
  ('programare', 'Programare', 3)
on conflict (slug) do nothing;

comment on table public.mate_routes is 'Traseele afișate în sidebar-ul /invata/mate.';
comment on table public.info_routes is 'Traseele afișate în sidebar-ul /invata/info.';
