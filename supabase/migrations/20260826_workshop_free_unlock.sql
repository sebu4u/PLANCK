-- Free workshop enrollment: reserve a seat without spending energy.
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
  v_unlock_count integer;
  v_meet_url text;
  v_spendable_balance integer;
  v_carryover_balance integer;
  v_purchased_balance integer;
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

  select
    coalesce(balance + purchased_balance, 0),
    coalesce(carryover_balance, 0),
    coalesce(purchased_balance, 0)
  into v_spendable_balance, v_carryover_balance, v_purchased_balance
  from public.user_workshop_energy
  where user_id = v_uid;

  v_spendable_balance := coalesce(v_spendable_balance, 0);
  v_carryover_balance := coalesce(v_carryover_balance, 0);
  v_purchased_balance := coalesce(v_purchased_balance, 0);

  if exists (
    select 1 from public.workshop_unlocks
    where user_id = v_uid and workshop_id = p_workshop_id
  ) then
    return jsonb_build_object(
      'ok', true,
      'already_unlocked', true,
      'meet_url', v_meet_url,
      'recording_url', v_workshop.recording_url,
      'balance', v_spendable_balance,
      'carryover_balance', v_carryover_balance,
      'purchased_balance', v_purchased_balance,
      'total_balance', v_spendable_balance + v_carryover_balance,
      'energy_cost', 0
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

  insert into public.workshop_unlocks (user_id, workshop_id)
  values (v_uid, p_workshop_id);

  return jsonb_build_object(
    'ok', true,
    'already_unlocked', false,
    'meet_url', v_meet_url,
    'recording_url', v_workshop.recording_url,
    'balance', v_spendable_balance,
    'carryover_balance', v_carryover_balance,
    'purchased_balance', v_purchased_balance,
    'total_balance', v_spendable_balance + v_carryover_balance,
    'energy_cost', 0
  );
end;
$$;

grant execute on function public.unlock_workshop(uuid) to authenticated;
