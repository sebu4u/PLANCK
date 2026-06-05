-- Harden subscription/billing columns against client-side tampering.
-- Extends 20260531_insight_usage_security.sql with INSERT protection,
-- RPC lockdown, and tighter referrals RLS.

-- ---------------------------------------------------------------------------
-- 1. Protect sensitive profile columns on INSERT and UPDATE
--    (service_role / Stripe webhooks / referral jobs still work)
-- ---------------------------------------------------------------------------
create or replace function public.protect_profiles_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'free';
    new.plus_months_remaining := 0;
    new.referred_by := null;
    new.referral_code := null;
    new.is_admin := false;
    new.is_dev := false;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.stripe_price_id := null;
    new.stripe_subscription_status := null;
    new.stripe_current_period_end := null;
    return new;
  end if;

  -- UPDATE: preserve server-controlled values
  new.plan := old.plan;
  new.plus_months_remaining := old.plus_months_remaining;
  new.referred_by := old.referred_by;
  new.referral_code := old.referral_code;
  new.is_admin := old.is_admin;
  new.is_dev := old.is_dev;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.stripe_price_id := old.stripe_price_id;
  new.stripe_subscription_status := old.stripe_subscription_status;
  new.stripe_current_period_end := old.stripe_current_period_end;

  return new;
end;
$$;

drop trigger if exists trg_protect_profiles_sensitive_columns on public.profiles;
create trigger trg_protect_profiles_sensitive_columns
before update on public.profiles
for each row execute function public.protect_profiles_sensitive_columns();

drop trigger if exists trg_protect_profiles_sensitive_columns_insert on public.profiles;
create trigger trg_protect_profiles_sensitive_columns_insert
before insert on public.profiles
for each row execute function public.protect_profiles_sensitive_columns();

-- ---------------------------------------------------------------------------
-- 2. Lock down referral RPCs — only service_role may execute
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'process_referral'
  ) then
    revoke execute on function public.process_referral(text, uuid) from public, anon, authenticated;
    grant execute on function public.process_referral(text, uuid) to service_role;
  end if;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'ensure_referral_code'
  ) then
    revoke execute on function public.ensure_referral_code(uuid) from public, anon, authenticated;
    grant execute on function public.ensure_referral_code(uuid) to service_role;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Referrals: remove open INSERT policy for authenticated/anon
--    Inserts only via service_role or SECURITY DEFINER process_referral
-- ---------------------------------------------------------------------------
drop policy if exists "referrals_insert_all" on public.referrals;
