-- =============================================
-- AI Monthly Usage System: Tables, RLS, and RPC
-- =============================================
-- This system tracks monthly AI prompt usage for paid plans (plus/premium)
-- Combines usage from both Insight and AI Agent features

-- 1. Table for monthly usage tracking
create table if not exists public.ai_monthly_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_month date not null, -- First day of the month (YYYY-MM-01)
  prompts_count integer not null default 0,
  primary key (user_id, usage_month),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_monthly_usage_user_month 
  on public.ai_monthly_usage(user_id, usage_month);

-- 2. Enable Row Level Security
alter table if exists public.ai_monthly_usage enable row level security;

-- 3. RLS Policies for ai_monthly_usage

-- Users can only see their own usage
drop policy if exists "ai_monthly_usage_select_own" on public.ai_monthly_usage;
create policy "ai_monthly_usage_select_own"
  on public.ai_monthly_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert their own usage
drop policy if exists "ai_monthly_usage_insert_own" on public.ai_monthly_usage;
create policy "ai_monthly_usage_insert_own"
  on public.ai_monthly_usage for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Users can update their own usage
drop policy if exists "ai_monthly_usage_update_own" on public.ai_monthly_usage;
create policy "ai_monthly_usage_update_own"
  on public.ai_monthly_usage for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Trigger for updated_at on ai_monthly_usage
create or replace function public.set_updated_at_ai_monthly_usage()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_updated_at_ai_monthly_usage on public.ai_monthly_usage;
create trigger trg_updated_at_ai_monthly_usage
before update on public.ai_monthly_usage
for each row execute function public.set_updated_at_ai_monthly_usage();

-- 5. RPC Function: Atomic check and increment monthly limit
-- This function:
-- - Verifies the caller is the same as the user_id (security)
-- - Uses upsert to create row if it doesn't exist for current month
-- - Locks the row for update (prevents race conditions)
-- - Checks if limit is reached
-- - If allowed, increments and returns true, otherwise returns false
create or replace function public.ai_check_and_increment_monthly(
  p_user_id uuid,
  p_monthly_limit int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_month date := date_trunc('month', (current_date at time zone 'utc'))::date;
  v_count int;
begin
  -- Security check: ensure caller is the same as the user being checked
  if auth.uid() is null or auth.uid() <> p_user_id then
    return false;
  end if;

  -- Upsert: create row if it doesn't exist for current month (with 0 count)
  insert into public.ai_monthly_usage as u (user_id, usage_month, prompts_count)
  values (p_user_id, v_current_month, 0)
  on conflict (user_id, usage_month)
  do nothing;

  -- Lock the row for current month and get current count
  -- FOR UPDATE ensures atomicity when multiple requests happen simultaneously
  select prompts_count into v_count
  from public.ai_monthly_usage
  where user_id = p_user_id 
    and usage_month = v_current_month
  for update;

  -- If somehow row doesn't exist, initialize to 0
  if v_count is null then
    v_count := 0;
  end if;

  -- Check if limit reached
  if v_count >= p_monthly_limit then
    return false;
  end if;

  -- Increment count
  update public.ai_monthly_usage
  set prompts_count = v_count + 1
  where user_id = p_user_id 
    and usage_month = v_current_month;

  return true;
end;
$$;

-- Grant execute permission to authenticated users
revoke all on function public.ai_check_and_increment_monthly(uuid, int) from public;
grant execute on function public.ai_check_and_increment_monthly(uuid, int) to authenticated;

