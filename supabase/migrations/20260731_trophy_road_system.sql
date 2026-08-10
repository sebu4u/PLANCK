-- Trophy Road: lifetime ELO milestones + claims (reuses planckpass cosmetics / user_stats)

-- ---------------------------------------------------------------------------
-- Milestones (global, not season-bound)
-- ---------------------------------------------------------------------------
create table if not exists public.trophy_road_milestones (
  id uuid primary key default gen_random_uuid(),
  threshold integer not null check (threshold > 0),
  sort_order integer not null default 0,
  reward_kind text not null default 'coins' check (
    reward_kind in (
      'icon', 'badge', 'border', 'skin',
      'elo', 'elo_2x', 'streak_freeze', 'coins'
    )
  ),
  label text not null default '',
  coins_amount integer,
  elo_amount integer,
  elo_multiplier_minutes integer,
  streak_freeze_hours integer,
  cosmetic_id uuid references public.planckpass_cosmetics(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (threshold)
);

create index if not exists trophy_road_milestones_threshold_idx
  on public.trophy_road_milestones (threshold);

create index if not exists trophy_road_milestones_active_sort_idx
  on public.trophy_road_milestones (is_active, sort_order, threshold);

create table if not exists public.trophy_road_user_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_id uuid not null references public.trophy_road_milestones(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (user_id, milestone_id)
);

create index if not exists trophy_road_user_claims_user_idx
  on public.trophy_road_user_claims (user_id);

-- ---------------------------------------------------------------------------
-- RLS (no DROP — avoids Supabase SQL editor destructive warning)
-- ---------------------------------------------------------------------------
alter table public.trophy_road_milestones enable row level security;
alter table public.trophy_road_user_claims enable row level security;

do $policies$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trophy_road_milestones'
      and policyname = 'trophy_road_milestones_select_all'
  ) then
    create policy trophy_road_milestones_select_all
      on public.trophy_road_milestones for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trophy_road_user_claims'
      and policyname = 'trophy_road_user_claims_select_own'
  ) then
    create policy trophy_road_user_claims_select_own
      on public.trophy_road_user_claims for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$policies$;

-- ---------------------------------------------------------------------------
-- Seed established trophy thresholds (rewards filled in admin)
-- ---------------------------------------------------------------------------
insert into public.trophy_road_milestones (threshold, sort_order, reward_kind, label)
values
  (50, 1, 'coins', ''),
  (100, 2, 'coins', ''),
  (150, 3, 'coins', ''),
  (200, 4, 'coins', ''),
  (250, 5, 'coins', ''),
  (300, 6, 'coins', ''),
  (350, 7, 'coins', ''),
  (400, 8, 'coins', ''),
  (450, 9, 'coins', ''),
  (500, 10, 'coins', ''),
  (600, 11, 'coins', ''),
  (700, 12, 'coins', ''),
  (800, 13, 'coins', ''),
  (900, 14, 'coins', ''),
  (1000, 15, 'coins', ''),
  (1150, 16, 'coins', ''),
  (1300, 17, 'coins', ''),
  (1500, 18, 'coins', ''),
  (1700, 19, 'coins', ''),
  (1900, 20, 'coins', ''),
  (2100, 21, 'coins', ''),
  (2300, 22, 'coins', ''),
  (2500, 23, 'coins', ''),
  (2750, 24, 'coins', ''),
  (3000, 25, 'coins', ''),
  (3300, 26, 'coins', ''),
  (3600, 27, 'coins', ''),
  (4000, 28, 'coins', ''),
  (4400, 29, 'coins', ''),
  (4800, 30, 'coins', ''),
  (5200, 31, 'coins', ''),
  (5600, 32, 'coins', ''),
  (6000, 33, 'coins', ''),
  (6500, 34, 'coins', ''),
  (7000, 35, 'coins', ''),
  (7500, 36, 'coins', ''),
  (8000, 37, 'coins', ''),
  (8500, 38, 'coins', ''),
  (9000, 39, 'coins', ''),
  (10000, 40, 'coins', ''),
  (11000, 41, 'coins', ''),
  (12000, 42, 'coins', ''),
  (13000, 43, 'coins', ''),
  (14000, 44, 'coins', ''),
  (15000, 45, 'coins', '')
on conflict (threshold) do nothing;

