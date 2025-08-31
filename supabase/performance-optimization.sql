-- Performance Optimization for RLS Policies
-- This script optimizes RLS policies by wrapping auth.uid() calls in subqueries
-- to prevent re-evaluation for each row, improving query performance at scale.

-- Profiles table optimizations
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Solved problems table optimizations
DROP POLICY IF EXISTS "solved_select_own" ON public.solved_problems;
CREATE POLICY "solved_select_own"
  ON public.solved_problems FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "solved_insert_own" ON public.solved_problems;
CREATE POLICY "solved_insert_own"
  ON public.solved_problems FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "solved_update_own" ON public.solved_problems;
CREATE POLICY "solved_update_own"
  ON public.solved_problems FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "solved_delete_own" ON public.solved_problems;
CREATE POLICY "solved_delete_own"
  ON public.solved_problems FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- User badges table optimizations
DROP POLICY IF EXISTS "user_badges_select_own" ON public.user_badges;
CREATE POLICY "user_badges_select_own"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_badges_insert_system" ON public.user_badges;
CREATE POLICY "user_badges_insert_system"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Optional: Add index on user_id columns for better performance
-- Uncomment these lines if the indexes don't already exist
-- CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
-- CREATE INDEX IF NOT EXISTS idx_solved_problems_user_id ON public.solved_problems(user_id);
-- CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
