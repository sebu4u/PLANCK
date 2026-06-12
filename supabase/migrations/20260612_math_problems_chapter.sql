-- Capitol opțional pentru catalog matematică (ca la informatică / fizică)

alter table public.math_problems
  add column if not exists chapter text not null default '';

create index if not exists idx_math_problems_class_chapter
  on public.math_problems (class, chapter);
