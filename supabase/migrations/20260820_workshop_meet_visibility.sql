-- Withhold Google Meet URLs until 10 minutes before the workshop starts.
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

create or replace function public.unlock_workshop(p_workshop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
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
  v_from_purchased integer;
  v_spendable_balance integer;
  v_total_balance integer;
  v_meet_url text;
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

  v_meet_url := case
    when now() >= v_workshop.starts_at - interval '10 minutes' then v_workshop.meet_url
    else null
  end;

  if exists (
    select 1 from public.workshop_unlocks
    where user_id = v_uid and workshop_id = p_workshop_id
  ) then
    return jsonb_build_object(
      'ok', true,
      'already_unlocked', true,
      'meet_url', v_meet_url,
      'recording_url', v_workshop.recording_url,
      -- Old clients treat balance as the persistent/current spendable bucket.
      -- Include purchased energy there so it remains visible and usable without
      -- making them understand the additive purchased_balance field.
      'balance', coalesce((
        select balance + purchased_balance
        from public.user_workshop_energy
        where user_id = v_uid
      ), 0),
      'carryover_balance', coalesce((
        select carryover_balance
        from public.user_workshop_energy
        where user_id = v_uid
      ), 0),
      'purchased_balance', coalesce((
        select purchased_balance
        from public.user_workshop_energy
        where user_id = v_uid
      ), 0),
      'total_balance', coalesce((
        select balance + carryover_balance + purchased_balance
        from public.user_workshop_energy
        where user_id = v_uid
      ), 0),
      'energy_cost', v_workshop.energy_cost
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

  perform public.ensure_workshop_energy_grant(v_uid);

  -- Read the stored pools after the grant. ensure_workshop_energy_grant returns
  -- a legacy display balance that includes purchased energy, while spending
  -- must operate on the three physical buckets independently.
  select * into v_energy
  from public.user_workshop_energy
  where user_id = v_uid
  for update;

  v_cost := v_workshop.energy_cost;
  v_available := coalesce(v_energy.carryover_balance, 0)
    + coalesce(v_energy.balance, 0)
    + coalesce(v_energy.purchased_balance, 0);

  if v_available < v_cost then
    v_spendable_balance := coalesce(v_energy.balance, 0)
      + coalesce(v_energy.purchased_balance, 0);
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_energy',
      'balance', v_spendable_balance,
      'carryover_balance', coalesce(v_energy.carryover_balance, 0),
      'purchased_balance', coalesce(v_energy.purchased_balance, 0),
      'total_balance', v_available,
      'energy_cost', v_cost
    );
  end if;

  v_from_carryover := least(coalesce(v_energy.carryover_balance, 0), v_cost);
  v_from_balance := least(
    v_cost - v_from_carryover,
    coalesce(v_energy.balance, 0)
  );
  v_from_purchased := v_cost - v_from_carryover - v_from_balance;

  update public.user_workshop_energy
  set
    carryover_balance = carryover_balance - v_from_carryover,
    balance = balance - v_from_balance,
    purchased_balance = purchased_balance - v_from_purchased,
    updated_at = now()
  where user_id = v_uid
  returning * into v_energy;

  insert into public.user_workshop_energy_ledger (user_id, delta, reason, workshop_id)
  values (v_uid, -v_cost, 'unlock', p_workshop_id);

  insert into public.workshop_unlocks (user_id, workshop_id)
  values (v_uid, p_workshop_id);

  v_spendable_balance := v_energy.balance + v_energy.purchased_balance;
  v_total_balance := v_spendable_balance + v_energy.carryover_balance;

  return jsonb_build_object(
    'ok', true,
    'already_unlocked', false,
    'meet_url', v_meet_url,
    'recording_url', v_workshop.recording_url,
    'balance', v_spendable_balance,
    'carryover_balance', v_energy.carryover_balance,
    'purchased_balance', v_energy.purchased_balance,
    'total_balance', v_total_balance,
    'energy_cost', v_cost
  );
end;
$$;

grant execute on function public.unlock_workshop(uuid) to authenticated;
