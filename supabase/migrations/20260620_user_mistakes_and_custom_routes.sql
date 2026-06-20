-- Store user mistakes and generated custom learning routes.
-- The mistake log is append-only from the application perspective; users own their rows via RLS.

create table if not exists public.user_learning_mistake_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (
    surface in (
      'catalog_problem',
      'learning_path_problem',
      'learning_path_grila',
      'learning_path_test',
      'learning_path_interactive'
    )
  ),
  item_id uuid null references public.learning_path_lesson_items(id) on delete set null,
  lesson_id uuid null references public.learning_path_lessons(id) on delete set null,
  chapter_id uuid null references public.learning_path_chapters(id) on delete set null,
  problem_id text null,
  quiz_question_id text null,
  item_type text null,
  subject text null,
  concept_tags text[] not null default '{}',
  mistake_kind text not null default 'wrong_answer',
  submitted_answer jsonb null,
  correct_answer jsonb null,
  prompt_context jsonb null,
  attempt_number integer not null default 1,
  severity integer not null default 1 check (severity between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_learning_mistake_events_user_created
  on public.user_learning_mistake_events(user_id, created_at desc);
create index if not exists idx_user_learning_mistake_events_user_surface
  on public.user_learning_mistake_events(user_id, surface);
create index if not exists idx_user_learning_mistake_events_user_chapter
  on public.user_learning_mistake_events(user_id, chapter_id);
create index if not exists idx_user_learning_mistake_events_tags
  on public.user_learning_mistake_events using gin(concept_tags);

alter table public.user_learning_mistake_events enable row level security;

drop policy if exists "user_learning_mistake_events_select_own" on public.user_learning_mistake_events;
create policy "user_learning_mistake_events_select_own"
  on public.user_learning_mistake_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_learning_mistake_events_insert_own" on public.user_learning_mistake_events;
create policy "user_learning_mistake_events_insert_own"
  on public.user_learning_mistake_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_learning_mistake_events_update_own" on public.user_learning_mistake_events;
create policy "user_learning_mistake_events_update_own"
  on public.user_learning_mistake_events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_learning_mistake_events_delete_own" on public.user_learning_mistake_events;
create policy "user_learning_mistake_events_delete_own"
  on public.user_learning_mistake_events
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.user_mistake_concept_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null,
  subject text null,
  mistake_count integer not null default 0,
  recent_weight numeric not null default 0,
  last_mistake_at timestamptz not null default now(),
  example_event_ids uuid[] not null default '{}',
  primary key (user_id, concept_key)
);

create index if not exists idx_user_mistake_concept_stats_user_last
  on public.user_mistake_concept_stats(user_id, last_mistake_at desc);
create index if not exists idx_user_mistake_concept_stats_user_weight
  on public.user_mistake_concept_stats(user_id, recent_weight desc);

alter table public.user_mistake_concept_stats enable row level security;

drop policy if exists "user_mistake_concept_stats_select_own" on public.user_mistake_concept_stats;
create policy "user_mistake_concept_stats_select_own"
  on public.user_mistake_concept_stats
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_mistake_concept_stats_insert_own" on public.user_mistake_concept_stats;
create policy "user_mistake_concept_stats_insert_own"
  on public.user_mistake_concept_stats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_mistake_concept_stats_update_own" on public.user_mistake_concept_stats;
create policy "user_mistake_concept_stats_update_own"
  on public.user_mistake_concept_stats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_custom_learning_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null,
  rationale text null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  source text not null default 'mistake_prompt',
  generation_model text null,
  generation_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_custom_learning_routes_user_created
  on public.user_custom_learning_routes(user_id, created_at desc);

alter table public.user_custom_learning_routes enable row level security;

drop policy if exists "user_custom_learning_routes_select_own" on public.user_custom_learning_routes;
create policy "user_custom_learning_routes_select_own"
  on public.user_custom_learning_routes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_custom_learning_routes_insert_own" on public.user_custom_learning_routes;
create policy "user_custom_learning_routes_insert_own"
  on public.user_custom_learning_routes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_custom_learning_routes_update_own" on public.user_custom_learning_routes;
create policy "user_custom_learning_routes_update_own"
  on public.user_custom_learning_routes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_custom_learning_routes_delete_own" on public.user_custom_learning_routes;
create policy "user_custom_learning_routes_delete_own"
  on public.user_custom_learning_routes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.user_custom_learning_route_items (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.user_custom_learning_routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_index integer not null,
  learning_path_item_id uuid null references public.learning_path_lesson_items(id) on delete set null,
  problem_id text null,
  source_type text not null check (source_type in ('learning_path_item', 'catalog_problem', 'generated_review_prompt')),
  title text not null,
  reason text null,
  target_concepts text[] not null default '{}',
  snapshot jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (route_id, order_index)
);

create index if not exists idx_user_custom_learning_route_items_route_order
  on public.user_custom_learning_route_items(route_id, order_index);
create index if not exists idx_user_custom_learning_route_items_user
  on public.user_custom_learning_route_items(user_id);
create index if not exists idx_user_custom_learning_route_items_concepts
  on public.user_custom_learning_route_items using gin(target_concepts);

alter table public.user_custom_learning_route_items enable row level security;

drop policy if exists "user_custom_learning_route_items_select_own" on public.user_custom_learning_route_items;
create policy "user_custom_learning_route_items_select_own"
  on public.user_custom_learning_route_items
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_custom_learning_route_items_insert_own" on public.user_custom_learning_route_items;
create policy "user_custom_learning_route_items_insert_own"
  on public.user_custom_learning_route_items
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_custom_learning_routes r
      where r.id = route_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "user_custom_learning_route_items_update_own" on public.user_custom_learning_route_items;
