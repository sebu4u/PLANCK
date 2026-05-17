-- =============================================================================
-- Seed: 3 probleme Python + teste (pentru verificare submit / Judge0 / ELO)
-- Rulează în Supabase → SQL Editor (sau CLI).
--
-- Slug-uri: planck-verif-suma | planck-verif-hello | planck-verif-max
-- Scriptul șterge DOAR aceste probleme (CASCADE: teste, submisii, progres legat).
-- =============================================================================

begin;

delete from public.coding_problems
where slug in ('planck-verif-suma', 'planck-verif-hello', 'planck-verif-max');

-- --- 1) Sumă: două numere întregi, câte unul pe linie
insert into public.coding_problems (
  slug,
  title,
  statement_markdown,
  difficulty,
  class,
  chapter,
  points,
  time_limit_ms,
  memory_limit_kb,
  tags,
  is_active,
  sample_input,
  sample_output,
  language,
  boilerplate_python
) values (
  'planck-verif-suma',
  '[VERIF] Suma a două numere',
  'Citește două numere întregi (câte unul pe linie) și afișează suma lor.',
  'Ușor',
  9,
  'Verificare IDE',
  100,
  3000,
  256000,
  array['verif', 'python', 'stdin']::text[],
  true,
  E'2\n3\n',
  '5',
  'python',
  E'a = int(input())\nb = int(input())\nprint(a + b)\n'
);

with p as (
  select id from public.coding_problems where slug = 'planck-verif-suma'
)
insert into public.coding_problem_tests (problem_id, stdin, expected_stdout, is_sample, weight, order_index)
select p.id, E'2\n3\n', '5', true, 1, 0 from p
union all
select p.id, E'10\n-3\n', '7', false, 1, 1 from p
union all
select p.id, E'0\n0\n', '0', false, 1, 2 from p;

-- --- 2) Hello fix: o singură linie de ieșire
insert into public.coding_problems (
  slug,
  title,
  statement_markdown,
  difficulty,
  class,
  chapter,
  points,
  time_limit_ms,
  memory_limit_kb,
  tags,
  is_active,
  sample_input,
  sample_output,
  language,
  boilerplate_python
) values (
  'planck-verif-hello',
  '[VERIF] Salut PLANCK',
  'Afișează exact textul `PLANCK` (fără alte linii înainte/după).',
  'Ușor',
  9,
  'Verificare IDE',
  100,
  3000,
  256000,
  array['verif', 'python']::text[],
  true,
  '',
  'PLANCK',
  'python',
  E'print("PLANCK")\n'
);

with p as (
  select id from public.coding_problems where slug = 'planck-verif-hello'
)
insert into public.coding_problem_tests (problem_id, stdin, expected_stdout, is_sample, weight, order_index)
select p.id, '', 'PLANCK', true, 1, 0 from p;

-- --- 3) Maximul a două numere (câte unul pe linie)
insert into public.coding_problems (
  slug,
  title,
  statement_markdown,
  difficulty,
  class,
  chapter,
  points,
  time_limit_ms,
  memory_limit_kb,
  tags,
  is_active,
  sample_input,
  sample_output,
  language,
  boilerplate_python
) values (
  'planck-verif-max',
  '[VERIF] Maximul a două numere',
  'Citește două numere întregi și afișează maximul.',
  'Mediu',
  10,
  'Verificare IDE',
  100,
  3000,
  256000,
  array['verif', 'python']::text[],
  true,
  E'1\n9\n',
  '9',
  'python',
  E'a = int(input())\nb = int(input())\nprint(max(a, b))\n'
);

with p as (
  select id from public.coding_problems where slug = 'planck-verif-max'
)
insert into public.coding_problem_tests (problem_id, stdin, expected_stdout, is_sample, weight, order_index)
select p.id, E'1\n9\n', '9', true, 1, 0 from p
union all
select p.id, E'100\n50\n', '100', false, 1, 1 from p
union all
select p.id, E'-5\n-2\n', '-2', false, 1, 2 from p;

commit;

-- După rulare, în app: /informatica/probleme/planck-verif-suma (etc.)
-- Trimite soluția cu boilerplate-ul implicit sau rezolvarea corectă.
