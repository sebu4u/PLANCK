-- Award +15 ELO once per learning path answer item, tied to first item completion.

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
      and lpli.item_type in ('grila', 'problem', 'poll')
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
  else
    new_elo := previous_elo;
  end if;

  awarded := v_inserted;
  award_amount := case when v_inserted then v_award_amount else 0 end;

  return next;
end;
$$;

grant execute on function public.award_learning_path_item_elo(uuid, uuid, boolean) to authenticated;
