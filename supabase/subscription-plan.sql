-- Adds subscription plan metadata to user profiles
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'profiles'
      and column_name = 'plan'
  ) then
    alter table public.profiles
      add column plan text not null default 'free';
  end if;
end $$;

-- Ensure existing rows have a normalized value
update public.profiles
set plan = coalesce(nullif(trim(lower(plan)), ''), 'free')
where plan is null or plan = '';

comment on column public.profiles.plan is
  'Subscription tier: free | plus | premium';

