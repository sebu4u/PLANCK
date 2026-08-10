-- Classroom assignment / announcement notifications in the navbar bell.

-- ---------------------------------------------------------------------------
-- Allow classroom notification types
-- ---------------------------------------------------------------------------
alter table public.user_in_app_notifications
  drop constraint if exists user_in_app_notifications_type_check;

alter table public.user_in_app_notifications
  add constraint user_in_app_notifications_type_check
  check (type in ('workshop_reminder', 'classroom_assignment', 'classroom_announcement'));

-- ---------------------------------------------------------------------------
-- Optional classroom refs (cleanup when source rows are deleted)
-- ---------------------------------------------------------------------------
alter table public.user_in_app_notifications
  add column if not exists classroom_id uuid references public.classrooms(id) on delete cascade;

alter table public.user_in_app_notifications
  add column if not exists assignment_id uuid references public.assignments(id) on delete cascade;

alter table public.user_in_app_notifications
  add column if not exists announcement_id uuid references public.announcements(id) on delete cascade;

create index if not exists user_in_app_notifications_classroom_idx
  on public.user_in_app_notifications (classroom_id, created_at desc)
  where classroom_id is not null;

-- One notification per student per assignment / announcement
create unique index if not exists user_in_app_notifications_assignment_unique
  on public.user_in_app_notifications (user_id, assignment_id)
  where type = 'classroom_assignment' and assignment_id is not null;

create unique index if not exists user_in_app_notifications_announcement_unique
  on public.user_in_app_notifications (user_id, announcement_id)
  where type = 'classroom_announcement' and announcement_id is not null;

comment on table public.user_in_app_notifications is
  'In-app notifications shown in the navbar bell (workshop reminders, classroom teme/materiale).';
