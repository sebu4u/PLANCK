-- Extend workshop_reminder_sends to support MailerLite automations
-- Add 'confirm' (immediate unlock) and '10m' (10 minutes before start) reminder kinds

-- ---------------------------------------------------------------------------
-- Extend reminder_kind check constraint
-- ---------------------------------------------------------------------------
alter table public.workshop_reminder_sends
  drop constraint if exists workshop_reminder_sends_reminder_kind_check;

alter table public.workshop_reminder_sends
  add constraint workshop_reminder_sends_reminder_kind_check
  check (reminder_kind in ('confirm', '24h', '30m', '10m'));

comment on table public.workshop_reminder_sends is
  'Workshop reminder send log for MailerLite automations and push/in-app channels.
  Kinds: confirm (immediate unlock), 24h, 30m, 10m (before start).';
