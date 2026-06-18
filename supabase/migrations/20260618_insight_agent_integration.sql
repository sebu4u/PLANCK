-- Insight Agent integration: keeps the Planck Agent inside the existing Insight product.
-- Tables intentionally store structured agent artifacts linked to Insight sessions when available.

create table if not exists public.insight_agent_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  current_goal text,
  subject text,
  grade text,
  exam_target text,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.insight_agent_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  subject text not null,
  weak_topics jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.insight_agent_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  title text not null,
  subject text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insight_agent_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  recommendation_type text not null check (recommendation_type in ('course', 'learning_path', 'problem', 'lesson', 'subscription')),
  target_id text,
  target_url text,
  reason text not null,
  confidence numeric not null default 0,
  status text not null default 'shown' check (status in ('shown', 'clicked', 'dismissed', 'converted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.insight_agent_parent_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  parent_email text,
  report_json jsonb not null,
  delivery_status text not null default 'draft' check (delivery_status in ('draft', 'queued', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.insight_agent_demand_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid,
  subject text,
  topic text,
  intent text,
  difficulty text,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.insight_chat_messages
  add column if not exists agent_artifacts jsonb not null default '[]'::jsonb;

comment on column public.insight_chat_messages.agent_artifacts is
  'Structured Insight Agent artifacts rendered by the chat UI, such as validated Planck resource references.';

create table if not exists public.insight_agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null,
  memory_json jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0,
  source text not null default 'insight_agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, memory_key)
);

create table if not exists public.insight_agent_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  action_name text not null,
  status text not null default 'completed' check (status in ('planned', 'completed', 'failed', 'needs_confirmation')),
  input_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  requires_confirmation boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_insight_agent_states_user_id on public.insight_agent_states(user_id);
create index if not exists idx_insight_agent_diagnoses_user_id_created_at on public.insight_agent_diagnoses(user_id, created_at desc);
create index if not exists idx_insight_agent_plans_user_id_status on public.insight_agent_plans(user_id, status);
create index if not exists idx_insight_agent_recommendations_user_id_status on public.insight_agent_recommendations(user_id, status);
create index if not exists idx_insight_agent_parent_reports_user_id_created_at on public.insight_agent_parent_reports(user_id, created_at desc);
create index if not exists idx_insight_agent_demand_signals_topic_created_at on public.insight_agent_demand_signals(topic, created_at desc);
create index if not exists idx_insight_agent_memory_user_id on public.insight_agent_memory(user_id);
create index if not exists idx_insight_agent_actions_user_id_created_at on public.insight_agent_actions(user_id, created_at desc);
create index if not exists idx_insight_agent_actions_session_id_created_at on public.insight_agent_actions(session_id, created_at desc);

alter table public.insight_agent_states enable row level security;
alter table public.insight_agent_diagnoses enable row level security;
alter table public.insight_agent_plans enable row level security;
alter table public.insight_agent_recommendations enable row level security;
alter table public.insight_agent_parent_reports enable row level security;
alter table public.insight_agent_demand_signals enable row level security;
alter table public.insight_agent_memory enable row level security;
alter table public.insight_agent_actions enable row level security;

drop policy if exists "insight_agent_states_select_own" on public.insight_agent_states;
drop policy if exists "insight_agent_states_insert_own" on public.insight_agent_states;
drop policy if exists "insight_agent_states_update_own" on public.insight_agent_states;
create policy "insight_agent_states_select_own" on public.insight_agent_states for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_states_insert_own" on public.insight_agent_states for insert to authenticated with check (auth.uid() = user_id);
create policy "insight_agent_states_update_own" on public.insight_agent_states for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "insight_agent_diagnoses_select_own" on public.insight_agent_diagnoses;
drop policy if exists "insight_agent_diagnoses_insert_own" on public.insight_agent_diagnoses;
create policy "insight_agent_diagnoses_select_own" on public.insight_agent_diagnoses for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_diagnoses_insert_own" on public.insight_agent_diagnoses for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "insight_agent_plans_select_own" on public.insight_agent_plans;
drop policy if exists "insight_agent_plans_insert_own" on public.insight_agent_plans;
drop policy if exists "insight_agent_plans_update_own" on public.insight_agent_plans;
create policy "insight_agent_plans_select_own" on public.insight_agent_plans for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_plans_insert_own" on public.insight_agent_plans for insert to authenticated with check (auth.uid() = user_id);
create policy "insight_agent_plans_update_own" on public.insight_agent_plans for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "insight_agent_recommendations_select_own" on public.insight_agent_recommendations;
drop policy if exists "insight_agent_recommendations_insert_own" on public.insight_agent_recommendations;
drop policy if exists "insight_agent_recommendations_update_own" on public.insight_agent_recommendations;
create policy "insight_agent_recommendations_select_own" on public.insight_agent_recommendations for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_recommendations_insert_own" on public.insight_agent_recommendations for insert to authenticated with check (auth.uid() = user_id);
create policy "insight_agent_recommendations_update_own" on public.insight_agent_recommendations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "insight_agent_parent_reports_select_own" on public.insight_agent_parent_reports;
drop policy if exists "insight_agent_parent_reports_insert_own" on public.insight_agent_parent_reports;
drop policy if exists "insight_agent_parent_reports_update_own" on public.insight_agent_parent_reports;
create policy "insight_agent_parent_reports_select_own" on public.insight_agent_parent_reports for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_parent_reports_insert_own" on public.insight_agent_parent_reports for insert to authenticated with check (auth.uid() = user_id);
create policy "insight_agent_parent_reports_update_own" on public.insight_agent_parent_reports for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "insight_agent_demand_signals_select_own" on public.insight_agent_demand_signals;
drop policy if exists "insight_agent_demand_signals_insert_own" on public.insight_agent_demand_signals;
create policy "insight_agent_demand_signals_select_own" on public.insight_agent_demand_signals for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_demand_signals_insert_own" on public.insight_agent_demand_signals for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "insight_agent_memory_select_own" on public.insight_agent_memory;
drop policy if exists "insight_agent_memory_insert_own" on public.insight_agent_memory;
drop policy if exists "insight_agent_memory_update_own" on public.insight_agent_memory;
create policy "insight_agent_memory_select_own" on public.insight_agent_memory for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_memory_insert_own" on public.insight_agent_memory for insert to authenticated with check (auth.uid() = user_id);
create policy "insight_agent_memory_update_own" on public.insight_agent_memory for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "insight_agent_actions_select_own" on public.insight_agent_actions;
drop policy if exists "insight_agent_actions_insert_own" on public.insight_agent_actions;
create policy "insight_agent_actions_select_own" on public.insight_agent_actions for select to authenticated using (auth.uid() = user_id);
create policy "insight_agent_actions_insert_own" on public.insight_agent_actions for insert to authenticated with check (auth.uid() = user_id);

grant select, insert, update on public.insight_agent_states to authenticated;
grant select, insert on public.insight_agent_diagnoses to authenticated;
grant select, insert, update on public.insight_agent_plans to authenticated;
grant select, insert, update on public.insight_agent_recommendations to authenticated;
grant select, insert, update on public.insight_agent_parent_reports to authenticated;
grant select, insert on public.insight_agent_demand_signals to authenticated;
grant select, insert, update on public.insight_agent_memory to authenticated;
grant select, insert on public.insight_agent_actions to authenticated;
