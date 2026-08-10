-- Workshop energy: premium weekly reset to 100 + carryover; free/plus signup 25 once.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
alter table public.user_workshop_energy
  add column if not exists carryover_balance integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_workshop_energy_carryover_balance_check'
      and conrelid = 'public.user_workshop_energy'::regclass
  ) then
    alter table public.user_workshop_energy
      add constraint user_workshop_energy_carryover_balance_check
      check (carryover_balance >= 0);
  end if;
end $$;

alter table public.user_workshop_energy_ledger
  drop constraint if exists user_workshop_energy_ledger_reason_check;

alter table public.user_workshop_energy_ledger
  add constraint user_workshop_energy_ledger_reason_check
  check (reason in (
    'weekly_grant',
    'unlock',
    'admin_adjust',
    'signup_grant',
    'premium_upgrade',
    'weekly_reset',
    'carryover_expire'
  ));

comment on table public.user_workshop_energy is
  'Workshop energy: balance (normal) + carryover_balance (expires next Monday). Premium resets to 100 weekly.';

comment on column public.user_workshop_energy.carryover_balance is
  'Leftover energy from previous premium week (or pre-upgrade). Spends first; expires on Monday.';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.workshop_is_premium_plan(p_plan text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(p_plan, 'free')) in ('premium', 'pro');
$$;

create or replace function public.workshop_weekly_energy_amount(p_plan text)
returns integer
language sql
immutable
as $$
  -- Premium weekly refill amount. Free/plus no longer receive weekly energy.
  select case
    when public.workshop_is_premium_plan(p_plan) then 100
    else 0
  end;
$$;

-- ---------------------------------------------------------------------------
-- Ensure row + apply Monday transition (premium reset / non-premium carryover expire)
-- ---------------------------------------------------------------------------
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
  v_is_premium boolean;
  v_inserted_id uuid;
  v_old_carryover integer;
  v_old_balance integer;
begin
  if p_user_id is null then
    raise exception 'user required';
  end if;

  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;

  select coalesce(nullif(trim(lower(plan)), ''), 'free')
    into v_plan
  from public.profiles
  where user_id = p_user_id;

  v_plan := coalesce(v_plan, 'free');
  v_is_premium := public.workshop_is_premium_plan(v_plan);

  if v_is_premium then
    insert into public.user_workshop_energy (user_id, balance, carryover_balance, last_weekly_grant_week, updated_at)
    values (p_user_id, 0, 0, null, now())
    on conflict (user_id) do nothing;
  else
    insert into public.user_workshop_energy (user_id, balance, carryover_balance, last_weekly_grant_week, updated_at)
    values (p_user_id, 25, 0, null, now())
    on conflict (user_id) do nothing
    returning user_id into v_inserted_id;

    if v_inserted_id is not null then
      insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
      values (p_user_id, 25, 'signup_grant', null);
    end if;
  end if;

  select * into v_row
  from public.user_workshop_energy
  where user_id = p_user_id
  for update;

  if v_row.last_weekly_grant_week is not distinct from v_week then
    return v_row;
  end if;

  v_old_carryover := coalesce(v_row.carryover_balance, 0);
  v_old_balance := coalesce(v_row.balance, 0);

  if v_is_premium then
    if v_old_carryover > 0 then
      insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
      values (p_user_id, -v_old_carryover, 'carryover_expire', null);
    end if;

    update public.user_workshop_energy
    set
      carryover_balance = v_old_balance,
      balance = 100,
      last_weekly_grant_week = v_week,
      updated_at = now()
    where user_id = p_user_id
    returning * into v_row;

    insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
    values (p_user_id, 100, 'weekly_reset', null);
  else
    -- Non-premium: expire carryover only; keep balance; no weekly grant.
    if v_old_carryover > 0 then
      insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
      values (p_user_id, -v_old_carryover, 'carryover_expire', null);

      update public.user_workshop_energy
      set
        carryover_balance = 0,
        last_weekly_grant_week = v_week,
        updated_at = now()
      where user_id = p_user_id
      returning * into v_row;
    else
      update public.user_workshop_energy
      set
        last_weekly_grant_week = v_week,
        updated_at = now()
      where user_id = p_user_id
      returning * into v_row;
    end if;
  end if;

  return v_row;
end;
$$;

