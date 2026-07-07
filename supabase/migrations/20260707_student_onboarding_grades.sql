-- Student onboarding self-reported and target grades

alter table if exists public.profiles
  add column if not exists onboarding_self_grade numeric(3, 1)
    check (
      onboarding_self_grade is null
      or (onboarding_self_grade >= 4 and onboarding_self_grade <= 10)
    );

alter table if exists public.profiles
  add column if not exists onboarding_target_grade numeric(3, 1)
    check (
      onboarding_target_grade is null
      or (onboarding_target_grade >= 4 and onboarding_target_grade <= 10)
    );
