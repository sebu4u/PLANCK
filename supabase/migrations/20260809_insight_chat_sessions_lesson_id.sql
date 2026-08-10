-- Scope Insight chat sessions to text-course lessons (mirror problem_id).
alter table if exists public.insight_chat_sessions
  add column if not exists lesson_id text;

create index if not exists idx_insight_chat_sessions_user_lesson_last_message
  on public.insight_chat_sessions (user_id, lesson_id, last_message_at desc nulls last);
