-- Link Planck Week leads to the auth user who claimed the seat.

alter table if exists public.planck_week_leads
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table if exists public.planck_week_leads
  add column if not exists claimed_at timestamptz;

create index if not exists idx_planck_week_leads_user_id
  on public.planck_week_leads (user_id)
  where user_id is not null;

comment on column public.planck_week_leads.user_id is
  'Auth user who confirmed the reservation via magic link or an existing session.';

comment on column public.planck_week_leads.claimed_at is
  'When the lead was converted into workshop_unlocks.';

-- Public form may only create unclaimed leads; claim updates go through service role.
drop policy if exists "planck_week_leads_insert_public" on public.planck_week_leads;
create policy "planck_week_leads_insert_public"
  on public.planck_week_leads
  for insert
  to anon, authenticated
  with check (user_id is null and claimed_at is null);
