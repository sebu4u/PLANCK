-- Email verification flag for password signups (Google stays verified).
-- Re-run this file in the Supabase SQL editor. Idempotent.
-- Required Auth setting: Authentication → Providers → Email → Confirm email = OFF

alter table if exists public.profiles
  add column if not exists email_verified boolean not null default true;

create table if not exists public.email_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_confirmation_tokens_user_id_created_at_idx
  on public.email_confirmation_tokens (user_id, created_at desc);

alter table if exists public.email_confirmation_tokens enable row level security;

revoke all on public.email_confirmation_tokens from anon, authenticated;
grant all on public.email_confirmation_tokens to service_role;

-- Live profiles has no email column (auth.users.email is the source of truth).
-- Inserting email here caused signup 500: column "email" of relation "profiles" does not exist.
-- Set email_verified in a nested block so a JSON quirk cannot abort auth.users insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_referral_code text;
  collision boolean;
  user_name text;
  user_avatar text;
  is_email_signup boolean;
  providers_json jsonb;
begin
  user_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    ''
  );

  user_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture',
    null
  );

  loop
    new_referral_code := substr(md5(random()::text), 1, 8);
    select exists (
      select 1 from public.profiles where referral_code = new_referral_code
    ) into collision;
    exit when not collision;
  end loop;

  insert into public.profiles (
    user_id,
    name,
    nickname,
    user_icon,
    grade,
    referral_code,
    plan
  )
  values (
    new.id,
    user_name,
    user_name,
    user_avatar,
    coalesce(new.raw_user_meta_data ->> 'grade', null),
    new_referral_code,
    'free'
  )
  on conflict (user_id) do update set
    name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
    user_icon = coalesce(public.profiles.user_icon, excluded.user_icon);

  begin
    providers_json := coalesce(new.raw_app_meta_data->'providers', 'null'::jsonb);
    is_email_signup :=
      coalesce(new.raw_app_meta_data->>'provider', '') = 'email'
      or (
        jsonb_typeof(providers_json) = 'array'
        and coalesce(providers_json->>0, '') = 'email'
      );

    if is_email_signup then
      update public.profiles
      set email_verified = false
      where user_id = new.id;
    end if;
  exception when others then
    null;
  end;

  return new;
exception when others then
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$;
