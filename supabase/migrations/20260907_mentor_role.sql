-- Mentor privilege (like is_admin / is_dev) + 1:1 link to /pregatire CMS teachers.
-- Additive-only (no DROP) so the Supabase SQL editor does not flag destructive ops.

alter table if exists public.profiles
  add column if not exists is_mentor boolean not null default false;

create index if not exists idx_profiles_is_mentor
  on public.profiles (is_mentor)
  where is_mentor = true;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_mentor'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function public.is_mentor()
    returns boolean
    language sql
    security definer
    stable
    as $fn$
      select exists (
        select 1 from public.profiles
        where user_id = auth.uid()
          and is_mentor = true
      );
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'protect_mentor_flag'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function public.protect_mentor_flag()
    returns trigger
    language plpgsql
    security definer
    as $fn$
    begin
      if auth.uid() is not null and not public.is_admin() then
        new.is_mentor := old.is_mentor;
      end if;
      return new;
    end;
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'protect_mentor_flag_trigger'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger protect_mentor_flag_trigger
      before update on public.profiles
      for each row
      execute function public.protect_mentor_flag();
  end if;
end $$;

alter table if exists public.workshop_teachers
  add column if not exists mentor_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists workshop_teachers_mentor_user_id_uidx
  on public.workshop_teachers (mentor_user_id)
  where mentor_user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'mentor_teacher_id'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function public.mentor_teacher_id()
    returns uuid
    language sql
    security definer
    stable
    as $fn$
      select id
      from public.workshop_teachers
      where mentor_user_id = auth.uid()
      limit 1;
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'protect_workshop_teacher_assignment'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function public.protect_workshop_teacher_assignment()
    returns trigger
    language plpgsql
    security definer
    as $fn$
    begin
      if auth.uid() is not null and not public.is_admin() then
        new.mentor_user_id := old.mentor_user_id;
        new.is_active := old.is_active;
        new.id := old.id;
      end if;
      return new;
    end;
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'protect_workshop_teacher_assignment_trigger'
      and tgrelid = 'public.workshop_teachers'::regclass
  ) then
    create trigger protect_workshop_teacher_assignment_trigger
      before update on public.workshop_teachers
      for each row
      execute function public.protect_workshop_teacher_assignment();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workshop_teachers'
      and policyname = 'workshop_teachers_mentor_select_own'
  ) then
    create policy "workshop_teachers_mentor_select_own"
      on public.workshop_teachers
      for select
      to authenticated
      using (mentor_user_id = (select auth.uid()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workshop_teachers'
      and policyname = 'workshop_teachers_mentor_update_own'
  ) then
    create policy "workshop_teachers_mentor_update_own"
      on public.workshop_teachers
      for update
      to authenticated
      using (mentor_user_id = (select auth.uid()))
      with check (mentor_user_id = (select auth.uid()));
  end if;
end $$;

grant select on public.workshop_teachers to anon, authenticated;
grant update (name, description, icon_url, updated_at) on public.workshop_teachers to authenticated;
