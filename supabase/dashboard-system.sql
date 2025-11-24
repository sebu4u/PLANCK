-- ============================================
-- PLANCK DASHBOARD SYSTEM
-- Complete database schema for dashboard features
-- ============================================

-- ============================================
-- TABLE: user_stats
-- Stores user ELO, rank, streak, and statistics
-- ============================================
create table if not exists public.user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  elo integer default 500 not null,
  rank text default 'Bronze I' not null,
  current_streak integer default 0 not null,
  best_streak integer default 0 not null,
  total_time_minutes integer default 0 not null,
  problems_solved_today integer default 0 not null,
  problems_solved_total integer default 0 not null,
  last_activity_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- TABLE: daily_challenges
-- Stores available daily challenges
-- ============================================
create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  problem_id text references public.problems(id) on delete set null,
  -- We păstrăm difficulty în engleză pentru compatibilitate cu UI, dar o derivăm din problems.difficulty
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  bonus_elo integer default 10 not null,
  active_date date not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE: user_challenges
-- Tracks user participation in daily challenges
-- ============================================
create table if not exists public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  challenge_id uuid references public.daily_challenges(id) on delete cascade not null,
  completed boolean default false not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, challenge_id)
);

-- ============================================
-- TABLE: learning_roadmap
-- Personalized learning paths with steps
-- ============================================
create table if not exists public.learning_roadmap (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  step_number integer not null,
  title text not null,
  description text not null,
  category text not null,
  total_items integer default 0 not null,
  is_locked boolean default false not null,
  created_at timestamp with time zone default now(),
  unique(user_id, step_number)
);

-- ============================================
-- TABLE: user_roadmap_progress
-- Tracks completed steps per user
-- ============================================
create table if not exists public.user_roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  roadmap_id uuid references public.learning_roadmap(id) on delete cascade not null,
  completed_items integer default 0 not null,
  is_completed boolean default false not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, roadmap_id)
);

-- ============================================
-- TABLE: recommendations
-- AI-generated personalized recommendations
-- ============================================
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('lesson', 'problem', 'course', 'topic')),
  title text not null,
  description text not null,
  target_url text not null,
  reason text,
  priority integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TABLE: daily_activity
-- 365-day activity heatmap data
-- ============================================
create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_date date not null,
  problems_solved integer default 0 not null,
  time_minutes integer default 0 not null,
  activity_level integer default 0 not null check (activity_level between 0 and 4),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, activity_date)
);

-- ============================================
-- TABLE: user_tasks
-- Daily tasks checklist
-- ============================================
create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_date date not null,
  task_type text not null check (task_type in ('solve_problem', 'learn_minutes', 'open_sketch', 'custom')),
  task_description text not null,
  is_completed boolean default false not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, task_date, task_type)
);

-- ============================================
-- TABLE: dashboard_updates
-- System updates and notifications
-- ============================================
create table if not exists public.dashboard_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('challenge', 'lesson', 'leaderboard', 'achievement', 'system')),
  is_global boolean default true not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_user_stats_user_id on public.user_stats(user_id);
create index if not exists idx_daily_challenges_active_date on public.daily_challenges(active_date);
create index if not exists idx_user_challenges_user_id on public.user_challenges(user_id);
create index if not exists idx_learning_roadmap_user_id on public.learning_roadmap(user_id);
create index if not exists idx_recommendations_user_id on public.recommendations(user_id, is_active);
create index if not exists idx_daily_activity_user_date on public.daily_activity(user_id, activity_date);
create index if not exists idx_user_tasks_user_date on public.user_tasks(user_id, task_date);

-- ============================================
-- RLS POLICIES
-- ============================================

-- user_stats policies
alter table public.user_stats enable row level security;

drop policy if exists "user_stats_select_own" on public.user_stats;
create policy "user_stats_select_own"
  on public.user_stats for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_stats_insert_own" on public.user_stats;
