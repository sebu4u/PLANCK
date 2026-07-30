-- Tier 1 is unlocked for every user without XP; claim still requires manual action.

create or replace function public.claim_planckpass_tier(p_tier_number integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_season uuid;
  v_tier public.planckpass_tiers%rowtype;
  v_xp integer := 0;
  v_needed integer := 0;
  v_plan text := 'free';
  v_plus_months integer := 0;
  v_is_paid boolean := false;
  v_cosmetic public.planckpass_cosmetics%rowtype;
  v_boost_until timestamptz;
  v_freeze_until timestamptz;
  v_new_elo integer;
  v_new_coins integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_tier_number is null or p_tier_number < 1 or p_tier_number > 30 then
    raise exception 'Invalid tier';
  end if;

  v_season := public.get_active_planckpass_season_id();
  if v_season is null then
    raise exception 'Niciun sezon activ';
  end if;

  select * into v_tier
  from public.planckpass_tiers
  where season_id = v_season and tier_number = p_tier_number;

  if v_tier.id is null then
    raise exception 'Tier inexistent';
  end if;

  if p_tier_number > 1 then
    select coalesce(upp.xp_total, 0) into v_xp
    from public.planckpass_user_progress upp
    where upp.user_id = v_uid and upp.season_id = v_season;

    select coalesce(sum(t.xp_required), 0) into v_needed
    from public.planckpass_tiers t
    where t.season_id = v_season and t.tier_number <= p_tier_number;

    if coalesce(v_xp, 0) < v_needed then
      raise exception 'Tier încă blocat';
    end if;
  end if;

  select coalesce(p.plan, 'free'), coalesce(p.plus_months_remaining, 0)
    into v_plan, v_plus_months
  from public.profiles p
  where p.user_id = v_uid;

  v_is_paid := (lower(coalesce(v_plan, 'free')) in ('plus', 'premium', 'plus+', 'pro'))
    or coalesce(v_plus_months, 0) > 0;

  if not v_tier.is_free and not v_is_paid then
    raise exception 'Necesită Plus sau Premium';
  end if;

  begin
    insert into public.planckpass_user_claims (user_id, season_id, tier_number)
    values (v_uid, v_season, p_tier_number);
  exception
    when unique_violation then
      raise exception 'Deja revendicat';
  end;

  insert into public.user_stats (user_id, elo, rank)
  values (v_uid, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  case v_tier.reward_kind
    when 'coins' then
      update public.user_stats
      set coins = coins + coalesce(v_tier.coins_amount, 0),
          updated_at = now()
      where user_id = v_uid
      returning coins into v_new_coins;

    when 'elo' then
      update public.user_stats
      set elo = elo + coalesce(v_tier.elo_amount, 0),
          updated_at = now()
      where user_id = v_uid
      returning elo into v_new_elo;

    when 'elo_2x' then
      select elo_boost_until into v_boost_until
      from public.user_stats where user_id = v_uid;
      update public.user_stats
      set elo_boost_until = greatest(coalesce(v_boost_until, now()), now())
          + make_interval(mins => coalesce(v_tier.elo_multiplier_minutes, 15)),
          updated_at = now()
      where user_id = v_uid
      returning elo_boost_until into v_boost_until;

    when 'streak_freeze' then
      select streak_freeze_until into v_freeze_until
      from public.user_stats where user_id = v_uid;
      update public.user_stats
      set streak_freeze_until = greatest(coalesce(v_freeze_until, now()), now())
          + make_interval(hours => coalesce(v_tier.streak_freeze_hours, 24)),
          updated_at = now()
      where user_id = v_uid
      returning streak_freeze_until into v_freeze_until;

    when 'icon' then
      if v_tier.cosmetic_id is null then
        raise exception 'Cosmetic lipsă pe tier';
      end if;
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_tier.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_tier.cosmetic_id, 'planckpass')
      on conflict (user_id, cosmetic_id) do nothing;
      insert into public.user_cosmetics_equipped (user_id)
      values (v_uid)
      on conflict (user_id) do nothing;
      update public.user_cosmetics_equipped
      set icon_id = coalesce(icon_id, v_tier.cosmetic_id),
          updated_at = now()
      where user_id = v_uid;

    when 'badge' then
      if v_tier.cosmetic_id is null then
        raise exception 'Cosmetic lipsă pe tier';
      end if;
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_tier.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_tier.cosmetic_id, 'planckpass')
      on conflict (user_id, cosmetic_id) do nothing;

    when 'border' then
      if v_tier.cosmetic_id is null then
        raise exception 'Cosmetic lipsă pe tier';
      end if;
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_tier.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_tier.cosmetic_id, 'planckpass')
      on conflict (user_id, cosmetic_id) do nothing;

    when 'skin' then
      if v_tier.cosmetic_id is null then
        raise exception 'Cosmetic lipsă pe tier';
      end if;
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_tier.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_tier.cosmetic_id, 'planckpass')
      on conflict (user_id, cosmetic_id) do nothing;
  end case;

  return jsonb_build_object(
    'tierNumber', p_tier_number,
    'rewardKind', v_tier.reward_kind,
    'label', v_tier.label,
    'isFree', v_tier.is_free,
    'coinsAmount', v_tier.coins_amount,
    'eloAmount', v_tier.elo_amount,
    'eloMultiplierMinutes', v_tier.elo_multiplier_minutes,
    'streakFreezeHours', v_tier.streak_freeze_hours,
    'cosmetic', case when v_cosmetic.id is not null then jsonb_build_object(
      'id', v_cosmetic.id,
      'kind', v_cosmetic.kind,
      'name', v_cosmetic.name,
      'imageUrl', v_cosmetic.image_url
    ) else null end,
    'eloBoostUntil', v_boost_until,
    'streakFreezeUntil', v_freeze_until,
    'newElo', v_new_elo,
    'newCoins', v_new_coins
  );
end;
$$;

revoke all on function public.claim_planckpass_tier(integer) from public;
grant execute on function public.claim_planckpass_tier(integer) to authenticated;
