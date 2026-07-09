-- Hidden chapter with custom per-subject/class lessons shown right after student onboarding.
-- Not listed in /invata, the dashboard carousel, or any subject map, but reachable directly
-- via /invata/onboarding-personalizat/<lesson-slug>/<itemIndex>.

alter table public.learning_path_chapters
  add column if not exists is_hidden boolean not null default false;

insert into public.learning_path_chapters (
  slug,
  title,
  nav_title,
  description,
  order_index,
  is_active,
  is_hidden
)
select
  'onboarding-personalizat',
  'Onboarding personalizat',
  'Onboarding',
  'Lecții custom afișate imediat după onboarding, în funcție de materia și clasa selectate.',
  -1,
  true,
  true
where not exists (
  select 1 from public.learning_path_chapters where slug = 'onboarding-personalizat'
);

with onboarding_chapter as (
  select id from public.learning_path_chapters where slug = 'onboarding-personalizat'
),
lessons(slug, title, order_index) as (
  values
    ('viteza', 'Viteza', 0),
    ('gazul-ideal', 'Gazul ideal', 1),
    ('pendulul', 'Pendulul', 2),
    ('optica', 'Optica', 3),
    ('introducere-matematica-onboarding', 'Introducere în matematică', 4),
    ('introducere-python-onboarding', 'Introducere în Python', 5)
)
insert into public.learning_path_lessons (chapter_id, slug, title, order_index, is_active)
select onboarding_chapter.id, lessons.slug, lessons.title, lessons.order_index, true
from onboarding_chapter
cross join lessons
where not exists (
  select 1
  from public.learning_path_lessons existing
  where existing.chapter_id = onboarding_chapter.id
    and existing.slug = lessons.slug
);

comment on column public.learning_path_chapters.is_hidden is
  'True pentru capitole care nu trebuie listate în /invata, dashboard sau hărțile de materie (ex. lecțiile custom de onboarding), dar rămân accesibile direct prin URL.';
