-- „Nou” pill on /invata mobile lesson cards (hub_show_nou_badge).

alter table public.learning_path_lessons
  add column if not exists hub_show_nou_badge boolean not null default false;

comment on column public.learning_path_lessons.hub_show_nou_badge is
  'When true, shows a green „nou” pill on the lesson card in the /invata mobile hub list.';
