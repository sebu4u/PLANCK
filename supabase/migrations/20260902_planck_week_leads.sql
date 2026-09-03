-- Public Planck Week reservation leads (free live tutoring week landing).

create table if not exists public.planck_week_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subjects text[] not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_planck_week_leads_created_at
  on public.planck_week_leads (created_at desc);

create index if not exists idx_planck_week_leads_email
  on public.planck_week_leads (email);

comment on table public.planck_week_leads is
  'Reservations for Planck Week; inserted from the public /planck-week form.';

alter table if exists public.planck_week_leads enable row level security;

-- Anonymous and logged-in users may insert (marketing form); no public SELECT.
drop policy if exists "planck_week_leads_insert_public" on public.planck_week_leads;
create policy "planck_week_leads_insert_public"
  on public.planck_week_leads
  for insert
  to anon, authenticated
  with check (true);
