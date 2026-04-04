-- Allow classroom assignments to include any problem from the catalog, not only grila problems.
-- The foreign key on assignment_problems.problem_id already guarantees the problem exists.

DROP TRIGGER IF EXISTS trg_assignment_problems_only_grila ON public.assignment_problems;
DROP FUNCTION IF EXISTS public.ensure_assignment_problem_grila();
