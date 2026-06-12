-- Subject tag per learning path chapter (for future /invata subject filtering).

alter table public.learning_path_chapters
  add column if not exists materie text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learning_path_chapters_materie_allowed'
      and conrelid = 'public.learning_path_chapters'::regclass
  ) then
    alter table public.learning_path_chapters
      add constraint learning_path_chapters_materie_allowed
      check (
        materie is null
        or materie in ('matematica', 'fizica', 'informatica', 'AI', 'biologie')
      );
  end if;
end $$;

comment on column public.learning_path_chapters.materie is
  'Materia parcursului: matematica, fizica, informatica, AI, biologie. Null până la setare manuală.';
