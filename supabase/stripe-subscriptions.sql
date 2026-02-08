-- Stripe subscription tracking fields on profiles
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_current_period_end timestamptz;

comment on column public.profiles.stripe_customer_id is
  'Stripe customer ID for the user';
comment on column public.profiles.stripe_subscription_id is
  'Stripe subscription ID for the user';
comment on column public.profiles.stripe_price_id is
  'Stripe price ID for the current subscription';
comment on column public.profiles.stripe_subscription_status is
  'Stripe subscription status (active, trialing, past_due, canceled, etc.)';
comment on column public.profiles.stripe_current_period_end is
  'End of current Stripe billing period (UTC)';

-- Idempotency table for Stripe webhooks
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  created_at timestamptz not null default now()
);
