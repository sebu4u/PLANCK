-- Carduri hub /invata/fizica: 3 pregătiri + 1 simulare următoare.

drop table if exists public.fizica_simulation_cards;

create table if not exists public.fizica_hub_cards (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null default 0,
  card_type text not null,
  nume text not null,
  tema text not null,
  tema_culoare text not null default '#2563eb',
  data date not null,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fizica_hub_cards_card_type_allowed
    check (card_type in ('pregatire', 'simulare'))
);

create index if not exists idx_fizica_hub_cards_order
  on public.fizica_hub_cards (order_index);

create index if not exists idx_fizica_hub_cards_type
  on public.fizica_hub_cards (card_type);

alter table public.fizica_hub_cards enable row level security;

drop policy if exists "public_can_read_fizica_hub_cards" on public.fizica_hub_cards;
create policy "public_can_read_fizica_hub_cards"
  on public.fizica_hub_cards
  for select
  using (is_active = true);

grant select on public.fizica_hub_cards to anon, authenticated;

comment on table public.fizica_hub_cards is
  'Carduri afișate sus pe /invata/fizica: 3 pregătiri + 1 simulare următoare.';
comment on column public.fizica_hub_cards.order_index is
  'Ordinea afișării de la stânga la dreapta (1–4).';
comment on column public.fizica_hub_cards.card_type is
  'pregatire = pregătire viitoare; simulare = următoarea simulare (card distinct).';
comment on column public.fizica_hub_cards.nume is
  'Numele pregătirii/simulării (text gri sub temă).';
comment on column public.fizica_hub_cards.tema is
  'Etichetă colorată afișată sub imagine.';
comment on column public.fizica_hub_cards.tema_culoare is
  'Culoare hex pentru textul temei.';
comment on column public.fizica_hub_cards.data is
  'Data desfășurării.';
comment on column public.fizica_hub_cards.image_url is
  'URL imagine card.';
