-- Re-engagement email tracking + marketing opt-out on profiles.

alter table public.profiles
  add column if not exists marketing_emails_opt_out boolean not null default false;

comment on column public.profiles.marketing_emails_opt_out is
  'When true, user opted out of marketing/re-engagement emails (synced with MailerLite).';

-- Internal send log; accessed only via service_role (no RLS policies for clients).
create table if not exists public.user_reengagement_email_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier smallint not null check (tier between 1 and 4),
  sent_at timestamptz not null default now(),
  days_inactive integer not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  mailerlite_send_id uuid,
  error_message text,
  personalization jsonb not null default '{}'::jsonb
);

alter table public.user_reengagement_email_sends enable row level security;

-- Tier 1-3: at most one pending/sent row per user per tier.
create unique index if not exists user_reengagement_sends_tier123_unique
  on public.user_reengagement_email_sends (user_id, tier)
  where tier in (1, 2, 3) and status in ('pending', 'sent');

create index if not exists user_reengagement_sends_user_tier_sent_idx
  on public.user_reengagement_email_sends (user_id, tier, sent_at desc);

create index if not exists user_reengagement_sends_user_id_idx
  on public.user_reengagement_email_sends (user_id);

-- Reset tier 1-3 send history when user becomes active again.
create or replace function public.reset_reengagement_tiers_on_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_activity_date is distinct from old.last_activity_date
     and (
       old.last_activity_date is null
       or new.last_activity_date > old.last_activity_date
     )
  then
    delete from public.user_reengagement_email_sends
    where user_id = new.user_id
      and tier in (1, 2, 3);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reset_reengagement_tiers on public.user_stats;
create trigger trg_reset_reengagement_tiers
  after update of last_activity_date on public.user_stats
  for each row
  execute function public.reset_reengagement_tiers_on_activity();

-- Batch helper: last activity timestamp per user (for cron job).
create or replace function public.get_users_last_activity_batch(user_ids uuid[])
returns table(user_id uuid, last_activity_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    greatest(
      coalesce(
        (select max(sp.solved_at) from public.solved_problems sp where sp.user_id = u.id),
        '-infinity'::timestamptz
      ),
      coalesce(
        (select max(ulpp.completed_at)
         from public.user_learning_path_item_progress ulpp
         where ulpp.user_id = u.id),
        '-infinity'::timestamptz
      )
    ) as last_activity_at
  from unnest(user_ids) as u(id);
$$;

grant execute on function public.get_users_last_activity_batch(uuid[]) to service_role;