create policy "user_stats_insert_own"
  on public.user_stats for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_stats_update_own" on public.user_stats;
create policy "user_stats_update_own"
  on public.user_stats for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_challenges policies
alter table public.daily_challenges enable row level security;

drop policy if exists "daily_challenges_select_all" on public.daily_challenges;
create policy "daily_challenges_select_all"
  on public.daily_challenges for select
  to authenticated
  using (true);

-- user_challenges policies
alter table public.user_challenges enable row level security;

drop policy if exists "user_challenges_select_own" on public.user_challenges;
create policy "user_challenges_select_own"
  on public.user_challenges for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_challenges_insert_own" on public.user_challenges;
create policy "user_challenges_insert_own"
  on public.user_challenges for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_challenges_update_own" on public.user_challenges;
create policy "user_challenges_update_own"
  on public.user_challenges for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- learning_roadmap policies
alter table public.learning_roadmap enable row level security;

drop policy if exists "learning_roadmap_select_own" on public.learning_roadmap;
create policy "learning_roadmap_select_own"
  on public.learning_roadmap for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "learning_roadmap_insert_own" on public.learning_roadmap;
create policy "learning_roadmap_insert_own"
  on public.learning_roadmap for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "learning_roadmap_update_own" on public.learning_roadmap;
create policy "learning_roadmap_update_own"
  on public.learning_roadmap for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_roadmap_progress policies
alter table public.user_roadmap_progress enable row level security;

drop policy if exists "user_roadmap_progress_select_own" on public.user_roadmap_progress;
create policy "user_roadmap_progress_select_own"
  on public.user_roadmap_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_roadmap_progress_insert_own" on public.user_roadmap_progress;
create policy "user_roadmap_progress_insert_own"
  on public.user_roadmap_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_roadmap_progress_update_own" on public.user_roadmap_progress;
create policy "user_roadmap_progress_update_own"
  on public.user_roadmap_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recommendations policies
alter table public.recommendations enable row level security;

drop policy if exists "recommendations_select_own" on public.recommendations;
create policy "recommendations_select_own"
  on public.recommendations for select
  to authenticated
  using (auth.uid() = user_id);

-- daily_activity policies
alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity_select_own" on public.daily_activity;
create policy "daily_activity_select_own"
  on public.daily_activity for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "daily_activity_insert_own" on public.daily_activity;
create policy "daily_activity_insert_own"
  on public.daily_activity for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "daily_activity_update_own" on public.daily_activity;
create policy "daily_activity_update_own"
  on public.daily_activity for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_tasks policies
alter table public.user_tasks enable row level security;

drop policy if exists "user_tasks_select_own" on public.user_tasks;
create policy "user_tasks_select_own"
  on public.user_tasks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_tasks_insert_own" on public.user_tasks;
create policy "user_tasks_insert_own"
  on public.user_tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_tasks_update_own" on public.user_tasks;
create policy "user_tasks_update_own"
  on public.user_tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- dashboard_updates policies
alter table public.dashboard_updates enable row level security;

