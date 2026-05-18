-- Catalog probleme de matematică (separat de public.problems / fizică)

create table if not exists public.math_problems (
  id text primary key,
  title text not null,
  description text not null default '',
  statement text not null,
  tags text[] not null default '{}',
  answer_subpoints jsonb not null default '[]'::jsonb,
  class integer not null,
  difficulty text not null,
  image_url text,
  youtube_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint math_problems_class_check check (class in (9, 10, 11, 12)),
  constraint math_problems_difficulty_check check (difficulty in ('Ușor', 'Mediu', 'Avansat')),
  constraint math_problems_answer_subpoints_array_check check (
    jsonb_typeof(answer_subpoints) = 'array'
    and jsonb_array_length(answer_subpoints) <= 3
  )
);

create index if not exists idx_math_problems_created_at
  on public.math_problems (created_at desc);

create index if not exists idx_math_problems_class_difficulty
  on public.math_problems (class, difficulty);

create index if not exists idx_math_problems_tags
  on public.math_problems using gin (tags);

create or replace function public.math_problems_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_math_problems_updated_at on public.math_problems;
create trigger trg_math_problems_updated_at
  before update on public.math_problems
  for each row
  execute function public.math_problems_set_updated_at();

alter table public.math_problems enable row level security;

drop policy if exists "math_problems_public_select" on public.math_problems;
create policy "math_problems_public_select"
  on public.math_problems
  for select
  to anon, authenticated
  using (is_active = true);
