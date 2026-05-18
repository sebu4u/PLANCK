-- Extra statement sections for coding_problems (cerință, formate, constrângeri)
-- + allow Inițiere in difficulty (aligned with UI filters / ELO helpers)

alter table public.coding_problems
  add column if not exists requirement_markdown text,
  add column if not exists input_format text,
  add column if not exists output_format text,
  add column if not exists constraints_markdown text;

alter table public.coding_problems
  drop constraint if exists coding_problems_difficulty_check;

alter table public.coding_problems
  add constraint coding_problems_difficulty_check
  check (difficulty in ('Inițiere', 'Ușor', 'Mediu', 'Avansat', 'Concurs'));
