-- Extindere catalog grile: suport biologie (titlu, tag-uri, răspunsuri multiple, media).

alter table public.quiz_questions
  add column if not exists materie text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists tags text[] default '{}'::text[] not null,
  add column if not exists correct_answers text[] default '{}'::text[] not null,
  add column if not exists image_url text,
  add column if not exists video_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quiz_questions_materie_allowed'
      and conrelid = 'public.quiz_questions'::regclass
  ) then
    alter table public.quiz_questions
      add constraint quiz_questions_materie_allowed
      check (
        materie is null
        or materie in ('fizica', 'biologie')
      );
  end if;
end $$;

update public.quiz_questions
set materie = 'fizica'
where materie is null;

create index if not exists idx_quiz_questions_materie_class
  on public.quiz_questions (materie, class);

comment on column public.quiz_questions.materie is
  'Materia grilei: fizica sau biologie. Null tratat ca fizica pentru compatibilitate.';
comment on column public.quiz_questions.title is
  'Titlu scurt afișat în catalog și editor.';
comment on column public.quiz_questions.description is
  'Descriere suplimentară (opțională).';
comment on column public.quiz_questions.tags is
  'Etichete pentru filtrare și organizare.';
comment on column public.quiz_questions.correct_answers is
  'Răspunsuri corecte (A–F). Pentru biologie poate conține mai multe valori.';
comment on column public.quiz_questions.image_url is
  'URL imagine opțională randată în enunț.';
comment on column public.quiz_questions.video_url is
  'Link opțional către rezolvare video.';
