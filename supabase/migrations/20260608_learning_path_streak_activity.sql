-- Count learning path item completions toward daily streak activity.

create or replace function public.get_user_last_activity_at(user_uuid uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    coalesce(
      (select max(sp.solved_at) from public.solved_problems sp where sp.user_id = user_uuid),
      '-infinity'::timestamptz
    ),
    coalesce(
      (select max(ulpp.completed_at)
       from public.user_learning_path_item_progress ulpp
       where ulpp.user_id = user_uuid),
      '-infinity'::timestamptz
    )
  );
$$;

create or replace function public.record_user_streak_activity(user_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := current_date;
  old_last_activity_date date;
  current_problems_solved integer;
  new_activity_level integer;
  newest_activity timestamptz;
  prev_activity timestamptz;
  new_streak integer;
begin
  if auth.uid() is distinct from user_uuid then
    raise exception 'Not authorized';
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (user_uuid, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  select last_activity_date into old_last_activity_date
  from public.user_stats
  where user_id = user_uuid;

  update public.user_stats
  set problems_solved_today = case
        when old_last_activity_date is distinct from today_date then 1
        else problems_solved_today + 1
      end,
      last_activity_date = today_date,
      updated_at = now()
  where user_id = user_uuid;

  insert into public.daily_activity (user_id, activity_date, problems_solved, time_minutes, activity_level)
  values (user_uuid, today_date, 1, 0, 1)
  on conflict (user_id, activity_date) do update
  set problems_solved = daily_activity.problems_solved + 1,
      updated_at = now();

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

  update public.daily_activity
  set activity_level = new_activity_level
  where user_id = user_uuid and activity_date = today_date;

  select public.get_user_last_activity_at(user_uuid) into newest_activity;

  select greatest(
    coalesce(
      (select max(sp.solved_at)
       from public.solved_problems sp
       where sp.user_id = user_uuid
         and sp.solved_at < newest_activity),
      '-infinity'::timestamptz
    ),
    coalesce(
      (select max(ulpp.completed_at)
       from public.user_learning_path_item_progress ulpp
       where ulpp.user_id = user_uuid
         and ulpp.completed_at < newest_activity),
      '-infinity'::timestamptz
    )
  ) into prev_activity;

  if prev_activity = '-infinity'::timestamptz
     or (newest_activity - prev_activity >= interval '24 hours') then
    update public.user_stats
    set current_streak = 0
    where user_id = user_uuid;
  end if;

  perform public.update_user_streak(user_uuid, old_last_activity_date);
  perform public.check_and_award_badges(user_uuid);

  select current_streak into new_streak
  from public.user_stats
  where user_id = user_uuid;

  return coalesce(new_streak, 0);
end;
$$;

grant execute on function public.record_user_streak_activity(uuid) to authenticated;

create or replace function public.check_and_reset_streak_if_needed(user_uuid uuid)
returns void as $$
declare
  last_activity timestamptz;
  current_streak_count integer;
begin
  if auth.uid() is distinct from user_uuid then
    return;
  end if;

  select public.get_user_last_activity_at(user_uuid) into last_activity;

  select us.current_streak into current_streak_count
  from public.user_stats us
  where us.user_id = user_uuid;

  if last_activity = '-infinity'::timestamptz then
    if coalesce(current_streak_count, 0) > 0 then
      update public.user_stats
      set current_streak = 0,
          best_streak = greatest(best_streak, current_streak_count)
      where user_id = user_uuid;
    end if;
    return;
  end if;

  if now() - last_activity < interval '24 hours' then
    return;
  end if;

  update public.user_stats
  set current_streak = 0,
      best_streak = greatest(best_streak, coalesce(current_streak_count, 0))
  where user_id = user_uuid;
end;
$$ language plpgsql security definer;

create or replace function public.award_learning_path_item_elo(
  item_id_param uuid,
  lesson_id_param uuid default null,
  is_last_item_param boolean default false
)
returns table (
  awarded boolean,
  previous_elo integer,
  new_elo integer,
  award_amount integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_award_amount integer := 15;
  v_inserted boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.learning_path_lesson_items lpli
    where lpli.id = item_id_param
      and lpli.item_type in ('grila', 'problem', 'poll', 'fill_slot')
  ) then
    raise exception 'Learning path item is not eligible for answer ELO';
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (v_user_id, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  insert into public.user_learning_path_item_progress (user_id, item_id, completed_at)
  values (v_user_id, item_id_param, now())
  on conflict (user_id, item_id) do nothing
  returning true into v_inserted;

  v_inserted := coalesce(v_inserted, false);

  if is_last_item_param and lesson_id_param is not null then
    insert into public.user_learning_path_lesson_progress (user_id, lesson_id, completed_at)
    values (v_user_id, lesson_id_param, now())
    on conflict (user_id, lesson_id)
    do update set completed_at = excluded.completed_at;
  end if;

  select us.elo
  into previous_elo
  from public.user_stats us
  where us.user_id = v_user_id
  for update;

  if v_inserted then
    update public.user_stats
    set
      elo = elo + v_award_amount,
      updated_at = now()
    where user_id = v_user_id
    returning elo into new_elo;

    begin
      perform public.record_user_streak_activity(v_user_id);
    exception
      when others then
        raise notice 'EROARE non-critică în learning path streak: %', SQLERRM;
    end;
  else
    new_elo := previous_elo;
  end if;

  awarded := v_inserted;
  award_amount := case when v_inserted then v_award_amount else 0 end;

  return next;
end;
$$;

grant execute on function public.award_learning_path_item_elo(uuid, uuid, boolean) to authenticated;

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
  v_inserted boolean := false;
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
      on conflict (user_id, item_id) do nothing
      returning true into v_inserted;

    v_inserted := coalesce(v_inserted, false);

    if not v_inserted then
      update public.user_learning_path_item_progress
      set completed_at = now()
      where user_id = v_uid and item_id = p_item_id;
    else
      begin
        perform public.record_user_streak_activity(v_uid);
      exception
        when others then
          raise notice 'EROARE non-critică în learning path test streak: %', SQLERRM;
      end;
    end if;
  else
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
