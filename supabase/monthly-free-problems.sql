-- =============================================
-- Monthly Free Problems - Manual Selection
-- =============================================
-- Acest script creează tabelul pentru selecțiile manuale ale problemelor gratuite
-- pentru fiecare lună. Dacă există selecții manuale pentru o lună, acestea
-- vor avea prioritate față de algoritmul automat de rotație.

create table if not exists public.monthly_free_problems (
  id uuid primary key default gen_random_uuid(),
  month_key text not null, -- format: "2024-12"
  problem_id text not null references public.problems(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique(month_key, problem_id)
);

create index if not exists idx_monthly_free_problems_month 
  on public.monthly_free_problems(month_key);

create index if not exists idx_monthly_free_problems_problem 
  on public.monthly_free_problems(problem_id);

-- Enable RLS
alter table if exists public.monthly_free_problems enable row level security;

-- Policy: Doar adminii pot vedea și modifica selecțiile
-- Notă: Verificarea admin se va face în aplicație, aici permitem doar authenticated
-- pentru a evita probleme cu RLS. Securitatea reală va fi în API routes.
drop policy if exists "monthly_free_problems_select_admin" on public.monthly_free_problems;
create policy "monthly_free_problems_select_admin"
  on public.monthly_free_problems
  for select
  to authenticated
  using (true); -- Verificarea admin se face în API

drop policy if exists "monthly_free_problems_insert_admin" on public.monthly_free_problems;
create policy "monthly_free_problems_insert_admin"
  on public.monthly_free_problems
  for insert
  to authenticated
  with check (true); -- Verificarea admin se face în API

drop policy if exists "monthly_free_problems_delete_admin" on public.monthly_free_problems;
create policy "monthly_free_problems_delete_admin"
  on public.monthly_free_problems
  for delete
  to authenticated
  using (true); -- Verificarea admin se face în API