-- ---------------------------------------------------------------------------
-- Claim RPC
-- ---------------------------------------------------------------------------
create or replace function public.claim_trophy_road_milestone(p_milestone_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_milestone public.trophy_road_milestones%rowtype;
  v_elo integer := 0;
  v_cosmetic public.planckpass_cosmetics%rowtype;
  v_boost_until timestamptz;
  v_freeze_until timestamptz;
  v_new_elo integer;
  v_new_coins integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_milestone_id is null then
    raise exception 'Invalid milestone';
  end if;

  select * into v_milestone
  from public.trophy_road_milestones
  where id = p_milestone_id and is_active = true;

  if v_milestone.id is null then
    raise exception 'Milestone inexistent';
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (v_uid, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  select coalesce(us.elo, 0) into v_elo
  from public.user_stats us
  where us.user_id = v_uid;

  if coalesce(v_elo, 0) < v_milestone.threshold then
    raise exception 'Milestone încă blocat';
  end if;

  -- Require a configured reward before granting
  if v_milestone.reward_kind = 'coins' and coalesce(v_milestone.coins_amount, 0) <= 0 then
    raise exception 'Recompensa nu este configurată';
  elsif v_milestone.reward_kind = 'elo' and coalesce(v_milestone.elo_amount, 0) <= 0 then
    raise exception 'Recompensa nu este configurată';
  elsif v_milestone.reward_kind = 'elo_2x' and coalesce(v_milestone.elo_multiplier_minutes, 0) <= 0 then
    raise exception 'Recompensa nu este configurată';
  elsif v_milestone.reward_kind = 'streak_freeze' and coalesce(v_milestone.streak_freeze_hours, 0) <= 0 then
    raise exception 'Recompensa nu este configurată';
  elsif v_milestone.reward_kind in ('icon', 'badge', 'border', 'skin') and v_milestone.cosmetic_id is null then
    raise exception 'Recompensa nu este configurată';
  end if;

  begin
    insert into public.trophy_road_user_claims (user_id, milestone_id)
    values (v_uid, p_milestone_id);
  exception
    when unique_violation then
      raise exception 'Deja revendicat';
  end;

  case v_milestone.reward_kind
    when 'coins' then
      update public.user_stats
      set coins = coins + coalesce(v_milestone.coins_amount, 0),
          updated_at = now()
      where user_id = v_uid
      returning coins into v_new_coins;

    when 'elo' then
      update public.user_stats
      set elo = elo + coalesce(v_milestone.elo_amount, 0),
          updated_at = now()
      where user_id = v_uid
      returning elo into v_new_elo;

    when 'elo_2x' then
      select elo_boost_until into v_boost_until
      from public.user_stats where user_id = v_uid;
      update public.user_stats
      set elo_boost_until = greatest(coalesce(v_boost_until, now()), now())
          + make_interval(mins => coalesce(v_milestone.elo_multiplier_minutes, 15)),
          updated_at = now()
      where user_id = v_uid
      returning elo_boost_until into v_boost_until;

    when 'streak_freeze' then
      select streak_freeze_until into v_freeze_until
      from public.user_stats where user_id = v_uid;
      update public.user_stats
      set streak_freeze_until = greatest(coalesce(v_freeze_until, now()), now())
          + make_interval(hours => coalesce(v_milestone.streak_freeze_hours, 24)),
          updated_at = now()
      where user_id = v_uid
      returning streak_freeze_until into v_freeze_until;

    when 'icon' then
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_milestone.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_milestone.cosmetic_id, 'trophy_road')
      on conflict (user_id, cosmetic_id) do nothing;
      insert into public.user_cosmetics_equipped (user_id)
      values (v_uid)
      on conflict (user_id) do nothing;
      update public.user_cosmetics_equipped
      set icon_id = coalesce(icon_id, v_milestone.cosmetic_id),
          updated_at = now()
      where user_id = v_uid;

    when 'badge' then
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_milestone.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_milestone.cosmetic_id, 'trophy_road')
      on conflict (user_id, cosmetic_id) do nothing;

    when 'border' then
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_milestone.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_milestone.cosmetic_id, 'trophy_road')
      on conflict (user_id, cosmetic_id) do nothing;

    when 'skin' then
      select * into v_cosmetic from public.planckpass_cosmetics where id = v_milestone.cosmetic_id;
      insert into public.user_cosmetics_inventory (user_id, cosmetic_id, source)
      values (v_uid, v_milestone.cosmetic_id, 'trophy_road')
      on conflict (user_id, cosmetic_id) do nothing;
  end case;

  return jsonb_build_object(
    'milestoneId', p_milestone_id,
    'threshold', v_milestone.threshold,
    'rewardKind', v_milestone.reward_kind,
    'label', v_milestone.label,
    'coinsAmount', v_milestone.coins_amount,
    'eloAmount', v_milestone.elo_amount,
    'eloMultiplierMinutes', v_milestone.elo_multiplier_minutes,
    'streakFreezeHours', v_milestone.streak_freeze_hours,
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

revoke all on function public.claim_trophy_road_milestone(uuid) from public;
grant execute on function public.claim_trophy_road_milestone(uuid) to authenticated;
