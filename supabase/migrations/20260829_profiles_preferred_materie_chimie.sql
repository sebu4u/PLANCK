-- Allow chimie as preferred_materie (1leu onboarding picker).
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

alter table public.profiles
  drop constraint if exists profiles_preferred_materie_allowed;

alter table public.profiles
  add constraint profiles_preferred_materie_allowed
  check (
    preferred_materie is null
    or preferred_materie in ('matematica', 'fizica', 'informatica', 'biologie', 'chimie')
  );
