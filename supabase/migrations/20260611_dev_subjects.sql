-- Dev subject permissions.
-- Existing dev users keep their current broad access because dev_subjects stays NULL.

alter table public.profiles
  add column if not exists dev_subjects text[] default null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_dev_subjects_allowed'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_dev_subjects_allowed
      check (
        dev_subjects is null
        or dev_subjects <@ array['matematica', 'fizica', 'informatica', 'biologie', 'ai']::text[]
      );
  end if;
end $$;

create index if not exists idx_profiles_dev_subjects
  on public.profiles using gin (dev_subjects)
  where dev_subjects is not null;

-- Keep dev_subjects server-controlled, mirroring is_dev.
create or replace function public.protect_dev_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_dev := old.is_dev;
    new.dev_subjects := old.dev_subjects;
  end if;
  return new;
end;
$$;

-- Extend the broader sensitive profile guard with dev_subjects.
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
    new.dev_subjects := null;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.stripe_price_id := null;
    new.stripe_subscription_status := null;
    new.stripe_current_period_end := null;
    return new;
  end if;

  new.plan := old.plan;
  new.plus_months_remaining := old.plus_months_remaining;
  new.referred_by := old.referred_by;
  new.referral_code := old.referral_code;
  new.is_admin := old.is_admin;
  new.is_dev := old.is_dev;
  new.dev_subjects := old.dev_subjects;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.stripe_price_id := old.stripe_price_id;
  new.stripe_subscription_status := old.stripe_subscription_status;
  new.stripe_current_period_end := old.stripe_current_period_end;

  return new;
end;
$$;

-- Best-effort AI marker backfill for obvious chapter names.
update public.learning_path_chapters
set problem_category = 'ai'
where coalesce(problem_category, '') <> 'ai'
  and (
    lower(coalesce(slug, '')) in ('ai', 'inteligenta-artificiala', 'inteligenta-artificiala-ai')
    or lower(coalesce(title, '')) in ('ai', 'inteligență artificială', 'inteligenta artificiala')
    or lower(coalesce(nav_title, '')) in ('ai', 'inteligență artificială', 'inteligenta artificiala')
  );