revoke all on function public.ensure_workshop_energy_grant(uuid) from public;
grant execute on function public.ensure_workshop_energy_grant(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Batch Monday job: premium reset + non-premium carryover expiry
-- ---------------------------------------------------------------------------
create or replace function public.grant_weekly_workshop_energy_batch()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week text := public.workshop_bucharest_week_key(now());
  v_premium_count integer := 0;
  v_expired_count integer := 0;
  r record;
  v_old_carryover integer;
  v_old_balance integer;
  v_is_premium boolean;
begin
  for r in
    select
      p.user_id,
      coalesce(nullif(trim(lower(p.plan)), ''), 'free') as plan,
      e.balance,
      e.carryover_balance,
      e.last_weekly_grant_week
    from public.profiles p
    left join public.user_workshop_energy e on e.user_id = p.user_id
  loop
    v_is_premium := public.workshop_is_premium_plan(r.plan);

    if r.last_weekly_grant_week is not distinct from v_week then
      continue;
    end if;

    -- Ensure energy row exists for premium (reset) or for anyone with leftover carryover.
    if r.balance is null then
      if v_is_premium then
        insert into public.user_workshop_energy (user_id, balance, carryover_balance, last_weekly_grant_week, updated_at)
        values (r.user_id, 0, 0, null, now())
        on conflict (user_id) do nothing;
        v_old_balance := 0;
        v_old_carryover := 0;
      else
        continue;
      end if;
    else
      v_old_balance := coalesce(r.balance, 0);
      v_old_carryover := coalesce(r.carryover_balance, 0);
    end if;

    if v_is_premium then
      if v_old_carryover > 0 then
        insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
        values (r.user_id, -v_old_carryover, 'carryover_expire', null);
      end if;

      update public.user_workshop_energy e
      set
        carryover_balance = v_old_balance,
        balance = 100,
        last_weekly_grant_week = v_week,
        updated_at = now()
      where e.user_id = r.user_id
        and e.last_weekly_grant_week is distinct from v_week;

      if found then
        insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
        values (r.user_id, 100, 'weekly_reset', null);
        v_premium_count := v_premium_count + 1;
      end if;
    elsif v_old_carryover > 0 then
      insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
      values (r.user_id, -v_old_carryover, 'carryover_expire', null);

      update public.user_workshop_energy e
      set
        carryover_balance = 0,
        last_weekly_grant_week = v_week,
        updated_at = now()
      where e.user_id = r.user_id
        and e.last_weekly_grant_week is distinct from v_week;

      if found then
        v_expired_count := v_expired_count + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'week', v_week,
    'premium_reset', v_premium_count,
    'carryover_expired', v_expired_count
  );
end;
$$;

revoke all on function public.grant_weekly_workshop_energy_batch() from public;
grant execute on function public.grant_weekly_workshop_energy_batch() to service_role;

-- ---------------------------------------------------------------------------
-- Premium upgrade grant
-- ---------------------------------------------------------------------------
create or replace function public.grant_premium_workshop_energy_upgrade(p_user_id uuid)
returns public.user_workshop_energy
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_workshop_energy;
  v_week text := public.workshop_bucharest_week_key(now());
  v_old_balance integer;
begin
  if p_user_id is null then
    raise exception 'user required';
  end if;

  insert into public.user_workshop_energy (user_id, balance, carryover_balance, last_weekly_grant_week, updated_at)
  values (p_user_id, 0, 0, null, now())
  on conflict (user_id) do nothing;

  select * into v_row
  from public.user_workshop_energy
  where user_id = p_user_id
  for update;

  v_old_balance := coalesce(v_row.balance, 0);

  update public.user_workshop_energy
  set
    carryover_balance = coalesce(carryover_balance, 0) + v_old_balance,
    balance = 100,
    last_weekly_grant_week = v_week,
    updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
  values (p_user_id, 100, 'premium_upgrade', null);

  return v_row;
end;
$$;

revoke all on function public.grant_premium_workshop_energy_upgrade(uuid) from public;
grant execute on function public.grant_premium_workshop_energy_upgrade(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Unlock: spend carryover first, then balance
-- ---------------------------------------------------------------------------
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
  v_cost integer;
  v_available integer;
  v_from_carryover integer;
  v_from_balance integer;
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
      'balance', (select balance from public.user_workshop_energy where user_id = v_uid),
      'carryover_balance', (select carryover_balance from public.user_workshop_energy where user_id = v_uid)
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
  v_cost := v_workshop.energy_cost;
  v_available := coalesce(v_energy.carryover_balance, 0) + coalesce(v_energy.balance, 0);

  if v_available < v_cost then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_energy',
      'balance', v_energy.balance,
      'carryover_balance', v_energy.carryover_balance,
      'energy_cost', v_cost
    );
  end if;

  v_from_carryover := least(coalesce(v_energy.carryover_balance, 0), v_cost);
  v_from_balance := v_cost - v_from_carryover;

  update public.user_workshop_energy
  set
    carryover_balance = carryover_balance - v_from_carryover,
    balance = balance - v_from_balance,
    updated_at = now()
  where user_id = v_uid
  returning * into v_energy;

  insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
  values (v_uid, -v_cost, 'unlock', p_workshop_id);

  insert into public.workshop_unlocks (user_id, workshop_id)
  values (v_uid, p_workshop_id);

  return jsonb_build_object(
    'ok', true,
    'already_unlocked', false,
    'meet_url', v_workshop.meet_url,
    'recording_url', v_workshop.recording_url,
    'balance', v_energy.balance,
    'carryover_balance', v_energy.carryover_balance
  );
end;
$$;

revoke all on function public.unlock_workshop(uuid) from public;
grant execute on function public.unlock_workshop(uuid) to authenticated;
