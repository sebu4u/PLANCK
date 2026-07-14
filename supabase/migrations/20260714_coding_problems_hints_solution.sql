-- Hint-uri și soluție pentru probleme de informatică
alter table if exists public.coding_problems
  add column if not exists hint_1_markdown text,
  add column if not exists hint_2_markdown text,
  add column if not exists solution_markdown text;

comment on column public.coding_problems.hint_1_markdown is 'Primul hint (markdown), disponibil tuturor utilizatorilor cu acces la problemă.';
comment on column public.coding_problems.hint_2_markdown is 'Al doilea hint (markdown), disponibil doar utilizatorilor Plus/Premium.';
comment on column public.coding_problems.solution_markdown is 'Soluția problemei (markdown), disponibilă doar utilizatorilor Plus/Premium.';
