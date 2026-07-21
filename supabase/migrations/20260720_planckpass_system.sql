-- PLANCKPASS: seasons, tiers, cosmetics, XP progress, claims, inventory, boosts

-- ---------------------------------------------------------------------------
-- user_stats: coins + temporary boosts
-- ---------------------------------------------------------------------------
alter table if exists public.user_stats
  add column if not exists coins integer not null default 0;

alter table if exists public.user_stats
  add column if not exists elo_boost_until timestamptz;

alter table if exists public.user_stats
  add column if not exists streak_freeze_until timestamptz;

-- ---------------------------------------------------------------------------
-- Catalog / seasons
-- ---------------------------------------------------------------------------
create table if not exists public.planckpass_seasons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one active season
create unique index if not exists planckpass_seasons_one_active
  on public.planckpass_seasons (is_active)
  where is_active = true;

create table if not exists public.planckpass_cosmetics (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('icon', 'badge', 'border', 'skin')),
  name text not null,
  image_url text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.planckpass_tiers (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.planckpass_seasons(id) on delete cascade,
  tier_number integer not null check (tier_number >= 1 and tier_number <= 30),
  is_free boolean not null default false,
  reward_kind text not null check (
    reward_kind in (
      'icon', 'badge', 'border', 'skin',
      'elo', 'elo_2x', 'streak_freeze', 'coins'
    )
  ),
  label text not null default '',
  xp_required integer not null default 150 check (xp_required > 0),
  coins_amount integer,
  elo_amount integer,
  elo_multiplier_minutes integer,
  streak_freeze_hours integer,
  cosmetic_id uuid references public.planckpass_cosmetics(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, tier_number)
);

create table if not exists public.planckpass_user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.planckpass_seasons(id) on delete cascade,
  xp_total integer not null default 0 check (xp_total >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, season_id)
);

create table if not exists public.planckpass_user_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.planckpass_seasons(id) on delete cascade,
  tier_number integer not null check (tier_number >= 1 and tier_number <= 30),
  claimed_at timestamptz not null default now(),
  primary key (user_id, season_id, tier_number)
);

create table if not exists public.planckpass_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.planckpass_seasons(id) on delete cascade,
  source text not null,
  source_key text not null,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, season_id, source, source_key)
);

create table if not exists public.user_cosmetics_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cosmetic_id uuid not null references public.planckpass_cosmetics(id) on delete cascade,
  source text not null default 'planckpass',
  acquired_at timestamptz not null default now(),
  unique (user_id, cosmetic_id)
);

