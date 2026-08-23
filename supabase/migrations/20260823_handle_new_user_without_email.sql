-- Live profiles has no email column. The previous handle_new_user insert
-- caused POST /auth/v1/signup 500: column "email" of relation "profiles" does not exist.

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
