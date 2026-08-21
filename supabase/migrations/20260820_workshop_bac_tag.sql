-- BAC tag for workshops (meditație pentru BAC).
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

alter table if exists public.workshops
  add column if not exists is_bac boolean not null default false;

drop view if exists public.workshops_public;

create view public.workshops_public
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
  w.created_at,
  w.updated_at,
  (w.recording_url is not null and length(trim(w.recording_url)) > 0) as has_recording,
  (select count(*)::integer from public.workshop_unlocks u where u.workshop_id = w.id) as unlock_count,
  w.is_bac
from public.workshops w
where w.is_published = true;

grant select on public.workshops_public to anon, authenticated;
