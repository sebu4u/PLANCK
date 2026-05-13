-- Penalize wrong catalog problem answer check (−10 ELO, floored at 0).

create or replace function public.deduct_elo_wrong_problem_answer()
returns table (
  previous_elo integer,
  new_elo integer,
  deducted integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deduct constant integer := 10;
  v_prev integer;
  v_new integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_stats (user_id, elo, rank)
  values (v_user_id, 500, public.get_rank_from_elo(500))
  on conflict (user_id) do nothing;

  select us.elo
  into v_prev
  from public.user_stats us
  where us.user_id = v_user_id
  for update;

  if v_prev is null then
    v_prev := 500;
  end if;

  v_new := greatest(0, v_prev - v_deduct);

  update public.user_stats
  set
    elo = v_new,
    updated_at = now()
  where user_id = v_user_id;

  previous_elo := v_prev;
  new_elo := v_new;
  deducted := v_prev - v_new;
  return next;
end;
$$;

grant execute on function public.deduct_elo_wrong_problem_answer() to authenticated;
