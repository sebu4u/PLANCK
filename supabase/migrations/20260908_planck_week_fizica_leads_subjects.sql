-- Store selected Planck Week subjects on phone leads.

alter table if exists public.planck_week_fizica_leads
  add column if not exists subjects text[] not null default array['fizica']::text[];

comment on column public.planck_week_fizica_leads.subjects is
  'Workshop subject keys the student reserved (mate, fizica, info, biologie, chimie).';

comment on table public.planck_week_fizica_leads is
  'Name, phone, and subjects from Planck Week landings.';
