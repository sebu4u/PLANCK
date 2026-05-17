-- =============================================================================
-- Planck: limbaj problemă (C++ / Python) + boilerplate Python
-- =============================================================================
-- Rulează în Supabase → SQL Editor.
-- Presupune că tabela public.coding_problems există deja (din migrare anterioară).
--
-- Nu conține DROP POLICY / DROP TRIGGER — reduce avertismentele „destructive”.
-- =============================================================================

-- 1) Coloane noi (idempotent). Pentru `language`, DEFAULT umple rândurile existente (PG 11+).
alter table if exists public.coding_problems
  add column if not exists language text default 'cpp';

alter table if exists public.coding_problems
  add column if not exists boilerplate_python text;

-- 2) Doar dacă există valori invalide față de check (ex. date vechi manuale)
update public.coding_problems
set language = 'cpp'
where lower(trim(coalesce(language, ''))) not in ('cpp', 'python');

-- 3) Constraint check (adaugă o singură dată)
do $$
begin
  alter table public.coding_problems
    add constraint coding_problems_language_check
      check (language in ('cpp', 'python'))
      not valid;
exception
  when duplicate_object then
    null;
end;
$$;

-- 4) Validează datele existente față de check
alter table if exists public.coding_problems
  validate constraint coding_problems_language_check;

-- 5) Default + NOT NULL pe language
alter table if exists public.coding_problems
  alter column language set default 'cpp';

alter table if exists public.coding_problems
  alter column language set not null;

-- Sfârșit
