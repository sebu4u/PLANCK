-- Anonymous Insight usage (cookie-based identity, server-side via service role only)

create table if not exists public.anonymous_insight_usage (
  anonymous_id uuid not null,
  usage_date date not null default ((current_date at time zone 'utc')),
  prompts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (anonymous_id, usage_date)
);

create index if not exists idx_anonymous_insight_usage_anon_date
  on public.anonymous_insight_usage(anonymous_id, usage_date);

alter table public.anonymous_insight_usage enable row level security;

create table if not exists public.anonymous_ai_monthly_usage (
  anonymous_id uuid not null,
  usage_month date not null,
  prompts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (anonymous_id, usage_month)
);

create index if not exists idx_anonymous_ai_monthly_usage_anon_month
  on public.anonymous_ai_monthly_usage(anonymous_id, usage_month);

alter table public.anonymous_ai_monthly_usage enable row level security;

create or replace function public.set_updated_at_anonymous_insight_usage()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_updated_at_anonymous_insight_usage on public.anonymous_insight_usage;
create trigger trg_updated_at_anonymous_insight_usage
before update on public.anonymous_insight_usage
for each row execute function public.set_updated_at_anonymous_insight_usage();

create or replace function public.set_updated_at_anonymous_ai_monthly_usage()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_updated_at_anonymous_ai_monthly_usage on public.anonymous_ai_monthly_usage;
create trigger trg_updated_at_anonymous_ai_monthly_usage
before update on public.anonymous_ai_monthly_usage
for each row execute function public.set_updated_at_anonymous_ai_monthly_usage();

-- Atomic daily increment for anonymous visitors (callable only with service role from API routes)
create or replace function public.anonymous_insight_check_and_increment(
  p_anonymous_id uuid,
  p_daily_limit int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (current_date at time zone 'utc');
  v_count int;
begin
  insert into public.anonymous_insight_usage as u (anonymous_id, usage_date, prompts_count)
  values (p_anonymous_id, v_today, 0)
  on conflict (anonymous_id, usage_date)
  do nothing;

  select prompts_count into v_count
  from public.anonymous_insight_usage
  where anonymous_id = p_anonymous_id
    and usage_date = v_today
  for update;

  if v_count is null then
    v_count := 0;
  end if;

  if v_count >= p_daily_limit then
    return false;
  end if;

  update public.anonymous_insight_usage
  set prompts_count = v_count + 1
  where anonymous_id = p_anonymous_id
    and usage_date = v_today;

  return true;
end;
$$;

revoke all on function public.anonymous_insight_check_and_increment(uuid, int) from public;
grant execute on function public.anonymous_insight_check_and_increment(uuid, int) to service_role;

-- Atomic monthly increment for anonymous IDE Raptor1 (gpt-4o) bucket
create or replace function public.anonymous_ai_check_and_increment_monthly(
  p_anonymous_id uuid,
  p_monthly_limit int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_month date := date_trunc('month', (current_date at time zone 'utc'))::date;
  v_count int;
begin
  insert into public.anonymous_ai_monthly_usage as u (anonymous_id, usage_month, prompts_count)
  values (p_anonymous_id, v_current_month, 0)
  on conflict (anonymous_id, usage_month)
  do nothing;

  select prompts_count into v_count
  from public.anonymous_ai_monthly_usage
  where anonymous_id = p_anonymous_id
    and usage_month = v_current_month
  for update;

  if v_count is null then
    v_count := 0;
  end if;

  if v_count >= p_monthly_limit then
    return false;
  end if;

  update public.anonymous_ai_monthly_usage
  set prompts_count = v_count + 1
  where anonymous_id = p_anonymous_id
    and usage_month = v_current_month;

  return true;
end;
$$;

revoke all on function public.anonymous_ai_check_and_increment_monthly(uuid, int) from public;
grant execute on function public.anonymous_ai_check_and_increment_monthly(uuid, int) to service_role;

-- insight_logs: allow anonymous attribution
alter table public.insight_logs alter column user_id drop not null;

alter table public.insight_logs add column if not exists anonymous_id uuid;

alter table public.insight_logs drop constraint if exists insight_logs_user_xor_anon;

alter table public.insight_logs
  add constraint insight_logs_user_xor_anon check (
    (user_id is not null and anonymous_id is null)
    or (user_id is null and anonymous_id is not null)
  );
