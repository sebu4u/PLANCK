-- Parent onboarding preferences collected during guardian onboarding flow

alter table if exists public.profiles
  add column if not exists onboarding_child_age integer
    check (
      onboarding_child_age is null
      or (onboarding_child_age >= 8 and onboarding_child_age <= 60)
    );

alter table if exists public.profiles
  add column if not exists onboarding_daily_minutes text
    check (
      onboarding_daily_minutes is null
      or onboarding_daily_minutes in ('15', '30', '60')
    );
