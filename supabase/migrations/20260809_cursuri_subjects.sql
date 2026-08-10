-- Multi-subject text courses: grades belong to a subject (fizica, mate, …).
-- Existing rows default to fizica. Seed empty class shells for other subjects.

alter table if exists public.grades
  add column if not exists subject text;

update public.grades
set subject = 'fizica'
where subject is null or btrim(subject) = '';

alter table if exists public.grades
  alter column subject set default 'fizica';

alter table if exists public.grades
  alter column subject set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'grades_subject_check'
      and conrelid = 'public.grades'::regclass
  ) then
    alter table public.grades
      add constraint grades_subject_check
      check (
        subject in (
          'fizica',
          'mate',
          'info-cpp',
          'info-py',
          'chimie',
          'biologie'
        )
      );
  end if;
end $$;

-- Drop legacy unique-on-grade_number constraints if present, then enforce (subject, grade_number).
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'grades'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%grade_number%'
      and pg_get_constraintdef(c.oid) not ilike '%subject%'
  loop
    execute format('alter table public.grades drop constraint %I', r.conname);
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'grades_subject_grade_number_key'
      and conrelid = 'public.grades'::regclass
  ) then
    alter table public.grades
      add constraint grades_subject_grade_number_key unique (subject, grade_number);
  end if;
end $$;

create index if not exists grades_subject_idx on public.grades (subject);

-- Seed classes 9–12 for every course subject (no-op if already present).
insert into public.grades (grade_number, name, description, order_index, is_active, subject)
select
  g.grade_number,
  g.name,
  g.description,
  g.order_index,
  true,
  s.subject
from (
  values
    (9, 'Clasa a IX-a', 'Cursuri pentru clasa a IX-a', 1),
    (10, 'Clasa a X-a', 'Cursuri pentru clasa a X-a', 2),
    (11, 'Clasa a XI-a', 'Cursuri pentru clasa a XI-a', 3),
    (12, 'Clasa a XII-a', 'Cursuri pentru clasa a XII-a', 4)
) as g(grade_number, name, description, order_index)
cross join (
  values
    ('fizica'),
    ('mate'),
    ('info-cpp'),
    ('info-py'),
    ('chimie'),
    ('biologie')
) as s(subject)
on conflict (subject, grade_number) do nothing;
