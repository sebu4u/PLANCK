-- Name + phone reservations from /planck-week/fizica (no account required).

create table if not exists public.planck_week_fizica_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  constraint planck_week_fizica_leads_name_len check (char_length(btrim(name)) between 2 and 80),
  constraint planck_week_fizica_leads_phone_len check (char_length(phone) between 8 and 20)
);

create unique index if not exists idx_planck_week_fizica_leads_phone
  on public.planck_week_fizica_leads (phone);

create index if not exists idx_planck_week_fizica_leads_created_at
  on public.planck_week_fizica_leads (created_at desc);

comment on table public.planck_week_fizica_leads is
  'Name and phone reservations from the Planck Week Fizică landing.';

alter table if exists public.planck_week_fizica_leads enable row level security;

revoke all on table public.planck_week_fizica_leads from anon, authenticated;
grant all on table public.planck_week_fizica_leads to service_role;
