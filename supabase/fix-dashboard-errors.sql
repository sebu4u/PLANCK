-- ============================================
-- Fix pentru erorile de 404 și 406 din dashboard
-- ============================================

-- 1. Verifică dacă tabela boards există, dacă nu, creează-o
CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Board',
  content jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pentru boards
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON public.boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON public.boards(updated_at DESC);

-- RLS pentru boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boards_select_own" ON public.boards;
CREATE POLICY "boards_select_own"
  ON public.boards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "boards_insert_own" ON public.boards;
CREATE POLICY "boards_insert_own"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "boards_update_own" ON public.boards;
CREATE POLICY "boards_update_own"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "boards_delete_own" ON public.boards;
CREATE POLICY "boards_delete_own"
  ON public.boards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Verifică și repară RLS policies pentru daily_challenges
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Șterge policies vechi
DROP POLICY IF EXISTS "daily_challenges_select_all" ON public.daily_challenges;
DROP POLICY IF EXISTS "daily_challenges_select_public" ON public.daily_challenges;

-- Creează policy nouă care permite SELECT pentru toți utilizatorii autentificați
CREATE POLICY "daily_challenges_select_all"
  ON public.daily_challenges FOR SELECT
  TO authenticated
  USING (true);

-- 3. Verificare finală
SELECT 
  'Boards table' as resource,
  COUNT(*) as count
FROM public.boards
UNION ALL
SELECT 
  'Daily challenges' as resource,
  COUNT(*) as count
FROM public.daily_challenges;

-- Afișează policies pentru verificare
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('boards', 'daily_challenges')
ORDER BY tablename, policyname;

