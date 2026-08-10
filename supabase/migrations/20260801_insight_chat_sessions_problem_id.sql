-- Add problem_id to insight chat sessions for per-problem history
alter table if exists public.insight_chat_sessions
  add column if not exists problem_id text;

create index if not exists idx_insight_chat_sessions_user_problem_last_message
  on public.insight_chat_sessions (user_id, problem_id, last_message_at desc nulls last);

-- Backfill from legacy title convention used by problem tutor pages
update public.insight_chat_sessions
set problem_id = trim(substr(title, 9))
where problem_id is null
  and title like 'Problem: %'
  and length(trim(substr(title, 9))) > 0;
