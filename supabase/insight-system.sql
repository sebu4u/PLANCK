-- =============================================
-- Insight AI System: Tables, RLS, and RPC
-- =============================================

-- 1. Table for daily usage tracking
create table if not exists public.insight_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (current_date at time zone 'utc'),
  prompts_count integer not null default 0,
  primary key (user_id, usage_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_insight_usage_user_date 
  on public.insight_usage(user_id, usage_date);

-- 2. Table for logging API calls (latency, tokens, cost)
create table if not exists public.insight_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  latency_ms integer not null,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  cost_usd numeric(12,6),
  created_at timestamptz not null default now()
);

create index if not exists idx_insight_logs_user_created 
  on public.insight_logs(user_id, created_at);

create index if not exists idx_insight_logs_created 
  on public.insight_logs(created_at);

-- 3. Enable Row Level Security
alter table if exists public.insight_usage enable row level security;
alter table if exists public.insight_logs enable row level security;

-- 4. RLS Policies for insight_usage

-- Users can only see their own usage
drop policy if exists "insight_usage_select_own" on public.insight_usage;
create policy "insight_usage_select_own"
  on public.insight_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert their own usage
drop policy if exists "insight_usage_insert_own" on public.insight_usage;
create policy "insight_usage_insert_own"
  on public.insight_usage for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Users can update their own usage
drop policy if exists "insight_usage_update_own" on public.insight_usage;
create policy "insight_usage_update_own"
  on public.insight_usage for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. RLS Policies for insight_logs

-- Users can only see their own logs
drop policy if exists "insight_logs_select_own" on public.insight_logs;
create policy "insight_logs_select_own"
  on public.insight_logs for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert their own logs
drop policy if exists "insight_logs_insert_own" on public.insight_logs;
create policy "insight_logs_insert_own"
  on public.insight_logs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- 6. Trigger for updated_at on insight_usage
create or replace function public.set_updated_at_insight_usage()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_updated_at_insight_usage on public.insight_usage;
create trigger trg_updated_at_insight_usage
before update on public.insight_usage
for each row execute function public.set_updated_at_insight_usage();

-- 7. RPC Function: Atomic check and increment daily limit
-- This function:
-- - Verifies the caller is the same as the user_id (security)
-- - Uses upsert to create row if it doesn't exist for today
-- - Locks the row for update (prevents race conditions)
-- - Checks if limit is reached
-- - If allowed, increments and returns true, otherwise returns false
create or replace function public.insight_check_and_increment(
  p_user_id uuid,
  p_daily_limit int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_today date := (current_date at time zone 'utc');
  v_count int;
begin
  -- Security check: ensure caller is the same as the user being checked
  if auth.uid() is null or auth.uid() <> p_user_id then
    return false;
  end if;

  -- Upsert: create row if it doesn't exist for today (with 0 count)
  insert into public.insight_usage as u (user_id, usage_date, prompts_count)
  values (p_user_id, v_today, 0)
  on conflict (user_id, usage_date)
  do nothing;

  -- Lock the row for today and get current count
  -- FOR UPDATE ensures atomicity when multiple requests happen simultaneously
  select prompts_count into v_count
  from public.insight_usage
  where user_id = p_user_id 
    and usage_date = v_today
  for update;

  -- If somehow row doesn't exist, initialize to 0
  if v_count is null then
    v_count := 0;
  end if;

  -- Check if limit reached
  if v_count >= p_daily_limit then
    return false;
  end if;

  -- Increment count
  update public.insight_usage
  set prompts_count = v_count + 1
  where user_id = p_user_id 
    and usage_date = v_today;

  return true;
end;
$$;

-- Grant execute permission to authenticated users
revoke all on function public.insight_check_and_increment(uuid, int) from public;
grant execute on function public.insight_check_and_increment(uuid, int) to authenticated;

-- =============================================
-- Insight Chat History System: Tables and RLS
-- =============================================

-- 8. Table for chat sessions
create table if not exists public.insight_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

-- 9. Table for chat messages
create table if not exists public.insight_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.insight_chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_insight_chat_sessions_user_id 
  on public.insight_chat_sessions(user_id);
create index if not exists idx_insight_chat_sessions_last_message_at 
  on public.insight_chat_sessions(last_message_at desc nulls last);
create index if not exists idx_insight_chat_sessions_updated_at 
  on public.insight_chat_sessions(updated_at desc);
create index if not exists idx_insight_chat_messages_session_id 
  on public.insight_chat_messages(session_id);
create index if not exists idx_insight_chat_messages_created_at 
  on public.insight_chat_messages(created_at);

-- 10. Enable Row Level Security for chat tables
alter table if exists public.insight_chat_sessions enable row level security;
alter table if exists public.insight_chat_messages enable row level security;

-- 11. RLS Policies for insight_chat_sessions

-- Users can only see their own sessions
drop policy if exists "insight_chat_sessions_select_own" on public.insight_chat_sessions;
create policy "insight_chat_sessions_select_own"
  on public.insight_chat_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert their own sessions
drop policy if exists "insight_chat_sessions_insert_own" on public.insight_chat_sessions;
create policy "insight_chat_sessions_insert_own"
  on public.insight_chat_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Users can update their own sessions
drop policy if exists "insight_chat_sessions_update_own" on public.insight_chat_sessions;
create policy "insight_chat_sessions_update_own"
  on public.insight_chat_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Users can delete their own sessions
drop policy if exists "insight_chat_sessions_delete_own" on public.insight_chat_sessions;
create policy "insight_chat_sessions_delete_own"
  on public.insight_chat_sessions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 12. RLS Policies for insight_chat_messages

-- Users can only see messages in their own sessions
drop policy if exists "insight_chat_messages_select_own" on public.insight_chat_messages;
create policy "insight_chat_messages_select_own"
  on public.insight_chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.insight_chat_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

-- Users can insert messages in their own sessions
drop policy if exists "insight_chat_messages_insert_own" on public.insight_chat_messages;
create policy "insight_chat_messages_insert_own"
  on public.insight_chat_messages for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id and
    exists (
      select 1 from public.insight_chat_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

-- Users can delete messages in their own sessions
drop policy if exists "insight_chat_messages_delete_own" on public.insight_chat_messages;
create policy "insight_chat_messages_delete_own"
  on public.insight_chat_messages for delete
  to authenticated
  using (
    exists (
      select 1 from public.insight_chat_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

-- 13. Trigger function for updating session timestamps
create or replace function public.insight_touch_session()
returns trigger
language plpgsql
as $$
begin
  if TG_TABLE_NAME = 'insight_chat_messages' then
    update public.insight_chat_sessions
    set updated_at = now(),
        last_message_at = now()
    where id = NEW.session_id;
  elsif TG_TABLE_NAME = 'insight_chat_sessions' then
    NEW.updated_at = now();
  end if;
  return NEW;
end;
$$;

-- Trigger for messages: update session last_message_at
drop trigger if exists trg_insight_touch_session_on_message on public.insight_chat_messages;
create trigger trg_insight_touch_session_on_message
after insert on public.insight_chat_messages
for each row execute function public.insight_touch_session();

-- Trigger for sessions: update updated_at
drop trigger if exists trg_insight_touch_session_on_update on public.insight_chat_sessions;
create trigger trg_insight_touch_session_on_update
before update on public.insight_chat_sessions
for each row execute function public.insight_touch_session();

