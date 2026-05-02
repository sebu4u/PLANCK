-- Add 'test' learning path item type, plus battery system for test attempts
-- and a server-side scoring RPC that gates progress on >80% score.

-- 1) Allow item_type = 'test'
alter table public.learning_path_lesson_items
  drop constraint if exists learning_path_lesson_items_item_type_check;

alter table public.learning_path_lesson_items
  add constraint learning_path_lesson_items_item_type_check
  check (item_type in ('text', 'video', 'grila', 'problem', 'poll', 'custom_text', 'simulation', 'test'));


-- 2) Per-user battery state for test attempts
create table if not exists public.user_learning_path_test_batteries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  count smallint not null default 3,
  refill_queue jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint test_batteries_count_range check (count >= 0 and count <= 3)
);

alter table public.user_learning_path_test_batteries enable row level security;

drop policy if exists "test_batteries_select_own" on public.user_learning_path_test_batteries;
create policy "test_batteries_select_own"
  on public.user_learning_path_test_batteries
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Note: writes go through SECURITY DEFINER RPCs below, so we don't grant
-- direct INSERT/UPDATE policies. Reads via REST are fine.

grant select on public.user_learning_path_test_batteries to authenticated;


-- 3) Helper: claim due refills and return the up-to-date battery state.
create or replace function public.lp_test_battery_state(p_user_id uuid)
returns table (
  count smallint,
  next_refill_at timestamptz,
  refill_queue jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count smallint;
  v_queue jsonb;
  v_first text;
  v_first_ts timestamptz;
begin
  select b.count, b.refill_queue
    into v_count, v_queue
    from public.user_learning_path_test_batteries b
   where b.user_id = p_user_id;

  if v_count is null then
    insert into public.user_learning_path_test_batteries (user_id, count, refill_queue)
      values (p_user_id, 3, '[]'::jsonb)
      on conflict (user_id) do nothing;
    v_count := 3;
    v_queue := '[]'::jsonb;
  end if;

  -- Drain due refills from the head of the queue, capping count at 3.
  loop
    if v_count >= 3 then
      v_queue := '[]'::jsonb;
      exit;
    end if;
    if jsonb_array_length(coalesce(v_queue, '[]'::jsonb)) = 0 then
      exit;
    end if;
    v_first := v_queue->>0;
    begin
      v_first_ts := v_first::timestamptz;
    exception when others then
      v_queue := v_queue - 0;
      continue;
    end;
    if v_first_ts <= now() then
      v_count := v_count + 1;
      v_queue := v_queue - 0;
    else
      exit;
    end if;
  end loop;

  update public.user_learning_path_test_batteries
     set count = v_count,
         refill_queue = v_queue,
         updated_at = now()
   where user_id = p_user_id;

  count := v_count;
  refill_queue := v_queue;
  if jsonb_array_length(coalesce(v_queue, '[]'::jsonb)) > 0 then
    next_refill_at := (v_queue->>0)::timestamptz;
  else
    next_refill_at := null;
  end if;
  return next;
end;
$$;

revoke all on function public.lp_test_battery_state(uuid) from public;
grant execute on function public.lp_test_battery_state(uuid) to authenticated;


-- 4) Wrapper used by the client (no arg, uses auth.uid()).
create or replace function public.get_lp_test_battery_state()
returns table (
  count smallint,
  next_refill_at timestamptz,
  refill_queue jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'auth required';
  end if;
  return query select * from public.lp_test_battery_state(v_uid);
end;
$$;

revoke all on function public.get_lp_test_battery_state() from public;
grant execute on function public.get_lp_test_battery_state() to authenticated;


-- 5) Consume a battery atomically (used at "Start test").
create or replace function public.consume_lp_test_battery()
returns table (
  count smallint,
  next_refill_at timestamptz,
  refill_queue jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_count smallint;
  v_queue jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'auth required';
  end if;

  -- Refresh state first (claims due refills).
  perform public.lp_test_battery_state(v_uid);

  select b.count, b.refill_queue
    into v_count, v_queue
    from public.user_learning_path_test_batteries b
   where b.user_id = v_uid
   for update;

  if v_count is null or v_count <= 0 then
    raise exception 'no_batteries' using errcode = 'P0001';
  end if;

  v_count := v_count - 1;
  v_queue := coalesce(v_queue, '[]'::jsonb)
    || to_jsonb((now() + interval '12 hours')::timestamptz);

  update public.user_learning_path_test_batteries
     set count = v_count,
         refill_queue = v_queue,
         updated_at = now()
   where user_id = v_uid;

  return query select * from public.lp_test_battery_state(v_uid);
end;
$$;

revoke all on function public.consume_lp_test_battery() from public;
grant execute on function public.consume_lp_test_battery() to authenticated;


-- 6) Submit answers, compute the score server-side, gate progress on >80%.
-- p_answers shape: jsonb object { "<problemId>": "<optionId>", ... }
create or replace function public.submit_lp_test(
  p_item_id uuid,
  p_answers jsonb
)
returns table (
  score_total integer,
  score_correct integer,
  passed boolean,
  results jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_item record;
  v_problems jsonb;
  v_problem jsonb;
  v_total integer := 0;
  v_correct integer := 0;
  v_passed boolean := false;
  v_results jsonb := '[]'::jsonb;
  v_user_choice text;
  v_correct_id text;
  v_problem_id text;
  v_is_correct boolean;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'auth required';
  end if;

  select id, item_type, content_json
    into v_item
    from public.learning_path_lesson_items
   where id = p_item_id
     and is_active = true;

  if v_item.id is null then
    raise exception 'item_not_found';
  end if;
  if v_item.item_type <> 'test' then
    raise exception 'item_not_test';
  end if;

  v_problems := coalesce(v_item.content_json -> 'problems', '[]'::jsonb);
  if jsonb_typeof(v_problems) <> 'array' or jsonb_array_length(v_problems) = 0 then
    raise exception 'test_has_no_problems';
  end if;

  for v_problem in select * from jsonb_array_elements(v_problems)
  loop
    v_total := v_total + 1;
    v_problem_id := v_problem->>'id';
    v_correct_id := v_problem->>'correctOptionId';
    v_user_choice := coalesce(p_answers->>v_problem_id, '');
    v_is_correct := v_user_choice <> '' and v_user_choice = v_correct_id;
    if v_is_correct then
      v_correct := v_correct + 1;
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'problemId', v_problem_id,
      'selectedOptionId', case when v_user_choice = '' then null else v_user_choice end,
      'correctOptionId', v_correct_id,
      'isCorrect', v_is_correct
    ));
  end loop;

  v_passed := v_total > 0 and (v_correct::numeric / v_total::numeric) > 0.8;

  if v_passed then
    insert into public.user_learning_path_item_progress (user_id, item_id, completed_at)
      values (v_uid, p_item_id, now())
      on conflict (user_id, item_id) do update
        set completed_at = excluded.completed_at;
  else
    -- Do not reveal correct/incorrect answers when the user does not pass.
    v_results := '[]'::jsonb;
  end if;

  score_total := v_total;
  score_correct := v_correct;
  passed := v_passed;
  results := v_results;
  return next;
end;
$$;

revoke all on function public.submit_lp_test(uuid, jsonb) from public;
grant execute on function public.submit_lp_test(uuid, jsonb) to authenticated;
