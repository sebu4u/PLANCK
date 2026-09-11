-- Add status column to workshops for postponed/scheduled states

-- Add status column with default 'scheduled'
alter table if exists public.workshops
  add column if not exists status text not null default 'scheduled'
    check (status in ('scheduled', 'postponed'));

-- Add index for status queries
create index if not exists workshops_status_starts_idx
  on public.workshops (status, starts_at);

-- Update the workshops_public view to include status
create or replace view public.workshops_public
with (security_invoker = false)
as
select
  w.id,
  w.title,
  w.slug,
  w.description,
  w.subject,
  w.teacher_id,
  w.starts_at,
  w.duration_minutes,
  w.energy_cost,
  w.max_seats,
  w.is_published,
  w.status,
  w.created_at,
  w.updated_at,
  (w.recording_url is not null and length(trim(w.recording_url)) > 0) as has_recording,
  (select count(*)::integer from public.workshop_unlocks u where u.workshop_id = w.id) as unlock_count
from public.workshops w
where w.is_published = true;

-- Set specific workshops to postponed status
-- Mate: 743ae6e9-379b-49d4-a291-e356a520126e
-- Info: d8972986-0c71-4725-b212-dce179d7e629
-- Bio: a3f7564b-70ab-4c39-9b23-edeed27f84fb
-- Chimie: a708f40b-8974-43fd-82a0-2bb2f499031f

update public.workshops
set status = 'postponed'
where id in (
  '743ae6e9-379b-49d4-a291-e356a520126e',
  'd8972986-0c71-4725-b212-dce179d7e629',
  'a3f7564b-70ab-4c39-9b23-edeed27f84fb',
  'a708f40b-8974-43fd-82a0-2bb2f499031f'
);
