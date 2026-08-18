-- Prize wheel campaign, spins, and per-user prizes.
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

create table if not exists public.prize_wheel_campaigns (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz,
  ends_at timestamptz,
  guaranteed_1leu_limit integer not null default 25,
  guaranteed_1leu_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prize_wheel_campaigns_limit_check check (guaranteed_1leu_limit >= 0),
  constraint prize_wheel_campaigns_awarded_check check (guaranteed_1leu_awarded >= 0),
  constraint prize_wheel_campaigns_window_check check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create table if not exists public.prize_wheel_spins (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.prize_wheel_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  result text not null,
  segment_index integer not null,
  created_at timestamptz not null default now(),
  constraint prize_wheel_spins_result_check check (
    result in ('spin_again', 'trial_7_days', 'year_50', 'month_70', 'year_1_leu')
  ),
  constraint prize_wheel_spins_segment_check check (segment_index between 0 and 5)
);

create table if not exists public.prize_wheel_prizes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.prize_wheel_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prize_type text not null,
  code text not null,
  email text,
  display_name text,
  redeemed_at timestamptz,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  constraint prize_wheel_prizes_type_check check (
    prize_type in ('trial_7_days', 'year_50', 'month_70', 'year_1_leu')
  ),
  constraint prize_wheel_prizes_user_campaign_key unique (campaign_id, user_id),
  constraint prize_wheel_prizes_code_key unique (code)
);

create index if not exists prize_wheel_spins_user_campaign_idx
  on public.prize_wheel_spins (campaign_id, user_id, created_at);

create index if not exists prize_wheel_prizes_user_idx
  on public.prize_wheel_prizes (user_id);

create index if not exists prize_wheel_prizes_campaign_created_idx
  on public.prize_wheel_prizes (campaign_id, created_at desc);

alter table if exists public.prize_wheel_campaigns enable row level security;
alter table if exists public.prize_wheel_spins enable row level security;
alter table if exists public.prize_wheel_prizes enable row level security;

-- Campaign window is public (no secrets). Writes stay on service_role / RPC.
drop policy if exists "prize_wheel_campaigns_select_public" on public.prize_wheel_campaigns;
create policy "prize_wheel_campaigns_select_public"
  on public.prize_wheel_campaigns for select
  to anon, authenticated
  using (true);

drop policy if exists "prize_wheel_spins_select_own" on public.prize_wheel_spins;
create policy "prize_wheel_spins_select_own"
  on public.prize_wheel_spins for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "prize_wheel_prizes_select_own" on public.prize_wheel_prizes;
create policy "prize_wheel_prizes_select_own"
  on public.prize_wheel_prizes for select
  to authenticated
  using ((select auth.uid()) = user_id);

insert into public.prize_wheel_campaigns (starts_at, ends_at)
select null, null
where not exists (select 1 from public.prize_wheel_campaigns);

create or replace function public.spin_prize_wheel(p_user_id uuid, p_is_premium boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.prize_wheel_campaigns%rowtype;
  v_spin_count integer;
  v_result text;
  v_segment integer;
  v_code text;
  v_prize_id uuid;
  v_pool text[];
  v_pick integer;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i integer;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_user');
  end if;

  select *
    into v_campaign
  from public.prize_wheel_campaigns
  order by created_at asc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_campaign');
  end if;

  if v_campaign.starts_at is null
     or v_campaign.ends_at is null
     or now() < v_campaign.starts_at
     or now() >= v_campaign.ends_at then
    return jsonb_build_object('ok', false, 'error', 'campaign_inactive');
  end if;

  if exists (
    select 1
    from public.prize_wheel_prizes
    where user_id = p_user_id
      and campaign_id = v_campaign.id
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_won');
  end if;

  select count(*)::integer
    into v_spin_count
  from public.prize_wheel_spins
  where user_id = p_user_id
    and campaign_id = v_campaign.id;

  if v_spin_count >= 2 then
    return jsonb_build_object('ok', false, 'error', 'already_won');
  end if;

  if v_spin_count = 0 then
    insert into public.prize_wheel_spins (campaign_id, user_id, result, segment_index)
    values (v_campaign.id, p_user_id, 'spin_again', 1);

    return jsonb_build_object(
      'ok', true,
      'result', 'spin_again',
      'segment_index', 1,
      'code', null,
      'prize_id', null
    );
  end if;

  if v_campaign.guaranteed_1leu_awarded < v_campaign.guaranteed_1leu_limit then
    v_result := 'year_1_leu';
    v_segment := 5;
    update public.prize_wheel_campaigns
    set guaranteed_1leu_awarded = guaranteed_1leu_awarded + 1,
        updated_at = now()
    where id = v_campaign.id;
  else
    if coalesce(p_is_premium, false) then
      v_pool := array['year_50', 'month_70'];
    else
      v_pool := array['trial_7_days', 'year_50', 'month_70'];
    end if;
    v_pick := 1 + floor(random() * array_length(v_pool, 1))::integer;
    v_result := v_pool[v_pick];
    v_segment := case v_result
      when 'trial_7_days' then 0
      when 'year_50' then 2
      when 'month_70' then 3
      else 5
    end;
  end if;

  loop
    v_code := 'PLANCK-';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1);
    end loop;
    exit when not exists (select 1 from public.prize_wheel_prizes where code = v_code);
  end loop;

  insert into public.prize_wheel_spins (campaign_id, user_id, result, segment_index)
  values (v_campaign.id, p_user_id, v_result, v_segment);

  insert into public.prize_wheel_prizes (campaign_id, user_id, prize_type, code)
  values (v_campaign.id, p_user_id, v_result, v_code)
  returning id into v_prize_id;

  return jsonb_build_object(
    'ok', true,
    'result', v_result,
    'segment_index', v_segment,
    'code', v_code,
    'prize_id', v_prize_id
  );
end;
$$;

revoke all on function public.spin_prize_wheel(uuid, boolean) from public, anon, authenticated;
grant execute on function public.spin_prize_wheel(uuid, boolean) to service_role;