drop policy if exists "dashboard_updates_select_all" on public.dashboard_updates;
create policy "dashboard_updates_select_all"
  on public.dashboard_updates for select
  to authenticated
  using (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check and reset streak if needed (called when viewing dashboard)
-- This resets streak to 0 if user skipped a day, and updates best_streak
-- NOTE: This only checks last_activity_date, not daily_activity, to avoid race conditions
create or replace function public.check_and_reset_streak_if_needed(user_uuid uuid)
returns void as $$
declare
  last_activity date;
  today date := current_date;
  current_streak_count integer;
begin
  -- Get last activity date and current streak
  select last_activity_date, current_streak into last_activity, current_streak_count
  from public.user_stats
  where user_id = user_uuid;

  -- If no activity yet, do nothing (will be initialized when solving first problem)
  if last_activity is null then
    return;
  end if;

  -- If activity is today, do nothing (user has activity today)
  if last_activity = today then
    return;
  end if;

  -- If last activity was before today (including yesterday), reset streak to 0 and update best_streak
  -- This covers both cases: yesterday (last_activity = today - 1 day) and older (last_activity < today - 1 day)
  if last_activity < today then
    update public.user_stats
    set current_streak = 0,
        best_streak = greatest(best_streak, current_streak_count)
    where user_id = user_uuid;
  end if;
end;
$$ language plpgsql security definer;

-- Function to update user streak (called when solving a problem)
-- NOTE: This function is called AFTER last_activity_date is updated to today in award_elo_for_problem
-- We use old_last_activity_date (saved before update) to determine if we should increment or reset streak
create or replace function public.update_user_streak(user_uuid uuid, old_last_activity_date date default null)
returns void as $$
declare
  last_activity date;
  today date := current_date;
  current_streak_count integer;
  has_activity_yesterday boolean;
  old_activity date;
begin
  -- Get current values
  select last_activity_date, current_streak into last_activity, current_streak_count
  from public.user_stats
  where user_id = user_uuid;

  -- If no activity yet, initialize
  if last_activity is null then
    update public.user_stats
    set current_streak = 1,
        best_streak = greatest(best_streak, 1),
        last_activity_date = today
    where user_id = user_uuid;
    return;
  end if;

  -- Determine old last_activity_date
  -- If provided as parameter, use it; otherwise try to infer from daily_activity
  if old_last_activity_date is not null then
    old_activity := old_last_activity_date;
  else
    -- Try to get from daily_activity (check yesterday)
    select activity_date into old_activity
    from public.daily_activity
    where user_id = user_uuid
      and activity_date = today - interval '1 day'
      and problems_solved > 0
    limit 1;
    
    -- If not found, assume gap (will reset to 1)
    if old_activity is null then
      old_activity := today - interval '2 days'; -- Force gap > 1 day
    end if;
  end if;

  -- If activity is today (shouldn't happen as we just updated it, but check anyway)
  if old_activity = today then
    return;
  end if;

  -- If activity was yesterday, increment streak
  if old_activity = today - interval '1 day' then
    update public.user_stats
    set current_streak = current_streak + 1,
        best_streak = greatest(best_streak, current_streak + 1)
    where user_id = user_uuid;
  -- If gap is more than 1 day OR current_streak is 0 (was reset), set to 1
  else
    -- Update best_streak before resetting (use current_streak_count which might be 0 if reset)
    update public.user_stats
    set best_streak = greatest(best_streak, current_streak_count),
        current_streak = 1
    where user_id = user_uuid;
  end if;
end;
$$ language plpgsql security definer;

-- Function to calculate rank from ELO
-- 19 tiers total: Bronze (III, II, I), Silver (III, II, I), Gold (III, II, I), 
-- Platinum (III, II, I), Diamond (III, II, I), Masters (III, II, I), Ascendant, Singularity
-- Distribution progresivă: mai ușor în Bronze/Silver/Gold, din ce în ce mai greu
-- Bronze: 500-1500 (333 ELO per tier - ușor)
-- Silver: 1500-3000 (500 ELO per tier - ușor)
-- Gold: 3000-5000 (667 ELO per tier - mediu)
-- Platinum: 5000-7500 (833 ELO per tier - mediu)
-- Diamond: 7500-11000 (1167 ELO per tier - greu)
-- Masters: 11000-15000 (1333 ELO per tier - foarte greu)
-- Ascendant: 15000-16500 (1500 ELO - extrem)
-- Singularity: 16500+ (foarte extrem)
create or replace function public.get_rank_from_elo(elo_value integer)
returns text as $$
begin
  if elo_value < 833 then return 'Bronze III';
  elsif elo_value < 1166 then return 'Bronze II';
  elsif elo_value < 1500 then return 'Bronze I';
  elsif elo_value < 2000 then return 'Silver III';
  elsif elo_value < 2500 then return 'Silver II';
  elsif elo_value < 3000 then return 'Silver I';
  elsif elo_value < 3667 then return 'Gold III';
  elsif elo_value < 4334 then return 'Gold II';
  elsif elo_value < 5000 then return 'Gold I';
  elsif elo_value < 5833 then return 'Platinum III';
  elsif elo_value < 6666 then return 'Platinum II';
  elsif elo_value < 7500 then return 'Platinum I';
  elsif elo_value < 8667 then return 'Diamond III';
  elsif elo_value < 9834 then return 'Diamond II';
  elsif elo_value < 11000 then return 'Diamond I';
  elsif elo_value < 12333 then return 'Masters III';
  elsif elo_value < 13666 then return 'Masters II';
  elsif elo_value < 15000 then return 'Masters I';
  elsif elo_value < 16500 then return 'Ascendant';
  else return 'Singularity';
  end if;
end;
$$ language plpgsql immutable;

-- Function to ensure there is a daily challenge for today.
-- Picks a random problem from catalog and creates a single shared challenge for all users.
create or replace function public.ensure_daily_challenge_for_today()
returns void as $$
declare
  today_date date := current_date;
  existing_id uuid;
begin
  -- If today's challenge already exists, do nothing
  select id into existing_id
  from public.daily_challenges
  where active_date = today_date
  limit 1;

  if existing_id is not null then
    return;
  end if;

  -- Insert a new random problem as today's challenge
  insert into public.daily_challenges (title, description, problem_id, difficulty, bonus_elo, active_date, expires_at)
  select
    'Daily Challenge - ' || p.id as title,
    left(coalesce(p.statement, p.description, p.title), 200) as description,
    p.id::text as problem_id,
    case p.difficulty
      when 'Ușor' then 'Easy'
      when 'Mediu' then 'Medium'
      when 'Avansat' then 'Hard'
      else 'Medium'
    end as difficulty,
    10 as bonus_elo,
    today_date as active_date,
    (today_date + interval '1 day') as expires_at
  from public.problems p
  order by random()
  limit 1;
end;
$$ language plpgsql security definer;

create or replace function public.award_elo_for_problem(user_uuid uuid, problem_id_param text)
returns void as $$
declare
  problem_difficulty text;
  elo_to_award integer;
  today_date date := current_date;
  current_problems_solved integer;
  new_activity_level integer;
  challenge_id uuid;
  challenge_bonus integer;
  challenge_completed boolean;
  old_last_activity_date date;
begin
  -- Get problem difficulty (handle both text and uuid types)
  -- Try direct match first, then try casting
  begin
    select difficulty into problem_difficulty
    from public.problems
    where id::text = problem_id_param
    limit 1;
    
    -- If not found, try uuid cast
    if problem_difficulty is null then
      select difficulty into problem_difficulty
      from public.problems
      where id = problem_id_param::uuid
      limit 1;
    end if;
  exception
    when others then
      -- If uuid cast fails, try text match only
      select difficulty into problem_difficulty
      from public.problems
      where id::text = problem_id_param
      limit 1;
  end;
  
  -- If problem difficulty not found, log and return
  if problem_difficulty is null then
    raise notice 'EROARE: Problem difficulty not found for problem_id: %', problem_id_param;
    return;
  end if;
  
  raise notice 'Problemă găsită: % cu dificultate: %', problem_id_param, problem_difficulty;
  
  -- Map difficulty to ELO (match EXACT cu valorile din problems)
  case problem_difficulty
    when 'Ușor' then elo_to_award := 15;
    when 'Mediu' then elo_to_award := 21;
    when 'Avansat' then elo_to_award := 30;
    -- Fallback pentru alte variante posibile
    when 'Easy' then elo_to_award := 15;
    when 'Medium' then elo_to_award := 21;
    when 'Hard' then elo_to_award := 30;
    when 'Difficult' then elo_to_award := 30;
    else 
      raise notice 'ATENȚIE: Dificultate necunoscută "%". Folosim default 15 ELO.', problem_difficulty;
      elo_to_award := 15;
  end case;
  
  raise notice 'ELO de acordat: %', elo_to_award;
  
  -- Initialize user_stats if not exists
  insert into public.user_stats (user_id, elo, rank)
  values (user_uuid, 500, 'Bronze III')
  on conflict (user_id) do nothing;
  
  -- Save old last_activity_date before updating (needed for streak calculation)
  select last_activity_date into old_last_activity_date
  from public.user_stats
  where user_id = user_uuid;
  
  -- Update user_stats: increment ELO, problems solved
  -- IMPORTANT: Reset problems_solved_today to 0 if last_activity_date is different from today
  -- Then increment it to 1 (so it becomes 1, not 0+1 from previous day)
  -- NOTE: We update last_activity_date here, but update_user_streak will use old_last_activity_date
  update public.user_stats
  set elo = elo + elo_to_award,
      problems_solved_today = case 
        when old_last_activity_date is distinct from today_date then 1
        else problems_solved_today + 1
      end,
      problems_solved_total = problems_solved_total + 1,
      last_activity_date = today_date,
      updated_at = now()
  where user_id = user_uuid;

  -- Daily challenge bonus: +bonus_elo only once per user per challenge
  begin
    -- Find today's challenge that matches this problem
    select id, bonus_elo
      into challenge_id, challenge_bonus
    from public.daily_challenges
    where active_date = today_date
      and problem_id::text = problem_id_param
    limit 1;

    if challenge_id is not null then
      -- Check if user already marked this challenge as completed
      select completed
        into challenge_completed
      from public.user_challenges
      where user_id = user_uuid
        and challenge_id = challenge_id
      limit 1;

      if challenge_completed is distinct from true then
        -- Mark challenge as completed for this user
        insert into public.user_challenges (user_id, challenge_id, completed, completed_at)
        values (user_uuid, challenge_id, true, now())
        on conflict (user_id, challenge_id) do update
          set completed = true,
              completed_at = now();

        -- Award bonus ELO
        update public.user_stats
        set elo = elo + coalesce(challenge_bonus, 10),
            updated_at = now()
        where user_id = user_uuid;
      end if;
    end if;
  exception
    when others then
      raise notice 'EROARE non-critică în daily challenge bonus: %', SQLERRM;
  end;

  -- Non-critical: daily_activity, streak, badges.
  -- Orice eroare aici NU trebuie să anuleze update-ul de ELO de mai sus.
  begin
    -- Update or insert daily_activity
    insert into public.daily_activity (user_id, activity_date, problems_solved, time_minutes, activity_level)
    values (user_uuid, today_date, 1, 0, 1)
    on conflict (user_id, activity_date) do update
    set problems_solved = daily_activity.problems_solved + 1,
        updated_at = now();
    
    -- Calculate activity_level based on updated problems_solved (0-4 scale)
    select problems_solved into current_problems_solved
    from public.daily_activity
    where user_id = user_uuid and activity_date = today_date;
    
    if current_problems_solved >= 5 then
      new_activity_level := 4;
    elsif current_problems_solved >= 3 then
      new_activity_level := 3;
    elsif current_problems_solved >= 2 then
      new_activity_level := 2;
    elsif current_problems_solved >= 1 then
      new_activity_level := 1;
    else
      new_activity_level := 0;
    end if;
    
    -- Update activity_level
    update public.daily_activity
    set activity_level = new_activity_level
    where user_id = user_uuid and activity_date = today_date;
    
    -- Update streak (pass old_last_activity_date so function knows if we should increment or reset)
    perform public.update_user_streak(user_uuid, old_last_activity_date);
    
    -- Check and award badges (already exists)
    perform public.check_and_award_badges(user_uuid);
  exception
    when others then
      raise notice 'EROARE non-critică în daily_activity/streak/badges: %', SQLERRM;
  end;
end;
$$ language plpgsql security definer;

-- Trigger to update rank when ELO changes
create or replace function public.update_rank_on_elo_change()
returns trigger as $$
begin
  new.rank := public.get_rank_from_elo(new.elo);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_rank on public.user_stats;
create trigger trigger_update_rank
  before update of elo on public.user_stats
  for each row execute function public.update_rank_on_elo_change();

-- ============================================
-- SEED DATA (for testing)
-- ============================================

-- Ensure there is at least one daily challenge for today (random problem)
select public.ensure_daily_challenge_for_today();

-- Insert global dashboard updates
insert into public.dashboard_updates (title, description, type, is_global)
values
  ('New challenge available', 'Rezolvă provocarea zilei pentru +10 ELO', 'challenge', true),
  ('New lesson: Termodinamica 11.1', 'Explorează conceptele fundamentale ale termodinamicii', 'lesson', true),
  ('Leaderboard refreshed', 'Verifică clasamentul actualizat', 'leaderboard', true)
on conflict do nothing;

-- ============================================
-- HELPER FUNCTION: Initialize user dashboard data
-- ============================================
create or replace function public.initialize_user_dashboard(user_uuid uuid)
returns void as $$
begin
  -- Create user_stats if not exists
  insert into public.user_stats (user_id, elo, rank, current_streak, best_streak)
  values (user_uuid, 500, 'Bronze I', 0, 0)
  on conflict (user_id) do nothing;

  -- Create today's tasks
  insert into public.user_tasks (user_id, task_date, task_type, task_description)
  values
    (user_uuid, current_date, 'solve_problem', 'Rezolvă 1 problemă'),
    (user_uuid, current_date, 'learn_minutes', 'Învață 10 minute'),
    (user_uuid, current_date, 'open_sketch', 'Deschide Sketch')
  on conflict (user_id, task_date, task_type) do nothing;

  -- Create default roadmap
  insert into public.learning_roadmap (user_id, step_number, title, description, category, total_items, is_locked)
  values
    (user_uuid, 1, 'Bazele Mecanicii', 'Începe cu conceptele fundamentale', 'Mecanică', 10, false),
    (user_uuid, 2, 'Cinematica', 'Studiază mișcarea corpurilor', 'Mecanică', 15, false),
    (user_uuid, 3, 'Dinamica', 'Înțelege forțele și legile lui Newton', 'Mecanică', 12, true),
    (user_uuid, 4, 'Termodinamica', 'Explorează energia termică', 'Termodinamică', 20, true),
    (user_uuid, 5, 'Electrostatica', 'Descoperă fenomenele electrice', 'Electricitate', 18, true)
  on conflict (user_id, step_number) do nothing;

  -- Create recommendations
  insert into public.recommendations (user_id, type, title, description, target_url, reason, priority)
  values
    (user_uuid, 'lesson', 'Lecția 10.2 – Legea gazelor', 'Continuă cu teoria gazelor perfecte', '/cursuri/fizica/lectia-10-2', 'Bazat pe progresul tău recent', 1),
    (user_uuid, 'problem', 'Problema #154 – Presiunea în lichide', 'Practică calculele de presiune hidrostatică', '/probleme/154', 'Potrivit pentru nivelul tău actual', 2),
    (user_uuid, 'topic', 'Revizuiește Legile lui Newton', 'Consolidează cunoștințele din mecanică', '/cursuri/fizica/newton', 'Ai rezolvat recent probleme similare', 3)
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Trigger to initialize dashboard data for new users
create or replace function public.handle_new_user_dashboard()
returns trigger as $$
begin
  perform public.initialize_user_dashboard(new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_created_dashboard on auth.users;
create trigger on_user_created_dashboard
  after insert on auth.users
  for each row execute procedure public.handle_new_user_dashboard();

