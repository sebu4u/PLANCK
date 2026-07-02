-- Multi-role user system: elev, parinte, profesor
-- Additive-only migration (no DROP / no CREATE OR REPLACE)

alter table if exists public.profiles
  add column if not exists user_type text not null default 'elev'
    check (user_type in ('elev', 'parinte', 'profesor'));

alter table if exists public.profiles
  add column if not exists parent_invite_code text unique;

alter table if exists public.profiles
  add column if not exists teaching_materie text
    check (
      teaching_materie is null
      or teaching_materie in ('matematica', 'fizica', 'informatica', 'biologie')
    );

create index if not exists idx_profiles_user_type
  on public.profiles (user_type);

create index if not exists idx_profiles_parent_invite_code
  on public.profiles (parent_invite_code)
  where parent_invite_code is not null;

create table if not exists public.parent_child_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  accepted_at timestamptz,
  unique (parent_id, child_id),
  check (parent_id <> child_id)
);

create index if not exists idx_parent_child_relationships_parent_id
  on public.parent_child_relationships (parent_id);

create index if not exists idx_parent_child_relationships_child_id
  on public.parent_child_relationships (child_id);

alter table if exists public.parent_child_relationships enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_child_relationships'
      and policyname = 'parent_child_relationships_select_participant'
  ) then
    create policy "parent_child_relationships_select_participant"
      on public.parent_child_relationships
      for select
      to authenticated
      using (parent_id = auth.uid() or child_id = auth.uid());
  end if;
end $$;

grant select on table public.parent_child_relationships to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'generate_parent_invite_code'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function public.generate_parent_invite_code()
    returns text
    language plpgsql
    as $function$
    declare
      candidate text;
      exists_already boolean;
    begin
      loop
        candidate := upper(
          substr(
            encode(gen_random_bytes(6), 'hex'),
            1,
            8
          )
        );
        select exists(
          select 1 from public.profiles where parent_invite_code = candidate
        ) into exists_already;
        exit when not exists_already;
      end loop;
      return candidate;
    end;
    $function$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_parent_of'
      and pg_get_function_identity_arguments(p.oid) = 'target_child uuid, target_parent uuid'
  ) then
    create function public.is_parent_of(target_child uuid, target_parent uuid default auth.uid())
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $function$
      select exists (
        select 1
        from public.parent_child_relationships pcr
        where pcr.parent_id = target_parent
          and pcr.child_id = target_child
          and pcr.status = 'active'
      );
    $function$;
  end if;
end $$;

grant execute on function public.is_parent_of(uuid, uuid) to authenticated;
