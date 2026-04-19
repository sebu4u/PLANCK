-- Streak reset: rolling 24h since last solved_problems.solved_at (not calendar days).

create index if not exists idx_solved_problems_user_solved_at
  on public.solved_problems (user_id, solved_at desc);

create or replace function public.check_and_reset_streak_if_needed(user_uuid uuid)
returns void as $$
declare
  last_solve timestamptz;
  current_streak_count integer;
begin
  if auth.uid() is distinct from user_uuid then
    return;
  end if;

  select max(sp.solved_at) into last_solve
  from public.solved_problems sp
  where sp.user_id = user_uuid;

  select us.current_streak into current_streak_count
  from public.user_stats us
  where us.user_id = user_uuid;

  if last_solve is null then
    if coalesce(current_streak_count, 0) > 0 then
      update public.user_stats
      set current_streak = 0,
          best_streak = greatest(best_streak, current_streak_count)
      where user_id = user_uuid;
    end if;
    return;
  end if;

  if now() - last_solve < interval '24 hours' then
    return;
  end if;

  update public.user_stats
  set current_streak = 0,
      best_streak = greatest(best_streak, coalesce(current_streak_count, 0))
  where user_id = user_uuid;
end;
$$ language plpgsql security definer;

create or replace function public.award_elo_for_problem(user_uuid uuid, problem_id_param text)
returns void as $$
declare
  problem_difficulty text;
  elo_to_award integer;
  today_date date := current_date;
  current_problems_solved integer;
  new_activity_level integer;
  challenge_id uuid;
  challenge_bonus integer;
  challenge_completed boolean;
  old_last_activity_date date;
  newest_solve timestamptz;
  prev_solve timestamptz;
begin
  begin
    select difficulty into problem_difficulty
    from public.problems
    where id::text = problem_id_param
    limit 1;

    if problem_difficulty is null then
      select difficulty into problem_difficulty
      from public.problems
      where id = problem_id_param::uuid
      limit 1;
    end if;
  exception
    when others then
      select difficulty into problem_difficulty
      from public.problems
      where id::text = problem_id_param
      limit 1;
  end;

  if problem_difficulty is null then
    raise notice 'EROARE: Problem difficulty not found for problem_id: %', problem_id_param;
    return;
  end if;

  raise notice 'Problemă găsită: % cu dificultate: %', problem_id_param, problem_difficulty;

  case problem_difficulty
    when 'Ușor' then elo_to_award := 15;
    when 'Mediu' then elo_to_award := 21;
    when 'Avansat' then elo_to_award := 30;
    when 'Easy' then elo_to_award := 15;
    when 'Medium' then elo_to_award := 21;
    when 'Hard' then elo_to_award := 30;
    when 'Difficult' then elo_to_award := 30;
    else
      raise notice 'ATENȚIE: Dificultate necunoscută "%". Folosim default 15 ELO.', problem_difficulty;
      elo_to_award := 15;
  end case;

  raise notice 'ELO de acordat: %', elo_to_award;

  insert into public.user_stats (user_id, elo, rank)
  values (user_uuid, 500, 'Bronze III')
  on conflict (user_id) do nothing;

  select last_activity_date into old_last_activity_date
  from public.user_stats
  where user_id = user_uuid;

  update public.user_stats
  set elo = elo + elo_to_award,
      problems_solved_today = case
        when old_last_activity_date is distinct from today_date then 1
        else problems_solved_today + 1
      end,
      problems_solved_total = problems_solved_total + 1,
      last_activity_date = today_date,
      updated_at = now()
  where user_id = user_uuid;

  begin
    select id, bonus_elo
      into challenge_id, challenge_bonus
    from public.daily_challenges
    where active_date = today_date
      and problem_id::text = problem_id_param
    limit 1;

    if challenge_id is not null then
      select completed
        into challenge_completed
      from public.user_challenges
      where user_id = user_uuid
        and challenge_id = challenge_id
      limit 1;

      if challenge_completed is distinct from true then
        insert into public.user_challenges (user_id, challenge_id, completed, completed_at)
        values (user_uuid, challenge_id, true, now())
        on conflict (user_id, challenge_id) do update
          set completed = true,
              completed_at = now();

        update public.user_stats
        set elo = elo + coalesce(challenge_bonus, 10),
            updated_at = now()
        where user_id = user_uuid;
      end if;
    end if;
  exception
    when others then
      raise notice 'EROARE non-critică în daily challenge bonus: %', SQLERRM;
  end;

  begin
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

    select max(sp.solved_at) into newest_solve
    from public.solved_problems sp
    where sp.user_id = user_uuid;

    select max(sp.solved_at) into prev_solve
    from public.solved_problems sp
    where sp.user_id = user_uuid
      and sp.solved_at < newest_solve;

    if prev_solve is null or (newest_solve - prev_solve >= interval '24 hours') then
      update public.user_stats
      set current_streak = 0
      where user_id = user_uuid;
    end if;

    perform public.update_user_streak(user_uuid, old_last_activity_date);

    perform public.check_and_award_badges(user_uuid);
  exception
    when others then
      raise notice 'EROARE non-critică în daily_activity/streak/badges: %', SQLERRM;
  end;
end;
$$ language plpgsql security definer;
