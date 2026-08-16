-- Workshop materials: notes (markdown + PDF), homework items + PDF, whiteboard URL.
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

alter table if exists public.workshops
  add column if not exists whiteboard_url text,
  add column if not exists notes_markdown text not null default '',
  add column if not exists notes_pdf_path text,
  add column if not exists homework_pdf_path text;

create table if not exists public.workshop_homework_items (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  item_type text not null,
  ref_id text not null,
  title text not null default '',
  href text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint workshop_homework_items_type_allowed check (
    item_type in (
      'physics_problem',
      'math_problem',
      'coding_problem',
      'grila_fizica',
      'grila_biologie'
    )
  )
);

create index if not exists workshop_homework_items_workshop_idx
  on public.workshop_homework_items (workshop_id, sort_order);

alter table if exists public.workshop_homework_items enable row level security;

revoke all on public.workshop_homework_items from anon, authenticated;
grant all on public.workshop_homework_items to service_role;

insert into storage.buckets (id, name, public)
values ('workshop-materials', 'workshop-materials', false)
on conflict (id) do update
set public = false;
