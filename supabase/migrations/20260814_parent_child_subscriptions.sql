-- Parent-purchased Premium grants for linked children.
-- Payer (parent) owns the Stripe customer; beneficiary (child) receives profiles.plan.
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

create table if not exists public.parent_child_subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  stripe_price_id text,
  stripe_subscription_status text,
  plan text,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (parent_id, child_id),
  unique (stripe_subscription_id),
  check (parent_id <> child_id)
);

create index if not exists idx_parent_child_subscriptions_parent_id
  on public.parent_child_subscriptions (parent_id);

create index if not exists idx_parent_child_subscriptions_child_id
  on public.parent_child_subscriptions (child_id);

create index if not exists idx_parent_child_subscriptions_child_status
  on public.parent_child_subscriptions (child_id, stripe_subscription_status);

create unique index if not exists idx_parent_child_subscriptions_entitled_pair
  on public.parent_child_subscriptions (parent_id, child_id)
  where stripe_subscription_status in (
    'active',
    'trialing',
    'past_due',
    'unpaid',
    'paused',
    'incomplete'
  );

alter table if exists public.parent_child_subscriptions enable row level security;

revoke all on table public.parent_child_subscriptions from anon, authenticated;
grant select on table public.parent_child_subscriptions to authenticated;

drop policy if exists "parent_child_subscriptions_select_participant"
  on public.parent_child_subscriptions;
create policy "parent_child_subscriptions_select_participant"
  on public.parent_child_subscriptions
  for select
  to authenticated
  using (
    parent_id = (select auth.uid())
    or child_id = (select auth.uid())
  );
