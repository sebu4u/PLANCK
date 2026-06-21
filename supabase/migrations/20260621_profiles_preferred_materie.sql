-- Materia aleasă la onboarding (Matematică, Fizică, Informatică, Biologie).

alter table public.profiles
  add column if not exists preferred_materie text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_materie_allowed'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_preferred_materie_allowed
      check (
        preferred_materie is null
        or preferred_materie in ('matematica', 'fizica', 'informatica', 'biologie')
      );
  end if;
end $$;

comment on column public.profiles.preferred_materie is
  'Materia aleasă de utilizator la onboarding.';
