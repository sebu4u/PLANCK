alter table public.profiles
  add column if not exists onboarding_completed_at timestamp with time zone;

update public.profiles
set onboarding_completed_at = coalesce(created_at, now())
where onboarding_completed_at is null;
