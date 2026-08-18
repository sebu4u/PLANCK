-- PLANCKPASS shop: fixed catalog, atomic coin purchases, persistent purchased
-- workshop energy, and personal subscription coupons.

-- ---------------------------------------------------------------------------
-- Persistent purchased workshop energy
-- ---------------------------------------------------------------------------
alter table public.user_workshop_energy
  add column if not exists purchased_balance integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_workshop_energy_purchased_balance_check'
      and conrelid = 'public.user_workshop_energy'::regclass
  ) then
    alter table public.user_workshop_energy
      add constraint user_workshop_energy_purchased_balance_check
      check (purchased_balance >= 0);
  end if;
end;
$$;

-- Shop energy grants are audited in planckpass_shop_purchases / planckpass_coin_ledger.
-- The workshop energy ledger keeps the existing reason vocabulary from 20260802.

-- ---------------------------------------------------------------------------
-- Fixed catalog and user-owned records
-- ---------------------------------------------------------------------------
create table if not exists public.planckpass_shop_products (
  id text primary key,
  kind text not null check (kind in ('energy', 'coupon')),
  price_coins integer not null check (price_coins > 0),
  energy_amount integer check (energy_amount is null or energy_amount > 0),
  discount_percent integer check (
    discount_percent is null or discount_percent between 1 and 100
  ),
  billing_interval text check (
    billing_interval is null or billing_interval in ('week', 'month', 'year')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planckpass_shop_products_payload_check check (
    (
      kind = 'energy'
      and energy_amount is not null
      and discount_percent is null
      and billing_interval is null
    )
    or
    (
      kind = 'coupon'
      and energy_amount is null
      and discount_percent is not null
      and billing_interval is not null
    )
  )
);

insert into public.planckpass_shop_products (
  id,
  kind,
  price_coins,
  energy_amount,
  discount_percent,
  billing_interval,
  is_active,
  updated_at
)
values
  ('energy_25', 'energy', 250, 25, null, null, true, now()),
  ('month_50', 'coupon', 1250, null, 50, 'month', true, now()),
  ('year_10', 'coupon', 1500, null, 10, 'year', true, now()),
  ('week_90', 'coupon', 900, null, 90, 'week', true, now())
on conflict (id) do update
set kind = excluded.kind,
    price_coins = excluded.price_coins,
    energy_amount = excluded.energy_amount,
    discount_percent = excluded.discount_percent,
    billing_interval = excluded.billing_interval,
    is_active = true,
    updated_at = now();

create table if not exists public.planckpass_shop_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null references public.planckpass_shop_products(id),
  coin_cost integer not null check (coin_cost > 0),
  coins_before integer not null check (coins_before >= 0),
  coins_after integer not null check (coins_after >= 0),
  created_at timestamptz not null default now()
);

create index if not exists planckpass_shop_purchases_user_created_idx
  on public.planckpass_shop_purchases (user_id, created_at desc);

create table if not exists public.planckpass_coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null check (reason in ('shop_purchase')),
  purchase_id uuid not null references public.planckpass_shop_purchases(id)
    on delete restrict,
  created_at timestamptz not null default now(),
  unique (purchase_id)
);

create index if not exists planckpass_coin_ledger_user_created_idx
  on public.planckpass_coin_ledger (user_id, created_at desc);

create table if not exists public.planckpass_shop_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null references public.planckpass_shop_products(id),
  code text not null unique default (
    'PLANCK-' || upper(substr(encode(gen_random_bytes(12), 'hex'), 1, 20))
  ),
  percent_off integer not null check (percent_off between 1 and 100),
  interval text not null check (interval in ('week', 'month', 'year')),
  purchase_id uuid not null unique references public.planckpass_shop_purchases(id)
    on delete restrict,
  expires_at timestamptz,
  redeemed_at timestamptz,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  constraint planckpass_shop_coupons_redemption_check check (
    (redeemed_at is null and stripe_checkout_session_id is null)
    or redeemed_at is not null
  )
);

create unique index if not exists planckpass_shop_coupons_one_active_type_idx
  on public.planckpass_shop_coupons (user_id, product_key)
  where redeemed_at is null;

