-- Tags on learning-path chapters. The reserved tag `arhiva` sends a path to the
-- /invata archive section instead of the main list.

alter table public.learning_path_chapters
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists idx_learning_path_chapters_tags
  on public.learning_path_chapters using gin (tags);

comment on column public.learning_path_chapters.tags is
  'Etichete libere pe traseu. Tag-ul rezervat `arhiva` afișează traseul în arhiva de pe /invata.';
