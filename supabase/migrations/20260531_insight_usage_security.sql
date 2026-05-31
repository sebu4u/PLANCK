-- Security hardening: prevent client-side tampering with billing/plan fields and AI usage counters.

-- ---------------------------------------------------------------------------
-- 1. Protect sensitive profile columns from authenticated user updates
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

-- ---------------------------------------------------------------------------
-- 2. Usage counters: read-only for authenticated clients; writes via RPC only
-- ---------------------------------------------------------------------------
drop policy if exists "insight_usage_insert_own" on public.insight_usage;
drop policy if exists "insight_usage_update_own" on public.insight_usage;

drop policy if exists "ai_monthly_usage_insert_own" on public.ai_monthly_usage;
drop policy if exists "ai_monthly_usage_update_own" on public.ai_monthly_usage;
