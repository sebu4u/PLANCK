-- Enable Row Level Security
alter table if exists public.profiles enable row level security;
alter table if exists public.problems enable row level security;
alter table if exists public.solved_problems enable row level security;

drop policy if exists "problems_select_public" on public.problems;
create policy "problems_select_public"
  on public.problems for select
  to anon, authenticated
  using (true);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((SELECT auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((SELECT auth.uid()) = user_id)
  with check ((SELECT auth.uid()) = user_id);

-- Solved problems: per-user access
drop policy if exists "solved_select_own" on public.solved_problems;
create policy "solved_select_own"
  on public.solved_problems for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

-- Optional: trigger to auto-create profiles from auth.users metadata
-- Note: create this in your Supabase SQL editor if not already present
-- Will safely upsert a profile when a new user is created
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  nickname text,
  bio text,
  grade text,
  user_icon text,
  is_admin boolean not null default false,
  created_at timestamp with time zone default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, name, nickname, grade)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'name', ''),
          coalesce(new.raw_user_meta_data ->> 'nickname', ''),
          coalesce(new.raw_user_meta_data ->> 'grade', null))
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "solved_insert_own" on public.solved_problems;
create policy "solved_insert_own"
  on public.solved_problems for insert
  to authenticated
  with check ((SELECT auth.uid()) = user_id);

drop policy if exists "solved_update_own" on public.solved_problems;
create policy "solved_update_own"
  on public.solved_problems for update
  to authenticated
  using ((SELECT auth.uid()) = user_id)
  with check ((SELECT auth.uid()) = user_id);

drop policy if exists "solved_delete_own" on public.solved_problems;
create policy "solved_delete_own"
  on public.solved_problems for delete
  to authenticated
  using ((SELECT auth.uid()) = user_id);

-- Realtime Broadcast authorization (does NOT require database replication)
-- Allows anon and authenticated clients to publish/listen to broadcast messages
-- This is required for Supabase Realtime broadcast channels to work
do $$
begin
  -- Enable RLS on realtime.messages if table exists (managed by Supabase)
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'realtime'
      and table_name = 'messages'
  ) then
    execute 'alter table realtime.messages enable row level security';

    -- Select (listen)
    execute 'drop policy if exists "realtime_messages_select_all" on realtime.messages';
    execute 'create policy "realtime_messages_select_all"
      on realtime.messages for select
      to anon, authenticated
      using (true)';

    -- Insert (broadcast)
    execute 'drop policy if exists "realtime_messages_insert_all" on realtime.messages';
    execute 'create policy "realtime_messages_insert_all"
      on realtime.messages for insert
      to anon, authenticated
      with check (true)';
  end if;
end $$;