-- Fix: award_planckpass_xp fails with
--   "column reference \"season_id\" is ambiguous" (42702)
-- because RETURNS TABLE out-params (season_id, xp_total, amount) collide
-- with table column names inside the function body. Every client/SQL award
-- silently no-ops → zero XP for all users.
--
-- Strategy: #variable_conflict use_column + RETURN QUERY (no out-param assigns
-- that reintroduce ambiguity).

create or replace function public.award_planckpass_xp(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_key text
)
returns table (
  awarded boolean,
  xp_total integer,
  season_id uuid,
  amount integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_season uuid;
  v_inserted boolean := false;
  v_total integer := 0;
begin
  -- Ensure definer bypasses RLS even if FORCE ROW LEVEL SECURITY is on
  perform set_config('row_security', 'off', true);

  if p_user_id is null
     or coalesce(p_amount, 0) <= 0
     or coalesce(p_source, '') = ''
     or coalesce(p_source_key, '') = '' then
    return query select false, 0, null::uuid, 0;
    return;
  end if;

  select s.id into v_season
  from public.planckpass_seasons s
  where s.is_active = true
  limit 1;

  if v_season is null then
    return query select false, 0, null::uuid, 0;
    return;
  end if;

  insert into public.planckpass_user_progress as upp (user_id, season_id, xp_total, updated_at)
  values (p_user_id, v_season, 0, now())
  on conflict (user_id, season_id) do nothing;

  insert into public.planckpass_xp_events as ev (user_id, season_id, source, source_key, amount)
  values (p_user_id, v_season, p_source, p_source_key, p_amount)
  on conflict (user_id, season_id, source, source_key) do nothing
  returning true into v_inserted;

  v_inserted := coalesce(v_inserted, false);

  if v_inserted then
    update public.planckpass_user_progress as upp
    set xp_total = upp.xp_total + p_amount,
        updated_at = now()
    where upp.user_id = p_user_id
      and upp.season_id = v_season
    returning upp.xp_total into v_total;
  else
    select upp.xp_total into v_total
    from public.planckpass_user_progress as upp
    where upp.user_id = p_user_id
      and upp.season_id = v_season;
  end if;

  return query
    select
      v_inserted,
      coalesce(v_total, 0),
      v_season,
      case when v_inserted then p_amount else 0 end;
end;
$$;

revoke all on function public.award_planckpass_xp(uuid, integer, text, text) from public;
grant execute on function public.award_planckpass_xp(uuid, integer, text, text) to authenticated;
grant execute on function public.award_planckpass_xp(uuid, integer, text, text) to service_role;

-- Keep self-wrapper in sync (same signature / grants)
create or replace function public.award_planckpass_xp_self(
  p_amount integer,
  p_source text,
  p_source_key text
)
returns table (
  awarded boolean,
  xp_total integer,
  season_id uuid,
  amount integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  return query
    select * from public.award_planckpass_xp(v_uid, p_amount, p_source, p_source_key);
end;
$$;

revoke all on function public.award_planckpass_xp_self(integer, text, text) from public;
grant execute on function public.award_planckpass_xp_self(integer, text, text) to authenticated;

-- Prefer SELECT FROM when awarding inside other RPCs (reliable SRF invocation)
create or replace function public._planckpass_award_safe(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.award_planckpass_xp(p_user_id, p_amount, p_source, p_source_key);
exception
  when others then
    raise notice 'PlanckPass XP skipped: %', SQLERRM;
end;
$$;

grant execute on function public._planckpass_award_safe(uuid, integer, text, text) to authenticated;
grant execute on function public._planckpass_award_safe(uuid, integer, text, text) to service_role;
