-- Carduri simulări afișate pe /invata/fizica (bandă sus + următoarea simulare).

create table if not exists public.fizica_simulation_cards (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null default 0,
  nume text not null,
  tema text not null,
  tema_culoare text not null default '#2563eb',
  data date not null,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fizica_simulation_cards_order
  on public.fizica_simulation_cards (order_index);

create index if not exists idx_fizica_simulation_cards_data
  on public.fizica_simulation_cards (data);

alter table public.fizica_simulation_cards enable row level security;

drop policy if exists "public_can_read_fizica_simulation_cards" on public.fizica_simulation_cards;
create policy "public_can_read_fizica_simulation_cards"
  on public.fizica_simulation_cards
  for select
  using (is_active = true);

grant select on public.fizica_simulation_cards to anon, authenticated;

comment on table public.fizica_simulation_cards is
  'Carduri simulări pentru pagina /invata/fizica: imagine, temă colorată, nume și dată.';
comment on column public.fizica_simulation_cards.order_index is
  'Ordinea afișării în banda cu 3 carduri (stânga → dreapta).';
comment on column public.fizica_simulation_cards.nume is
  'Numele simulării (text gri sub temă).';
comment on column public.fizica_simulation_cards.tema is
  'Etichetă colorată afișată sub imagine.';
comment on column public.fizica_simulation_cards.tema_culoare is
  'Culoare hex pentru textul temei (ex. #2563eb).';
comment on column public.fizica_simulation_cards.data is
  'Data desfășurării simulării.';
comment on column public.fizica_simulation_cards.image_url is
  'URL imagine card (din storage sau extern).';
