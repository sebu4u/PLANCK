-- Pregătire / workshops: teachers, sessions, energy, unlocks, push, reminders.

-- ---------------------------------------------------------------------------
-- Teachers (CMS entities, not app profesor accounts)
-- ---------------------------------------------------------------------------
create table if not exists public.workshop_teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  icon_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workshop_teachers_active_idx
  on public.workshop_teachers (is_active, name);

alter table public.workshop_teachers enable row level security;

drop policy if exists "workshop_teachers_public_read_active" on public.workshop_teachers;
create policy "workshop_teachers_public_read_active"
  on public.workshop_teachers for select
  to anon, authenticated
  using (is_active = true);

grant select on public.workshop_teachers to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Workshops
-- ---------------------------------------------------------------------------
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text not null default '',
  subject text not null,
  teacher_id uuid not null references public.workshop_teachers(id) on delete restrict,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0 and duration_minutes <= 480),
  energy_cost integer not null default 25 check (energy_cost > 0),
  meet_url text not null,
  recording_url text,
  max_seats integer check (max_seats is null or max_seats > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workshops_subject_allowed check (
    subject in ('mate', 'fizica', 'info', 'biologie', 'chimie')
  ),
  constraint workshops_slug_unique unique (slug)
);

create index if not exists workshops_published_starts_idx
  on public.workshops (is_published, starts_at);

create index if not exists workshops_subject_starts_idx
  on public.workshops (subject, starts_at);

create index if not exists workshops_teacher_idx
  on public.workshops (teacher_id);

alter table public.workshops enable row level security;

-- Direct table select for authenticated/anon is denied for secrets; use view.
revoke all on public.workshops from anon, authenticated;
grant select on public.workshops to service_role;

create table if not exists public.workshop_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, workshop_id)
);

create index if not exists workshop_unlocks_workshop_idx
  on public.workshop_unlocks (workshop_id);

alter table public.workshop_unlocks enable row level security;

drop policy if exists "workshop_unlocks_select_own" on public.workshop_unlocks;
create policy "workshop_unlocks_select_own"
  on public.workshop_unlocks for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.workshop_unlocks to authenticated;

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
  w.created_at,
  w.updated_at,
  (w.recording_url is not null and length(trim(w.recording_url)) > 0) as has_recording,
  (select count(*)::integer from public.workshop_unlocks u where u.workshop_id = w.id) as unlock_count
from public.workshops w
where w.is_published = true;

grant select on public.workshops_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Energy
-- ---------------------------------------------------------------------------
create table if not exists public.user_workshop_energy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  last_weekly_grant_week text,
  updated_at timestamptz not null default now()
);

alter table public.user_workshop_energy enable row level security;

drop policy if exists "user_workshop_energy_select_own" on public.user_workshop_energy;
create policy "user_workshop_energy_select_own"
  on public.user_workshop_energy for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.user_workshop_energy to authenticated;

create table if not exists public.user_workshop_energy_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('weekly_grant', 'unlock', 'admin_adjust')),
  workshop_id uuid references public.workshops(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists user_workshop_energy_ledger_user_idx
  on public.user_workshop_energy_ledger (user_id, created_at desc);

alter table public.user_workshop_energy_ledger enable row level security;

drop policy if exists "user_workshop_energy_ledger_select_own" on public.user_workshop_energy_ledger;
create policy "user_workshop_energy_ledger_select_own"
  on public.user_workshop_energy_ledger for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.user_workshop_energy_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- Push subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ---------------------------------------------------------------------------
-- Reminder send log
-- ---------------------------------------------------------------------------
create table if not exists public.workshop_reminder_sends (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('24h', '30m')),
  channel text not null check (channel in ('email', 'push')),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz not null default now(),
  constraint workshop_reminder_sends_unique
    unique (workshop_id, user_id, reminder_kind, channel)
);

create index if not exists workshop_reminder_sends_workshop_idx
  on public.workshop_reminder_sends (workshop_id, reminder_kind);

alter table public.workshop_reminder_sends enable row level security;
-- No client policies; service_role only.

-- ---------------------------------------------------------------------------
-- Storage bucket for teacher icons
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('workshop-teachers', 'workshop-teachers', true)
on conflict (id) do nothing;

drop policy if exists "workshop_teachers_public_read" on storage.objects;
create policy "workshop_teachers_public_read"
  on storage.objects
  for select
  using (bucket_id = 'workshop-teachers');

-- ---------------------------------------------------------------------------
-- Helpers: ISO week key in Europe/Bucharest
-- ---------------------------------------------------------------------------
create or replace function public.workshop_bucharest_week_key(ts timestamptz default now())
returns text
language sql
stable
as $$
  select to_char((ts at time zone 'Europe/Bucharest'), 'IYYY-"W"IW');
$$;

create or replace function public.workshop_weekly_energy_amount(p_plan text)
returns integer
language sql
immutable
as $$
  select case
    when lower(coalesce(p_plan, 'free')) in ('premium', 'pro') then 100
    else 25
  end;
$$;

