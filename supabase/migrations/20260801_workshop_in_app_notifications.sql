-- In-app workshop reminders (navbar notifications) + allow channel 'in_app'.

-- ---------------------------------------------------------------------------
-- Extend reminder send log channel check
-- ---------------------------------------------------------------------------
alter table public.workshop_reminder_sends
  drop constraint if exists workshop_reminder_sends_channel_check;

alter table public.workshop_reminder_sends
  add constraint workshop_reminder_sends_channel_check
  check (channel in ('email', 'push', 'in_app'));

-- ---------------------------------------------------------------------------
-- User-facing in-app notifications (navbar bell)
-- ---------------------------------------------------------------------------
create table if not exists public.user_in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('workshop_reminder')),
  title text not null,
  body text not null,
  href text,
  workshop_id uuid references public.workshops(id) on delete cascade,
  reminder_kind text check (reminder_kind is null or reminder_kind in ('24h', '30m')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_in_app_notifications_workshop_reminder_unique
    unique (user_id, workshop_id, reminder_kind, type)
);

create index if not exists user_in_app_notifications_user_created_idx
  on public.user_in_app_notifications (user_id, created_at desc);

create index if not exists user_in_app_notifications_user_unread_idx
  on public.user_in_app_notifications (user_id, created_at desc)
  where read_at is null;

alter table public.user_in_app_notifications enable row level security;

drop policy if exists "user_in_app_notifications_select_own" on public.user_in_app_notifications;
create policy "user_in_app_notifications_select_own"
  on public.user_in_app_notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_in_app_notifications_update_own" on public.user_in_app_notifications;
create policy "user_in_app_notifications_update_own"
  on public.user_in_app_notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, update on public.user_in_app_notifications to authenticated;

comment on table public.user_in_app_notifications is
  'In-app notifications shown in the navbar bell (e.g. workshop reminders).';
