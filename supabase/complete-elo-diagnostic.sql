-- ============================================
-- DIAGNOSTIC COMPLET SISTEM ELO
-- ============================================

-- 1. VERIFICARE STRUCTURĂ TABELE
-- Structura tabelei problems:
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'problems'
AND column_name IN ('id', 'difficulty', 'title');

-- Structura tabelei user_stats:
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_stats'
AND column_name IN ('user_id', 'elo', 'rank', 'problems_solved_today', 'problems_solved_total');

-- 2. VERIFICARE VALORILE DIFICULTĂȚII ÎN PROBLEMS
SELECT 
    difficulty,
    COUNT(*) as count
FROM public.problems
GROUP BY difficulty
ORDER BY count DESC;

-- Exemple de probleme cu dificultatea lor:
SELECT 
    id,
    title,
    difficulty,
    category
FROM public.problems
LIMIT 5;

-- 3. VERIFICARE TRIGGERE
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('solved_problems', 'user_stats')
ORDER BY event_object_table, trigger_name;

-- 4. VERIFICARE FUNCȚII
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('award_elo_for_problem', 'handle_problem_solved', 'get_rank_from_elo', 'update_rank_on_elo_change')
ORDER BY routine_name;

-- 5. VERIFICARE SOLVED_PROBLEMS
SELECT 
    sp.id,
    sp.user_id,
    sp.problem_id,
    sp.solved_at,
    p.difficulty,
    p.title
FROM public.solved_problems sp
LEFT JOIN public.problems p ON p.id = sp.problem_id
ORDER BY sp.solved_at DESC
LIMIT 5;

-- 6. VERIFICARE USER_STATS
SELECT 
    user_id,
    elo,
    rank,
    problems_solved_today,
    problems_solved_total,
    current_streak,
    updated_at
FROM public.user_stats
ORDER BY updated_at DESC
LIMIT 5;

-- 7. TEST FUNCȚIE award_elo_for_problem
-- Testăm funcția manual pentru primul user și prima problemă...
DO $$
DECLARE
    test_user_id uuid;
    test_problem_id text;
    test_elo_before integer;
    test_problem_difficulty text;
BEGIN
    -- Găsește un user care există în user_stats
    SELECT user_id INTO test_user_id
    FROM public.user_stats
    LIMIT 1;
    
    -- Găsește o problemă
    SELECT id::text, difficulty INTO test_problem_id, test_problem_difficulty
    FROM public.problems
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'NU există niciun user în user_stats!';
        RETURN;
    END IF;
    
    IF test_problem_id IS NULL THEN
        RAISE NOTICE 'NU există nicio problemă în problems!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Test user: %', test_user_id;
    RAISE NOTICE 'Test problem: % (difficulty: %)', test_problem_id, test_problem_difficulty;
    
    -- Obține ELO înainte
    SELECT elo INTO test_elo_before
    FROM public.user_stats
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'ELO înainte: %', test_elo_before;
    RAISE NOTICE 'NOTĂ: Nu am executat funcția pentru a evita modificarea datelor.';
    RAISE NOTICE 'Pentru a testa efectiv, decomentează linia PERFORM de mai sus.';
END $$;

-- 8. VERIFICARE PUBLICAȚII REALTIME
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('user_stats', 'daily_activity', 'solved_problems')
ORDER BY tablename;
