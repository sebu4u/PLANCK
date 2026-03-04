alter table public.problems
add column if not exists solve_percentage integer;

alter table public.problems
drop constraint if exists problems_solve_percentage_range;

alter table public.problems
add constraint problems_solve_percentage_range
check (solve_percentage is null or solve_percentage between 3 and 92);