create table if not exists public.user_cosmetics_equipped (
  user_id uuid primary key references auth.users(id) on delete cascade,
  icon_id uuid references public.planckpass_cosmetics(id) on delete set null,
  border_id uuid references public.planckpass_cosmetics(id) on delete set null,
  badge_id uuid references public.planckpass_cosmetics(id) on delete set null,
  skin_id uuid references public.planckpass_cosmetics(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.planckpass_seasons enable row level security;
alter table public.planckpass_cosmetics enable row level security;
alter table public.planckpass_tiers enable row level security;
alter table public.planckpass_user_progress enable row level security;
alter table public.planckpass_user_claims enable row level security;
alter table public.planckpass_xp_events enable row level security;
alter table public.user_cosmetics_inventory enable row level security;
alter table public.user_cosmetics_equipped enable row level security;

drop policy if exists "planckpass_seasons_select_all" on public.planckpass_seasons;
create policy "planckpass_seasons_select_all"
  on public.planckpass_seasons for select
  to anon, authenticated
  using (true);

drop policy if exists "planckpass_cosmetics_select_all" on public.planckpass_cosmetics;
create policy "planckpass_cosmetics_select_all"
  on public.planckpass_cosmetics for select
  to anon, authenticated
  using (true);

drop policy if exists "planckpass_tiers_select_all" on public.planckpass_tiers;
create policy "planckpass_tiers_select_all"
  on public.planckpass_tiers for select
  to anon, authenticated
  using (true);

drop policy if exists "planckpass_user_progress_select_own" on public.planckpass_user_progress;
create policy "planckpass_user_progress_select_own"
  on public.planckpass_user_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "planckpass_user_claims_select_own" on public.planckpass_user_claims;
create policy "planckpass_user_claims_select_own"
  on public.planckpass_user_claims for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "planckpass_xp_events_select_own" on public.planckpass_xp_events;
create policy "planckpass_xp_events_select_own"
  on public.planckpass_xp_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_cosmetics_inventory_select_own" on public.user_cosmetics_inventory;
create policy "user_cosmetics_inventory_select_own"
  on public.user_cosmetics_inventory for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_cosmetics_equipped_select_own" on public.user_cosmetics_equipped;
create policy "user_cosmetics_equipped_select_own"
  on public.user_cosmetics_equipped for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_cosmetics_equipped_select_all" on public.user_cosmetics_equipped;
create policy "user_cosmetics_equipped_select_all"
  on public.user_cosmetics_equipped for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.planckpass_default_xp_for_tier(p_tier integer)
returns integer
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_tier between 1 and 5 then return 150;
  elsif p_tier between 6 and 10 then return 250;
  elsif p_tier between 11 and 15 then return 350;
  elsif p_tier between 16 and 20 then return 450;
  elsif p_tier between 21 and 25 then return 550;
  else return 650;
  end if;
end;
$$;

create or replace function public.planckpass_xp_for_difficulty(p_difficulty text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  d text := lower(trim(coalesce(p_difficulty, '')));
begin
  case d
    when 'ușor' then return 40;
    when 'usor' then return 40;
    when 'easy' then return 40;
    when 'inițiere' then return 40;
    when 'initiere' then return 40;
    when 'mediu' then return 70;
    when 'medium' then return 70;
    when 'avansat' then return 110;
    when 'hard' then return 110;
    when 'difficult' then return 110;
    when 'concurs' then return 110;
    else return 40;
  end case;
end;
$$;

create or replace function public.get_active_planckpass_season_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.planckpass_seasons where is_active = true limit 1;
$$;

-- Seed 30 empty tiers for a season (coins placeholders; admin edits rewards)
create or replace function public.planckpass_seed_season_tiers(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  for i in 1..30 loop
    insert into public.planckpass_tiers (
      season_id, tier_number, is_free, reward_kind, label, xp_required, coins_amount
    )
    values (
      p_season_id,
      i,
      ((i - 1) % 5 = 0),
      'coins',
      case when (i - 1) % 5 = 0 then '50' else '100' end,
      public.planckpass_default_xp_for_tier(i),
      case when (i - 1) % 5 = 0 then 50 else 100 end
    )
    on conflict (season_id, tier_number) do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Award XP (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.award_planckpass_xp(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_key text
)
returns table (
  awarded boolean,
  xp_total integer,
  season_id uuid,
  amount integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_season uuid;
  v_inserted boolean := false;
  v_total integer := 0;
begin
  perform set_config('row_security', 'off', true);

  if p_user_id is null
     or coalesce(p_amount, 0) <= 0
     or coalesce(p_source, '') = ''
     or coalesce(p_source_key, '') = '' then
    return query select false, 0, null::uuid, 0;
    return;
  end if;

  select s.id into v_season
  from public.planckpass_seasons s
  where s.is_active = true
  limit 1;

  if v_season is null then
    return query select false, 0, null::uuid, 0;
    return;
  end if;

  insert into public.planckpass_user_progress as upp (user_id, season_id, xp_total, updated_at)
  values (p_user_id, v_season, 0, now())
  on conflict (user_id, season_id) do nothing;

  insert into public.planckpass_xp_events as ev (user_id, season_id, source, source_key, amount)
  values (p_user_id, v_season, p_source, p_source_key, p_amount)
  on conflict (user_id, season_id, source, source_key) do nothing
  returning true into v_inserted;

  v_inserted := coalesce(v_inserted, false);

  if v_inserted then
    update public.planckpass_user_progress as upp
    set xp_total = upp.xp_total + p_amount,
        updated_at = now()
    where upp.user_id = p_user_id
      and upp.season_id = v_season
    returning upp.xp_total into v_total;
  else
    select upp.xp_total into v_total
    from public.planckpass_user_progress as upp
    where upp.user_id = p_user_id
      and upp.season_id = v_season;
  end if;

  return query
    select
      v_inserted,
      coalesce(v_total, 0),
      v_season,
      case when v_inserted then p_amount else 0 end;
end;
$$;

revoke all on function public.award_planckpass_xp(uuid, integer, text, text) from public;
grant execute on function public.award_planckpass_xp(uuid, integer, text, text) to authenticated;
grant execute on function public.award_planckpass_xp(uuid, integer, text, text) to service_role;

-- Authenticated wrapper: only self
create or replace function public.award_planckpass_xp_self(
  p_amount integer,
  p_source text,
  p_source_key text
)
returns table (
  awarded boolean,
  xp_total integer,
  season_id uuid,
  amount integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  return query
    select * from public.award_planckpass_xp(v_uid, p_amount, p_source, p_source_key);
end;
$$;

revoke all on function public.award_planckpass_xp_self(integer, text, text) from public;
grant execute on function public.award_planckpass_xp_self(integer, text, text) to authenticated;

-- Safe wrapper for PERFORM from other RPCs (reliable SRF invocation)
create or replace function public._planckpass_award_safe(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.award_planckpass_xp(p_user_id, p_amount, p_source, p_source_key);
exception
  when others then
    raise notice 'PlanckPass XP skipped: %', SQLERRM;
end;
$$;

grant execute on function public._planckpass_award_safe(uuid, integer, text, text) to authenticated;
grant execute on function public._planckpass_award_safe(uuid, integer, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Claim tier
-- ---------------------------------------------------------------------------
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

  select coalesce(upp.xp_total, 0) into v_xp
  from public.planckpass_user_progress upp
  where upp.user_id = v_uid and upp.season_id = v_season;

  select coalesce(sum(t.xp_required), 0) into v_needed
  from public.planckpass_tiers t
  where t.season_id = v_season and t.tier_number <= p_tier_number;

  if coalesce(v_xp, 0) < v_needed then
    raise exception 'Tier încă blocat';
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

-- ---------------------------------------------------------------------------
-- Equip cosmetic
-- ---------------------------------------------------------------------------
create or replace function public.equip_planckpass_cosmetic(p_cosmetic_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cos public.planckpass_cosmetics%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.user_cosmetics_inventory
    where user_id = v_uid and cosmetic_id = p_cosmetic_id
  ) then
    raise exception 'Cosmetic neowned';
  end if;

  select * into v_cos from public.planckpass_cosmetics where id = p_cosmetic_id;
  if v_cos.id is null then
    raise exception 'Cosmetic inexistent';
  end if;

  insert into public.user_cosmetics_equipped (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  if v_cos.kind = 'icon' then
    update public.user_cosmetics_equipped
    set icon_id = p_cosmetic_id, updated_at = now()
    where user_id = v_uid;
  elsif v_cos.kind = 'border' then
    update public.user_cosmetics_equipped
    set border_id = p_cosmetic_id, updated_at = now()
    where user_id = v_uid;
  elsif v_cos.kind = 'badge' then
    update public.user_cosmetics_equipped
    set badge_id = p_cosmetic_id, updated_at = now()
    where user_id = v_uid;
  elsif v_cos.kind = 'skin' then
    update public.user_cosmetics_equipped
    set skin_id = p_cosmetic_id, updated_at = now()
    where user_id = v_uid;
  end if;

  return jsonb_build_object(
    'id', v_cos.id,
    'kind', v_cos.kind,
    'name', v_cos.name,
    'imageUrl', v_cos.image_url
  );
end;
$$;

revoke all on function public.equip_planckpass_cosmetic(uuid) from public;
grant execute on function public.equip_planckpass_cosmetic(uuid) to authenticated;

create or replace function public.unequip_planckpass_cosmetic(p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_kind not in ('icon', 'border', 'badge', 'skin') then
    raise exception 'Kind invalid';
  end if;

  insert into public.user_cosmetics_equipped (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  if p_kind = 'icon' then
    update public.user_cosmetics_equipped set icon_id = null, updated_at = now() where user_id = v_uid;
  elsif p_kind = 'border' then
    update public.user_cosmetics_equipped set border_id = null, updated_at = now() where user_id = v_uid;
  elsif p_kind = 'badge' then
    update public.user_cosmetics_equipped set badge_id = null, updated_at = now() where user_id = v_uid;
  elsif p_kind = 'skin' then
    update public.user_cosmetics_equipped set skin_id = null, updated_at = now() where user_id = v_uid;
  end if;
end;
$$;

revoke all on function public.unequip_planckpass_cosmetic(text) from public;
grant execute on function public.unequip_planckpass_cosmetic(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Streak freeze: skip reset while active
-- ---------------------------------------------------------------------------
create or replace function public.check_and_reset_streak_if_needed(user_uuid uuid)
returns void as $$
declare
  last_activity timestamptz;
  current_streak_count integer;
  v_freeze_until timestamptz;
begin
  if auth.uid() is distinct from user_uuid then
    return;
  end if;

  select us.streak_freeze_until into v_freeze_until
  from public.user_stats us
  where us.user_id = user_uuid;

  if v_freeze_until is not null and v_freeze_until > now() then
    return;
  end if;

  select public.get_user_last_activity_at(user_uuid) into last_activity;

  select us.current_streak into current_streak_count
  from public.user_stats us
  where us.user_id = user_uuid;

  if last_activity = '-infinity'::timestamptz then
    if coalesce(current_streak_count, 0) > 0 then
      update public.user_stats
      set current_streak = 0,
          best_streak = greatest(best_streak, current_streak_count)
      where user_id = user_uuid;
    end if;
    return;
  end if;

  if now() - last_activity < interval '24 hours' then
    return;
  end if;

  update public.user_stats
  set current_streak = 0,
      best_streak = greatest(best_streak, coalesce(current_streak_count, 0))
  where user_id = user_uuid;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- 2x ELO boost helper
-- ---------------------------------------------------------------------------
create or replace function public.apply_elo_boost_multiplier(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_until timestamptz;
begin
  if coalesce(p_amount, 0) <= 0 then
    return coalesce(p_amount, 0);
  end if;
  select elo_boost_until into v_until
  from public.user_stats
  where user_id = p_user_id;
  if v_until is not null and v_until > now() then
    return p_amount * 2;
  end if;
  return p_amount;
end;
$$;

-- ---------------------------------------------------------------------------
-- Patch award_elo_for_problem: 2x boost + PlanckPass XP
-- (keeps existing gain amounts from 20260420)
-- ---------------------------------------------------------------------------
create or replace function public.award_elo_for_problem(user_uuid uuid, problem_id_param text)
returns void as $$
declare
  problem_difficulty text;
  elo_to_award integer;
  today_date date := current_date;
  current_problems_solved integer;
  new_activity_level integer;
  challenge_id uuid;
  challenge_bonus integer;
  challenge_completed boolean;
  old_last_activity_date date;
  newest_solve timestamptz;
  prev_solve timestamptz;
  v_xp integer;
begin
  begin
    select difficulty into problem_difficulty
    from public.problems
    where id::text = problem_id_param
    limit 1;

    if problem_difficulty is null then
      select difficulty into problem_difficulty
      from public.problems
      where id = problem_id_param::uuid
      limit 1;
    end if;
  exception
    when others then
      select difficulty into problem_difficulty
      from public.problems
      where id::text = problem_id_param
      limit 1;
  end;

  if problem_difficulty is null then
    raise notice 'EROARE: Problem difficulty not found for problem_id: %', problem_id_param;
    return;
  end if;

  case problem_difficulty
    when 'Ușor' then elo_to_award := 200;
    when 'Mediu' then elo_to_award := 300;
    when 'Avansat' then elo_to_award := 450;
    when 'Easy' then elo_to_award := 200;
    when 'Medium' then elo_to_award := 300;
    when 'Hard' then elo_to_award := 450;
    when 'Difficult' then elo_to_award := 450;
    else
      elo_to_award := 200;
  end case;

  elo_to_award := public.apply_elo_boost_multiplier(user_uuid, elo_to_award);

  insert into public.user_stats (user_id, elo, rank)
  values (user_uuid, 500, 'Bronze III')
  on conflict (user_id) do nothing;

  select last_activity_date into old_last_activity_date
  from public.user_stats
  where user_id = user_uuid;

  update public.user_stats
  set elo = elo + elo_to_award,
      problems_solved_today = case
        when old_last_activity_date is distinct from today_date then 1
        else problems_solved_today + 1
      end,
      problems_solved_total = problems_solved_total + 1,
      last_activity_date = today_date,
      updated_at = now()
  where user_id = user_uuid;

  begin
    select id, bonus_elo
      into challenge_id, challenge_bonus
    from public.daily_challenges
    where active_date = today_date
      and problem_id::text = problem_id_param
    limit 1;

    if challenge_id is not null then
      select completed
        into challenge_completed
      from public.user_challenges
      where user_id = user_uuid
        and challenge_id = challenge_id
      limit 1;

      if challenge_completed is distinct from true then
        insert into public.user_challenges (user_id, challenge_id, completed, completed_at)
        values (user_uuid, challenge_id, true, now())
        on conflict (user_id, challenge_id) do update
          set completed = true,
              completed_at = now();

        update public.user_stats
        set elo = elo + public.apply_elo_boost_multiplier(user_uuid, coalesce(challenge_bonus, 10)),
            updated_at = now()
        where user_id = user_uuid;
      end if;
    end if;
  exception
    when others then
      raise notice 'EROARE non-critică în daily challenge bonus: %', SQLERRM;
  end;

  -- PlanckPass XP (idempotent per problem)
  begin
    v_xp := public.planckpass_xp_for_difficulty(problem_difficulty);
    perform public._planckpass_award_safe(user_uuid, v_xp, 'problem', problem_id_param);
  exception
    when others then
      raise notice 'EROARE non-critică PlanckPass XP: %', SQLERRM;
  end;

  begin
    insert into public.daily_activity (user_id, activity_date, problems_solved, time_minutes, activity_level)
    values (user_uuid, today_date, 1, 0, 1)
    on conflict (user_id, activity_date) do update
    set problems_solved = daily_activity.problems_solved + 1,
        updated_at = now();

    select problems_solved into current_problems_solved
    from public.daily_activity
    where user_id = user_uuid and activity_date = today_date;

    if current_problems_solved >= 5 then
      new_activity_level := 4;
    elsif current_problems_solved >= 3 then
      new_activity_level := 3;
    elsif current_problems_solved >= 2 then
      new_activity_level := 2;
    elsif current_problems_solved >= 1 then
      new_activity_level := 1;
    else
      new_activity_level := 0;
    end if;

    update public.daily_activity
    set activity_level = new_activity_level
    where user_id = user_uuid and activity_date = today_date;

    select max(sp.solved_at) into newest_solve
    from public.solved_problems sp
    where sp.user_id = user_uuid;

    select max(sp.solved_at) into prev_solve
    from public.solved_problems sp
    where sp.user_id = user_uuid
      and sp.solved_at < newest_solve;

    if prev_solve is null or (newest_solve - prev_solve >= interval '24 hours') then
      -- respect streak freeze
      if not exists (
        select 1 from public.user_stats
        where user_id = user_uuid
          and streak_freeze_until is not null
          and streak_freeze_until > now()
      ) then
        update public.user_stats
        set current_streak = 0
        where user_id = user_uuid;
      end if;
    end if;

    perform public.update_user_streak(user_uuid, old_last_activity_date);
    perform public.check_and_award_badges(user_uuid);
  exception
    when others then
      raise notice 'EROARE non-critică în daily_activity/streak/badges: %', SQLERRM;
  end;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- Learning path interactive: +15 ELO (boosted) + 35 XP
-- ---------------------------------------------------------------------------
create or replace function public.award_learning_path_item_elo(
  item_id_param uuid,
  lesson_id_param uuid default null,
  is_last_item_param boolean default false
)
returns table (
  awarded boolean,
  previous_elo integer,
  new_elo integer,
  award_amount integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_award_amount integer := 15;
  v_inserted boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.learning_path_lesson_items lpli
    where lpli.id = item_id_param
      and lpli.item_type in ('grila', 'problem', 'poll', 'fill_slot')
  ) then
    raise exception 'Learning path item is not eligible for answer ELO';
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (v_user_id, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  insert into public.user_learning_path_item_progress (user_id, item_id, completed_at)
  values (v_user_id, item_id_param, now())
  on conflict (user_id, item_id) do nothing
  returning true into v_inserted;

  v_inserted := coalesce(v_inserted, false);

  if is_last_item_param and lesson_id_param is not null then
    insert into public.user_learning_path_lesson_progress (user_id, lesson_id, completed_at)
    values (v_user_id, lesson_id_param, now())
    on conflict (user_id, lesson_id)
    do update set completed_at = excluded.completed_at;
  end if;

  select us.elo
  into previous_elo
  from public.user_stats us
  where us.user_id = v_user_id
  for update;

  if v_inserted then
    v_award_amount := public.apply_elo_boost_multiplier(v_user_id, v_award_amount);

    update public.user_stats
    set
      elo = elo + v_award_amount,
      updated_at = now()
    where user_id = v_user_id
    returning elo into new_elo;

    begin
      perform public.record_user_streak_activity(v_user_id);
    exception
      when others then
        raise notice 'EROARE non-critică în learning path streak: %', SQLERRM;
    end;

    begin
      perform public._planckpass_award_safe(v_user_id, 35, 'lp_interactive', item_id_param::text);
    exception
      when others then
        raise notice 'EROARE non-critică PlanckPass XP LP: %', SQLERRM;
    end;
  else
    new_elo := previous_elo;
  end if;

  awarded := v_inserted;
  award_amount := case when v_inserted then v_award_amount else 0 end;

  return next;
end;
$$;

grant execute on function public.award_learning_path_item_elo(uuid, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- LP test: +80 XP on first pass
-- ---------------------------------------------------------------------------
create or replace function public.submit_lp_test(
  p_item_id uuid,
  p_answers jsonb
)
returns table (
  score_total integer,
  score_correct integer,
  passed boolean,
  results jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_item record;
  v_problems jsonb;
  v_problem jsonb;
  v_total integer := 0;
  v_correct integer := 0;
  v_passed boolean := false;
  v_results jsonb := '[]'::jsonb;
  v_user_choice text;
  v_correct_id text;
  v_problem_id text;
  v_is_correct boolean;
  v_inserted boolean := false;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'auth required';
  end if;

  select id, item_type, content_json
    into v_item
    from public.learning_path_lesson_items
   where id = p_item_id
     and is_active = true;

  if v_item.id is null then
    raise exception 'item_not_found';
  end if;
  if v_item.item_type <> 'test' then
    raise exception 'item_not_test';
  end if;

  v_problems := coalesce(v_item.content_json -> 'problems', '[]'::jsonb);
  if jsonb_typeof(v_problems) <> 'array' or jsonb_array_length(v_problems) = 0 then
    raise exception 'test_has_no_problems';
  end if;

  for v_problem in select * from jsonb_array_elements(v_problems)
  loop
    v_total := v_total + 1;
    v_problem_id := v_problem->>'id';
    v_correct_id := v_problem->>'correctOptionId';
    v_user_choice := coalesce(p_answers->>v_problem_id, '');
    v_is_correct := v_user_choice <> '' and v_user_choice = v_correct_id;
    if v_is_correct then
      v_correct := v_correct + 1;
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'problemId', v_problem_id,
      'selectedOptionId', case when v_user_choice = '' then null else v_user_choice end,
      'correctOptionId', v_correct_id,
      'isCorrect', v_is_correct
    ));
  end loop;

  v_passed := v_total > 0 and (v_correct::numeric / v_total::numeric) > 0.8;

  if v_passed then
    insert into public.user_learning_path_item_progress (user_id, item_id, completed_at)
      values (v_uid, p_item_id, now())
      on conflict (user_id, item_id) do nothing
      returning true into v_inserted;

    v_inserted := coalesce(v_inserted, false);

    if not v_inserted then
      update public.user_learning_path_item_progress
      set completed_at = now()
      where user_id = v_uid and item_id = p_item_id;
    else
      begin
        perform public.record_user_streak_activity(v_uid);
      exception
        when others then
          raise notice 'EROARE non-critică în learning path test streak: %', SQLERRM;
      end;
      begin
        perform public._planckpass_award_safe(v_uid, 80, 'lp_test', p_item_id::text);
      exception
        when others then
          raise notice 'EROARE non-critică PlanckPass XP test: %', SQLERRM;
      end;
    end if;
  else
    v_results := '[]'::jsonb;
  end if;

  score_total := v_total;
  score_correct := v_correct;
  passed := v_passed;
  results := v_results;
  return next;
end;
$$;

revoke all on function public.submit_lp_test(uuid, jsonb) from public;
grant execute on function public.submit_lp_test(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Coding: 2x on positive delta + XP once per problem
-- ---------------------------------------------------------------------------
create or replace function public.apply_coding_problem_elo_delta(
  p_user_id uuid,
  p_problem_id uuid,
  p_old_best numeric,
  p_new_best numeric,
  p_prior_submission_count integer
)
returns table (
  previous_elo integer,
  new_elo integer,
  delta_elo integer,
  old_best numeric,
  new_best numeric,
  max_gain integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_diff text;
  v_max integer;
  v_old_t integer;
  v_new_t integer;
  v_delta integer;
  v_prev integer;
  v_new integer;
  v_nb numeric := greatest(coalesce(p_old_best, 0), coalesce(p_new_best, 0));
  v_ob numeric := greatest(0, coalesce(p_old_best, 0));
  v_xp integer;
begin
  if p_user_id is null then
    raise exception 'apply_coding_problem_elo_delta: p_user_id required';
  end if;

  select cp.difficulty into v_diff
  from public.coding_problems cp
  where cp.id = p_problem_id
  limit 1;

  if v_diff is null then
    raise exception 'apply_coding_problem_elo_delta: problem not found';
  end if;

  v_max := public.coding_max_elo_gain_for_difficulty(v_diff);
  if coalesce(p_prior_submission_count, 0) <= 0 then
    v_old_t := 0;
  else
    v_old_t := public.coding_elo_target(v_ob, v_max);
  end if;
  v_new_t := public.coding_elo_target(v_nb, v_max);
  v_delta := v_new_t - v_old_t;

  if v_delta = 0 then
    select us.elo into v_prev from public.user_stats us where us.user_id = p_user_id;
    if v_prev is null then
      v_prev := 500;
    end if;
    previous_elo := v_prev;
    new_elo := v_prev;
    delta_elo := 0;
    old_best := v_ob;
    new_best := v_nb;
    max_gain := v_max;
    return next;
    return;
  end if;

  -- Double only positive gains
  if v_delta > 0 then
    v_delta := public.apply_elo_boost_multiplier(p_user_id, v_delta);
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (p_user_id, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  select us.elo into v_prev
  from public.user_stats us
  where us.user_id = p_user_id
  for update;

  if v_prev is null then
    v_prev := 500;
  end if;

  v_new := greatest(0, v_prev + v_delta);

  update public.user_stats us
  set
    elo = v_new,
    rank = public.get_rank_from_elo(v_new),
    updated_at = now()
  where us.user_id = p_user_id;

  -- XP once per coding problem (first time best improves with positive progress)
  if v_delta > 0 then
    begin
      v_xp := public.planckpass_xp_for_difficulty(v_diff);
      perform public._planckpass_award_safe(p_user_id, v_xp, 'coding', p_problem_id::text);
    exception
      when others then
        raise notice 'EROARE non-critică PlanckPass XP coding: %', SQLERRM;
    end;
  end if;

  previous_elo := v_prev;
  new_elo := v_new;
  delta_elo := v_new - v_prev;
  old_best := v_ob;
  new_best := v_nb;
  max_gain := v_max;
  return next;
end;
$$;

revoke all on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) from public;
revoke all on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) from anon;
revoke all on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) from authenticated;
grant execute on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket for cosmetics
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('planckpass-cosmetics', 'planckpass-cosmetics', true)
on conflict (id) do nothing;

drop policy if exists "planckpass_cosmetics_public_read" on storage.objects;
create policy "planckpass_cosmetics_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'planckpass-cosmetics');

drop policy if exists "planckpass_cosmetics_service_write" on storage.objects;
create policy "planckpass_cosmetics_service_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'planckpass-cosmetics');

drop policy if exists "planckpass_cosmetics_service_update" on storage.objects;
create policy "planckpass_cosmetics_service_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'planckpass-cosmetics');

drop policy if exists "planckpass_cosmetics_service_delete" on storage.objects;
create policy "planckpass_cosmetics_service_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'planckpass-cosmetics');

grant execute on function public.planckpass_seed_season_tiers(uuid) to service_role;

-- Respect streak freeze when recording activity gaps
create or replace function public.record_user_streak_activity(user_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := current_date;
  old_last_activity_date date;
  current_problems_solved integer;
  new_activity_level integer;
  newest_activity timestamptz;
  prev_activity timestamptz;
  new_streak integer;
  v_freeze_until timestamptz;
begin
  if auth.uid() is distinct from user_uuid then
    raise exception 'Not authorized';
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (user_uuid, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  select last_activity_date, streak_freeze_until
    into old_last_activity_date, v_freeze_until
  from public.user_stats
  where user_id = user_uuid;

  update public.user_stats
  set problems_solved_today = case
        when old_last_activity_date is distinct from today_date then 1
        else problems_solved_today + 1
      end,
      last_activity_date = today_date,
      updated_at = now()
  where user_id = user_uuid;

  insert into public.daily_activity (user_id, activity_date, problems_solved, time_minutes, activity_level)
  values (user_uuid, today_date, 1, 0, 1)
  on conflict (user_id, activity_date) do update
  set problems_solved = daily_activity.problems_solved + 1,
      updated_at = now();

  select problems_solved into current_problems_solved
  from public.daily_activity
  where user_id = user_uuid and activity_date = today_date;

  if current_problems_solved >= 5 then
    new_activity_level := 4;
  elsif current_problems_solved >= 3 then
    new_activity_level := 3;
  elsif current_problems_solved >= 2 then
    new_activity_level := 2;
  elsif current_problems_solved >= 1 then
    new_activity_level := 1;
  else
    new_activity_level := 0;
  end if;

  update public.daily_activity
  set activity_level = new_activity_level
  where user_id = user_uuid and activity_date = today_date;

  select public.get_user_last_activity_at(user_uuid) into newest_activity;

  select greatest(
    coalesce(
      (select max(sp.solved_at)
       from public.solved_problems sp
       where sp.user_id = user_uuid
         and sp.solved_at < newest_activity),
      '-infinity'::timestamptz
    ),
    coalesce(
      (select max(ulpp.completed_at)
       from public.user_learning_path_item_progress ulpp
       where ulpp.user_id = user_uuid
         and ulpp.completed_at < newest_activity),
      '-infinity'::timestamptz
    )
  ) into prev_activity;

  if (v_freeze_until is null or v_freeze_until <= now())
     and (
       prev_activity = '-infinity'::timestamptz
       or (newest_activity - prev_activity >= interval '24 hours')
     ) then
    update public.user_stats
    set current_streak = 0
    where user_id = user_uuid;
  end if;

  perform public.update_user_streak(user_uuid, old_last_activity_date);
  perform public.check_and_award_badges(user_uuid);

  select current_streak into new_streak
  from public.user_stats
  where user_id = user_uuid;

  return coalesce(new_streak, 0);
end;
$$;

grant execute on function public.record_user_streak_activity(uuid) to authenticated;
