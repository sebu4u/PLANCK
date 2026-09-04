-- Workshop attendance confirmation tracking
-- Add confirmed_at timestamptz to workshop_unlocks and create confirm RPC

-- ---------------------------------------------------------------------------
-- Add confirmed_at column
-- ---------------------------------------------------------------------------
alter table public.workshop_unlocks
  add column if not exists confirmed_at timestamptz;

comment on column public.workshop_unlocks.confirmed_at is
  'When the user confirmed they will attend (separate step after unlock/reservation)';

-- ---------------------------------------------------------------------------
-- RPC: confirm_workshop_attendance
-- ---------------------------------------------------------------------------
create or replace function public.confirm_workshop_attendance(p_workshop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_unlock_row public.workshop_unlocks;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  -- Get and lock the unlock row
  select * into v_unlock_row
  from public.workshop_unlocks
  where user_id = v_uid and workshop_id = p_workshop_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_unlocked');
  end if;

  -- If already confirmed, return existing timestamp
  if v_unlock_row.confirmed_at is not null then
    return jsonb_build_object(
      'ok', true,
      'already_confirmed', true,
      'confirmed_at', v_unlock_row.confirmed_at
    );
  end if;

  -- Set confirmation timestamp
  update public.workshop_unlocks
  set confirmed_at = now()
  where user_id = v_uid and workshop_id = p_workshop_id
  returning confirmed_at into v_unlock_row.confirmed_at;

  return jsonb_build_object(
    'ok', true,
    'already_confirmed', false,
    'confirmed_at', v_unlock_row.confirmed_at
  );
end;
$$;

grant execute on function public.confirm_workshop_attendance(uuid) to authenticated;