create index if not exists planckpass_shop_coupons_user_created_idx
  on public.planckpass_shop_coupons (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: catalog is readable; users can only read their own immutable history.
-- All mutations happen through the purchase RPC or service-role webhook.
-- ---------------------------------------------------------------------------
alter table public.planckpass_shop_products enable row level security;
alter table public.planckpass_shop_purchases enable row level security;
alter table public.planckpass_coin_ledger enable row level security;
alter table public.planckpass_shop_coupons enable row level security;

do $shop$
begin
  begin
    create policy "planckpass_shop_products_select"
      on public.planckpass_shop_products for select
      to authenticated
      using (is_active = true);
  exception
    when duplicate_object then null;
  end;

  begin
    create policy "planckpass_shop_purchases_select_own"
      on public.planckpass_shop_purchases for select
      to authenticated
      using ((select auth.uid()) = user_id);
  exception
    when duplicate_object then null;
  end;

  begin
    create policy "planckpass_coin_ledger_select_own"
      on public.planckpass_coin_ledger for select
      to authenticated
      using ((select auth.uid()) = user_id);
  exception
    when duplicate_object then null;
  end;

  begin
    create policy "planckpass_shop_coupons_select_own"
      on public.planckpass_shop_coupons for select
      to authenticated
      using ((select auth.uid()) = user_id);
  exception
    when duplicate_object then null;
  end;
end;
$shop$;

grant select on table public.planckpass_shop_products to authenticated;
grant select on table public.planckpass_shop_purchases to authenticated;
grant select on table public.planckpass_coin_ledger to authenticated;
grant select on table public.planckpass_shop_coupons to authenticated;
grant select, update on table public.planckpass_shop_coupons to service_role;

-- Preserve the 20260802 grant/reset behavior while exposing purchased energy
-- through the legacy balance field returned by this RPC. The stored balance
-- remains the weekly/current bucket; only the returned composite is adjusted.
create or replace function public.ensure_workshop_energy_grant(p_user_id uuid)
returns public.user_workshop_energy
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
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
    insert into public.user_workshop_energy (
      user_id,
      balance,
      carryover_balance,
      last_weekly_grant_week,
      updated_at
    )
    values (p_user_id, 0, 0, null, now())
    on conflict (user_id) do nothing;
  else
    insert into public.user_workshop_energy (
      user_id,
      balance,
      carryover_balance,
      last_weekly_grant_week,
      updated_at
    )
    values (p_user_id, 25, 0, null, now())
    on conflict (user_id) do nothing
    returning user_id into v_inserted_id;

    if v_inserted_id is not null then
      insert into public.user_workshop_energy_ledger (
        user_id,
        delta,
        reason,
        workshop_id
      )
      values (p_user_id, 25, 'signup_grant', null);
    end if;
  end if;

  select * into v_row
  from public.user_workshop_energy
  where user_id = p_user_id
  for update;

  if v_row.last_weekly_grant_week is not distinct from v_week then
    v_row.balance := coalesce(v_row.balance, 0)
      + coalesce(v_row.purchased_balance, 0);
    return v_row;
  end if;

  v_old_carryover := coalesce(v_row.carryover_balance, 0);
  v_old_balance := coalesce(v_row.balance, 0);

  if v_is_premium then
    if v_old_carryover > 0 then
      insert into public.user_workshop_energy_ledger (
        user_id,
        delta,
        reason,
        workshop_id
      )
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

    insert into public.user_workshop_energy_ledger (
      user_id,
      delta,
      reason,
      workshop_id
    )
    values (p_user_id, 100, 'weekly_reset', null);
  else
    if v_old_carryover > 0 then
      insert into public.user_workshop_energy_ledger (
        user_id,
        delta,
        reason,
        workshop_id
      )
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

  v_row.balance := coalesce(v_row.balance, 0)
    + coalesce(v_row.purchased_balance, 0);
  return v_row;
end;
$$;

grant execute on function public.ensure_workshop_energy_grant(uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Workshop unlock: carryover first, then current weekly balance, and purchased
-- energy last. Purchased energy is never touched by weekly grant/reset RPCs.
-- ---------------------------------------------------------------------------
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
    'meet_url', v_workshop.meet_url,
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

-- ---------------------------------------------------------------------------
-- Atomic authenticated purchase.
-- ---------------------------------------------------------------------------
create or replace function public.purchase_planckpass_shop_item(p_product_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_product public.planckpass_shop_products%rowtype;
  v_coins_before integer;
  v_coins_after integer;
  v_purchase_id uuid;
  v_coupon public.planckpass_shop_coupons%rowtype;
  v_purchased_balance integer;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Not authenticated';
  end if;

  if p_product_id is null or btrim(p_product_id) = '' then
    raise exception using errcode = '22023', message = 'Invalid product';
  end if;

  select *
  into v_product
  from public.planckpass_shop_products p
  where p.id = p_product_id
    and p.is_active = true;

  if v_product.id is null then
    raise exception using errcode = 'P0002', message = 'Product not found';
  end if;

  -- The row lock serializes concurrent purchases and double-clicks.
  select us.coins
  into v_coins_before
  from public.user_stats us
  where us.user_id = v_uid
  for update;

  if v_coins_before is null then
    raise exception using errcode = 'P0002', message = 'User stats not found';
  end if;

  -- Check before debiting so the partial unique index is also a final
  -- concurrency guard against two unredeemed coupons of the same type.
  if v_product.kind = 'coupon' and exists (
    select 1
    from public.planckpass_shop_coupons c
    where c.user_id = v_uid
      and c.product_key = v_product.id
      and c.redeemed_at is null
  ) then
    raise exception using errcode = '23505', message = 'Coupon already active';
  end if;

  if v_coins_before < v_product.price_coins then
    raise exception using errcode = 'P0001', message = 'Insufficient coins';
  end if;

  v_coins_after := v_coins_before - v_product.price_coins;

  update public.user_stats us
  set coins = v_coins_after,
      updated_at = now()
  where us.user_id = v_uid;

  insert into public.planckpass_shop_purchases (
    user_id,
    product_key,
    coin_cost,
    coins_before,
    coins_after
  )
  values (
    v_uid,
    v_product.id,
    v_product.price_coins,
    v_coins_before,
    v_coins_after
  )
  returning id into v_purchase_id;

  insert into public.planckpass_coin_ledger (
    user_id,
    delta,
    balance_after,
    reason,
    purchase_id
  )
  values (
    v_uid,
    -v_product.price_coins,
    v_coins_after,
    'shop_purchase',
    v_purchase_id
  );

  if v_product.kind = 'energy' then
    insert into public.user_workshop_energy (
      user_id,
      balance,
      carryover_balance,
      purchased_balance,
      updated_at
    )
    values (v_uid, 0, 0, v_product.energy_amount, now())
    on conflict (user_id) do update
    set purchased_balance = public.user_workshop_energy.purchased_balance
        + excluded.purchased_balance,
        updated_at = now()
    returning purchased_balance into v_purchased_balance;
  else
    insert into public.planckpass_shop_coupons (
      user_id,
      product_key,
      percent_off,
      interval,
      purchase_id
    )
    values (
      v_uid,
      v_product.id,
      v_product.discount_percent,
      v_product.billing_interval,
      v_purchase_id
    )
    returning * into v_coupon;
  end if;

  return jsonb_build_object(
    'ok', true,
    'purchaseId', v_purchase_id,
    'productId', v_product.id,
    'kind', v_product.kind,
    'priceCoins', v_product.price_coins,
    'coins', v_coins_after,
    'energyGranted', case
      when v_product.kind = 'energy' then v_product.energy_amount
      else null
    end,
    'purchasedBalance', v_purchased_balance,
    'coupon', case
      when v_coupon.id is null then null
      else jsonb_build_object(
        'id', v_coupon.id,
        'code', v_coupon.code,
        'productId', v_coupon.product_key,
        'discountPercent', v_coupon.percent_off,
        'billingInterval', v_coupon.interval,
        'createdAt', v_coupon.created_at
      )
    end
  );
end;
$$;

grant execute on function public.purchase_planckpass_shop_item(text) to authenticated;

