create table if not exists public.user_engagement_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'progress_feedback',
      'streak_reminder',
      'social_proof',
      'hint',
      'momentum'
    )
  ),
  dedupe_key text,
  shown_at timestamptz not null default now()
);

alter table public.user_engagement_notifications enable row level security;

create policy "Users can view their own engagement notifications"
  on public.user_engagement_notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can log their own engagement notifications"
  on public.user_engagement_notifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create index if not exists user_engagement_notifications_user_shown_idx
  on public.user_engagement_notifications (user_id, shown_at desc);

create index if not exists user_engagement_notifications_user_dedupe_idx
  on public.user_engagement_notifications (user_id, dedupe_key)
  where dedupe_key is not null;

create or replace function public.get_concurrent_active_users()
returns integer
language sql
stable
as $$
  select coalesce(count(distinct user_id), 0)::integer
  from public.daily_activity
  where activity_date = current_date
    and (coalesce(problems_solved, 0) > 0 or coalesce(time_minutes, 0) > 0);
$$;

create or replace function public.get_problem_solvers_today(target_problem_id text)
returns integer
language sql
stable
as $$
  select coalesce(count(distinct user_id), 0)::integer
  from public.solved_problems
  where problem_id::text = target_problem_id
    and solved_at >= date_trunc('day', now())
    and solved_at < date_trunc('day', now()) + interval '1 day';
$$;

grant execute on function public.get_concurrent_active_users() to authenticated;
grant execute on function public.get_problem_solvers_today(text) to authenticated;

