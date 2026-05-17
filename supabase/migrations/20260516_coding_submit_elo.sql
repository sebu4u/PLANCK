-- =============================================================================
-- Coding problems: secure submissions (no client INSERT), ELO delta RPC
-- =============================================================================
-- Operator: add a problem with tests
--   1) INSERT into public.coding_problems (slug, title, statement_markdown,
--      difficulty, class, chapter, language = 'python', boilerplate_python,
--      time_limit_ms, memory_limit_kb, is_active = true, ...).
--   2) INSERT into public.coding_problem_tests (problem_id, stdin,
--      expected_stdout, is_sample, weight, order_index). Use is_sample = true
--      for examples visible in catalog; hidden tests use is_sample = false.
--      Score % = 100 * sum(weight of passed) / sum(weight of all tests).
--      Optional: weight = 0 on sample-only rows so samples do not affect %.
-- =============================================================================

-- --- Target ELO from best score (0..100), piecewise (plan): <=60 penalty, >60 gain
-- plpgsql + fixed search_path (evită avertismentele Supabase „function_search_path_mutable”)
create or replace function public.coding_elo_target(p_best numeric, p_max_gain integer)
returns integer
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  b numeric;
begin
  b := greatest(0::numeric, least(100::numeric, coalesce(p_best, 0::numeric)));
  if b <= 60::numeric then
    return (- floor(15::numeric * (60::numeric - b) / 60::numeric))::integer;
  end if;
  return floor(p_max_gain::numeric * (b - 60::numeric) / 40::numeric)::integer;
end;
$$;

-- --- Max ELO gain by difficulty (same caps as physics award_elo_for_problem)
create or replace function public.coding_max_elo_gain_for_difficulty(p_difficulty text)
returns integer
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  d text := trim(coalesce(p_difficulty, ''));
begin
  case d
    when 'Ușor' then return 15;
    when 'Mediu' then return 21;
    when 'Avansat' then return 30;
    when 'Concurs' then return 30;
    when 'Inițiere' then return 15;
    when 'Easy' then return 15;
    when 'Medium' then return 21;
    when 'Hard' then return 30;
    when 'Difficult' then return 30;
    else return 15;
  end case;
end;
$$;

-- --- Apply delta ELO when best score improves (server / service_role only)
create or replace function public.apply_coding_problem_elo_delta(
  p_user_id uuid,
  p_problem_id uuid,
  p_old_best numeric,
  p_new_best numeric,
  p_prior_submission_count integer
)
returns table (
  previous_elo integer,
  new_elo integer,
  delta_elo integer,
  old_best numeric,
  new_best numeric,
  max_gain integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_diff text;
  v_max integer;
  v_old_t integer;
  v_new_t integer;
  v_delta integer;
  v_prev integer;
  v_new integer;
  v_nb numeric := greatest(coalesce(p_old_best, 0), coalesce(p_new_best, 0));
  v_ob numeric := greatest(0, coalesce(p_old_best, 0));
begin
  if p_user_id is null then
    raise exception 'apply_coding_problem_elo_delta: p_user_id required';
  end if;

  select cp.difficulty into v_diff
  from public.coding_problems cp
  where cp.id = p_problem_id
  limit 1;

  if v_diff is null then
    raise exception 'apply_coding_problem_elo_delta: problem not found';
  end if;

  v_max := public.coding_max_elo_gain_for_difficulty(v_diff);
  -- First-ever submit on this problem: ELO baseline 0 (do not treat as 0% best).
  if coalesce(p_prior_submission_count, 0) <= 0 then
    v_old_t := 0;
  else
    v_old_t := public.coding_elo_target(v_ob, v_max);
  end if;
  v_new_t := public.coding_elo_target(v_nb, v_max);
  v_delta := v_new_t - v_old_t;

  if v_delta = 0 then
    select us.elo into v_prev from public.user_stats us where us.user_id = p_user_id;
    if v_prev is null then
      v_prev := 500;
    end if;
    previous_elo := v_prev;
    new_elo := v_prev;
    delta_elo := 0;
    old_best := v_ob;
    new_best := v_nb;
    max_gain := v_max;
    return next;
    return;
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (p_user_id, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  select us.elo into v_prev
  from public.user_stats us
  where us.user_id = p_user_id
  for update;

  if v_prev is null then
    v_prev := 500;
  end if;

  v_new := greatest(0, v_prev + v_delta);

  update public.user_stats us
  set
    elo = v_new,
    rank = public.get_rank_from_elo(v_new),
    updated_at = now()
  where us.user_id = p_user_id;

  previous_elo := v_prev;
  new_elo := v_new;
  delta_elo := v_new - v_prev;
  old_best := v_ob;
  new_best := v_nb;
  max_gain := v_max;
  return next;
end;
$$;

-- Doar RPC-ul e apelat de API (service_role). Helper-ele sunt apelate din interior de owner.
revoke all on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) from public;
revoke all on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) from anon;
revoke all on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) from authenticated;
grant execute on function public.apply_coding_problem_elo_delta(uuid, uuid, numeric, numeric, integer) to service_role;

revoke all on function public.coding_elo_target(numeric, integer) from public;
revoke all on function public.coding_elo_target(numeric, integer) from anon;
revoke all on function public.coding_elo_target(numeric, integer) from authenticated;

revoke all on function public.coding_max_elo_gain_for_difficulty(text) from public;
revoke all on function public.coding_max_elo_gain_for_difficulty(text) from anon;
revoke all on function public.coding_max_elo_gain_for_difficulty(text) from authenticated;

-- --- Clients must not forge submissions / progress rows
-- Folosim ALTER POLICY (fără DROP) ca editorul Supabase să nu marcheze „destructive operations”.
do $$
begin
  alter policy "coding_submissions_insert_own" on public.coding_submissions
    to authenticated
    with check (false);
exception
  when undefined_object then null;
end;
$$;

do $$
begin
  alter policy "coding_problem_progress_insert_own" on public.coding_problem_progress
    to authenticated
    with check (false);
exception
  when undefined_object then null;
end;
$$;

do $$
begin
  alter policy "coding_problem_progress_update_own" on public.coding_problem_progress
    to authenticated
    using (false)
    with check (false);
exception
  when undefined_object then null;
end;
$$;
