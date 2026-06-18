-- Calendar evenimente pe /invata/fizica (pregătire, curs, workshop, simulare).

create table if not exists public.fizica_calendar_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  event_type text not null,
  title text not null,
  description text,
  start_time time not null,
  color text not null default '#2563eb',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fizica_calendar_events_event_date_unique unique (event_date),
  constraint fizica_calendar_events_event_type_allowed
    check (event_type in ('pregatire', 'curs', 'workshop', 'simulare'))
);

create index if not exists idx_fizica_calendar_events_date
  on public.fizica_calendar_events (event_date);

create index if not exists idx_fizica_calendar_events_type
  on public.fizica_calendar_events (event_type);

alter table public.fizica_calendar_events enable row level security;

drop policy if exists "public_can_read_fizica_calendar_events" on public.fizica_calendar_events;
create policy "public_can_read_fizica_calendar_events"
  on public.fizica_calendar_events
  for select
  using (is_active = true);

grant select on public.fizica_calendar_events to anon, authenticated;

comment on table public.fizica_calendar_events is
  'Evenimente afișate în calendarul de pe /invata/fizica.';
comment on column public.fizica_calendar_events.event_date is
  'Data evenimentului (maxim un eveniment activ per zi).';
comment on column public.fizica_calendar_events.event_type is
  'pregatire | curs | workshop | simulare';
comment on column public.fizica_calendar_events.color is
  'Culoare hex pentru tint-ul celulei din calendar.';
comment on column public.fizica_calendar_events.image_url is
  'URL imagine transparentă opțională, afișată peste celula zilei.';