create policy "user_custom_learning_route_items_update_own"
  on public.user_custom_learning_route_items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_custom_learning_route_items_delete_own" on public.user_custom_learning_route_items;
create policy "user_custom_learning_route_items_delete_own"
  on public.user_custom_learning_route_items
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_user_custom_learning_routes_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_user_custom_learning_routes_updated_at on public.user_custom_learning_routes;
create trigger set_user_custom_learning_routes_updated_at
  before update on public.user_custom_learning_routes
  for each row
  execute function public.set_user_custom_learning_routes_updated_at();

create or replace function public.record_learning_mistake(p_event jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
  v_surface text;
  v_item_id uuid;
  v_lesson_id uuid;
  v_chapter_id uuid;
  v_problem_id text;
  v_quiz_question_id text;
  v_item_type text;
  v_subject text;
  v_concept_tags text[];
  v_mistake_kind text;
  v_attempt_number integer;
  v_severity integer;
  v_tag text;
  v_weight numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_surface := nullif(trim(p_event->>'surface'), '');
  if v_surface is null or v_surface not in (
    'catalog_problem',
    'learning_path_problem',
    'learning_path_grila',
    'learning_path_test',
    'learning_path_interactive'
  ) then
    raise exception 'Invalid mistake surface';
  end if;

  v_item_id := case when coalesce(p_event->>'itemId', '') ~* '^[0-9a-f-]{36}$' then (p_event->>'itemId')::uuid else null end;
  v_lesson_id := case when coalesce(p_event->>'lessonId', '') ~* '^[0-9a-f-]{36}$' then (p_event->>'lessonId')::uuid else null end;
  v_chapter_id := case when coalesce(p_event->>'chapterId', '') ~* '^[0-9a-f-]{36}$' then (p_event->>'chapterId')::uuid else null end;
  v_problem_id := nullif(left(trim(coalesce(p_event->>'problemId', '')), 160), '');
  v_quiz_question_id := nullif(left(trim(coalesce(p_event->>'quizQuestionId', '')), 160), '');
  v_item_type := nullif(left(trim(coalesce(p_event->>'itemType', '')), 80), '');
  v_subject := nullif(left(trim(coalesce(p_event->>'subject', '')), 80), '');
  v_mistake_kind := coalesce(nullif(left(trim(coalesce(p_event->>'mistakeKind', '')), 80), ''), 'wrong_answer');
  v_attempt_number := greatest(1, least(999, coalesce((p_event->>'attemptNumber')::integer, 1)));
  v_severity := greatest(1, least(5, coalesce((p_event->>'severity')::integer, 1)));

  select coalesce(array_agg(distinct left(trim(value), 80)) filter (where trim(value) <> ''), '{}')
  into v_concept_tags
  from jsonb_array_elements_text(coalesce(p_event->'conceptTags', '[]'::jsonb)) as t(value);

  insert into public.user_learning_mistake_events (
    user_id,
    surface,
    item_id,
    lesson_id,
    chapter_id,
    problem_id,
    quiz_question_id,
    item_type,
    subject,
    concept_tags,
    mistake_kind,
    submitted_answer,
    correct_answer,
    prompt_context,
    attempt_number,
    severity
  ) values (
    v_user_id,
    v_surface,
    v_item_id,
    v_lesson_id,
    v_chapter_id,
    v_problem_id,
    v_quiz_question_id,
    v_item_type,
    v_subject,
    coalesce(v_concept_tags, '{}'),
    v_mistake_kind,
    p_event->'submittedAnswer',
    p_event->'correctAnswer',
    p_event->'promptContext',
    v_attempt_number,
    v_severity
  ) returning id into v_event_id;

  v_weight := v_severity::numeric;

  foreach v_tag in array coalesce(v_concept_tags, '{}') loop
    insert into public.user_mistake_concept_stats (
      user_id,
      concept_key,
      subject,
      mistake_count,
      recent_weight,
      last_mistake_at,
      example_event_ids
    ) values (
      v_user_id,
      lower(v_tag),
      v_subject,
      1,
      v_weight,
      now(),
      array[v_event_id]
    )
    on conflict (user_id, concept_key) do update
      set mistake_count = public.user_mistake_concept_stats.mistake_count + 1,
          recent_weight = public.user_mistake_concept_stats.recent_weight + excluded.recent_weight,
          last_mistake_at = now(),
          subject = coalesce(excluded.subject, public.user_mistake_concept_stats.subject),
          example_event_ids = (
            select array_agg(x)
            from (
              select distinct x
              from unnest(array_prepend(v_event_id, public.user_mistake_concept_stats.example_event_ids)) as u(x)
              limit 8
            ) s
          );
  end loop;

  return v_event_id;
end;
$$;

grant execute on function public.record_learning_mistake(jsonb) to authenticated;

create or replace function public.get_user_mistake_profile(p_limit integer default 100)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := greatest(1, least(250, coalesce(p_limit, 100)));
  v_events jsonb;
  v_concepts jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb)
  into v_events
  from (
    select *
    from public.user_learning_mistake_events
    where user_id = v_user_id
    order by created_at desc
    limit v_limit
  ) e;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.recent_weight desc, s.last_mistake_at desc), '[]'::jsonb)
  into v_concepts
  from (
    select *
    from public.user_mistake_concept_stats
    where user_id = v_user_id
    order by recent_weight desc, last_mistake_at desc
    limit 30
  ) s;

  return jsonb_build_object('events', v_events, 'concepts', v_concepts);
end;
$$;

grant execute on function public.get_user_mistake_profile(integer) to authenticated;
