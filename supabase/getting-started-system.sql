-- ============================================
-- GETTING STARTED SYSTEM
-- Tracks user progress through onboarding tasks
-- ============================================

-- Create getting_started_progress table
create table if not exists public.getting_started_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  problems_solved_count integer default 0 not null,
  board_created boolean default false not null,
  code_generated boolean default false not null,
  completed boolean default false not null,
  elo_awarded boolean default false not null,
  dismissed boolean default false not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_getting_started_progress_user_id 
  on public.getting_started_progress(user_id);

-- Enable RLS
alter table if exists public.getting_started_progress enable row level security;

-- RLS Policies
drop policy if exists "getting_started_select_own" on public.getting_started_progress;
create policy "getting_started_select_own"
  on public.getting_started_progress for select
  using (auth.uid() = user_id);

drop policy if exists "getting_started_insert_own" on public.getting_started_progress;
create policy "getting_started_insert_own"
  on public.getting_started_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "getting_started_update_own" on public.getting_started_progress;
create policy "getting_started_update_own"
  on public.getting_started_progress for update
  using (auth.uid() = user_id);

-- Function to initialize getting started progress for new users
create or replace function public.initialize_getting_started_progress()
returns trigger as $$
begin
  insert into public.getting_started_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create getting started progress for new users
drop trigger if exists on_user_created_getting_started on auth.users;
create trigger on_user_created_getting_started
  after insert on auth.users
  for each row
  execute function public.initialize_getting_started_progress();

-- Function to update problems solved count
create or replace function public.update_getting_started_problems()
returns trigger as $$
declare
  solved_count integer;
  progress_record record;
begin
  -- Count solved problems for this user
  select count(*) into solved_count
  from public.solved_problems
  where user_id = new.user_id;
  
  -- Get or create progress record
  select * into progress_record
  from public.getting_started_progress
  where user_id = new.user_id;
  
  if not found then
    insert into public.getting_started_progress (user_id, problems_solved_count)
    values (new.user_id, solved_count)
    on conflict (user_id) do update
      set problems_solved_count = solved_count,
          updated_at = now();
  else
    update public.getting_started_progress
    set problems_solved_count = solved_count,
        updated_at = now()
    where user_id = new.user_id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update problems solved count when a problem is marked as solved
drop trigger if exists on_problem_solved_getting_started on public.solved_problems;
create trigger on_problem_solved_getting_started
  after insert on public.solved_problems
  for each row
  execute function public.update_getting_started_problems();

-- Function to update board created status
create or replace function public.update_getting_started_board()
returns trigger as $$
begin
  update public.getting_started_progress
  set board_created = true,
      updated_at = now()
  where user_id = new.user_id
    and board_created = false;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update board created when a board is created
drop trigger if exists on_board_created_getting_started on public.sketch_boards;
create trigger on_board_created_getting_started
  after insert on public.sketch_boards
  for each row
  execute function public.update_getting_started_board();

-- Enable Realtime for getting_started_progress table
-- Add table to Realtime publication if not already added
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'getting_started_progress'
  ) then
    alter publication supabase_realtime add table public.getting_started_progress;
    raise notice 'Added getting_started_progress to realtime publication';
  else
    raise notice 'getting_started_progress already in realtime publication';
  end if;
end $$;