-- Ensure energy row + grant current week if needed (for a single user).
create or replace function public.ensure_workshop_energy_grant(p_user_id uuid)
returns public.user_workshop_energy
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_workshop_energy;
  v_week text := public.workshop_bucharest_week_key(now());
  v_plan text;
  v_amount integer;
begin
  if p_user_id is null then
    raise exception 'user required';
  end if;

  -- Authenticated callers may only grant themselves; service_role may grant any user.
  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;

  select coalesce(nullif(trim(lower(plan)), ''), 'free')
    into v_plan
  from public.profiles
  where user_id = p_user_id;

  v_plan := coalesce(v_plan, 'free');
  v_amount := public.workshop_weekly_energy_amount(v_plan);

  insert into public.user_workshop_energy (user_id, balance, last_weekly_grant_week, updated_at)
  values (p_user_id, 0, null, now())
  on conflict (user_id) do nothing;

  select * into v_row
  from public.user_workshop_energy
  where user_id = p_user_id
  for update;

  if v_row.last_weekly_grant_week is distinct from v_week then
    update public.user_workshop_energy
    set
      balance = balance + v_amount,
      last_weekly_grant_week = v_week,
      updated_at = now()
    where user_id = p_user_id
    returning * into v_row;

    insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
    values (p_user_id, v_amount, 'weekly_grant', null);
  end if;

  return v_row;
end;
$$;

revoke all on function public.ensure_workshop_energy_grant(uuid) from public;
grant execute on function public.ensure_workshop_energy_grant(uuid) to authenticated, service_role;

-- Batch grant for cron (all profiles).
create or replace function public.grant_weekly_workshop_energy_batch()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week text := public.workshop_bucharest_week_key(now());
  v_count integer := 0;
  r record;
  v_amount integer;
begin
  for r in
    select p.user_id, coalesce(nullif(trim(lower(p.plan)), ''), 'free') as plan
    from public.profiles p
  loop
    v_amount := public.workshop_weekly_energy_amount(r.plan);

    insert into public.user_workshop_energy (user_id, balance, last_weekly_grant_week, updated_at)
    values (r.user_id, 0, null, now())
    on conflict (user_id) do nothing;

    update public.user_workshop_energy e
    set
      balance = e.balance + v_amount,
      last_weekly_grant_week = v_week,
      updated_at = now()
    where e.user_id = r.user_id
      and e.last_weekly_grant_week is distinct from v_week;

    if found then
      insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
      values (r.user_id, v_amount, 'weekly_grant', null);
      v_count := v_count + 1;
    end if;
  end loop;

  return jsonb_build_object('week', v_week, 'granted', v_count);
end;
$$;

revoke all on function public.grant_weekly_workshop_energy_batch() from public;
grant execute on function public.grant_weekly_workshop_energy_batch() to service_role;

-- Unlock workshop (atomic).
create or replace function public.unlock_workshop(p_workshop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_workshop public.workshops;
  v_energy public.user_workshop_energy;
  v_unlock_count integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select * into v_workshop
  from public.workshops
  where id = p_workshop_id
  for update;

  if not found or v_workshop.is_published is not true then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if exists (
    select 1 from public.workshop_unlocks
    where user_id = v_uid and workshop_id = p_workshop_id
  ) then
    return jsonb_build_object(
      'ok', true,
      'already_unlocked', true,
      'meet_url', v_workshop.meet_url,
      'recording_url', v_workshop.recording_url,
      'balance', (select balance from public.user_workshop_energy where user_id = v_uid)
    );
  end if;

  if v_workshop.max_seats is not null then
    select count(*)::integer into v_unlock_count
    from public.workshop_unlocks
    where workshop_id = p_workshop_id;

    if v_unlock_count >= v_workshop.max_seats then
      return jsonb_build_object('ok', false, 'error', 'full');
    end if;
  end if;

  v_energy := public.ensure_workshop_energy_grant(v_uid);

  if v_energy.balance < v_workshop.energy_cost then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_energy',
      'balance', v_energy.balance,
      'energy_cost', v_workshop.energy_cost
    );
  end if;

  update public.user_workshop_energy
  set
    balance = balance - v_workshop.energy_cost,
    updated_at = now()
  where user_id = v_uid
  returning * into v_energy;

  insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
  values (v_uid, -v_workshop.energy_cost, 'unlock', p_workshop_id);

  insert into public.workshop_unlocks (user_id, workshop_id)
  values (v_uid, p_workshop_id);

  return jsonb_build_object(
    'ok', true,
    'already_unlocked', false,
    'meet_url', v_workshop.meet_url,
    'recording_url', v_workshop.recording_url,
    'balance', v_energy.balance
  );
end;
$$;

revoke all on function public.unlock_workshop(uuid) from public;
grant execute on function public.unlock_workshop(uuid) to authenticated;

comment on table public.workshop_teachers is 'CMS teachers for /pregatire workshops.';
comment on table public.workshops is 'Live prep sessions with Meet link and optional recording.';
comment on table public.user_workshop_energy is 'Accumulating workshop energy balance per user.';
comment on table public.workshop_unlocks is 'Permanent unlock of a workshop (Meet + recording).';
