-- ============================================
-- Script de diagnosticare pentru sistemul ELO
-- Rulează acest script pentru a verifica de ce ELO-ul nu se actualizează
-- ============================================

-- 1. Verifică dacă trigger-ul există și este activ
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'on_problem_solved';

-- 2. Verifică dacă funcția award_elo_for_problem există
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'award_elo_for_problem';

-- 3. Verifică structura tabelei solved_problems
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'solved_problems'
ORDER BY ordinal_position;

-- 4. Verifică structura tabelei problems (pentru a vedea tipul lui id)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'problems'
  AND column_name IN ('id', 'difficulty')
ORDER BY ordinal_position;

-- 5. Verifică ultimele probleme rezolvate
SELECT 
    sp.id,
    sp.user_id,
    sp.problem_id,
    sp.solved_at,
    p.id as problem_exists,
    p.difficulty
FROM solved_problems sp
LEFT JOIN problems p ON p.id::text = sp.problem_id::text
ORDER BY sp.solved_at DESC
LIMIT 5;

-- 6. Verifică user_stats pentru un utilizator specific
-- Înlocuiește 'USER_ID_AICI' cu un user_id real din solved_problems
SELECT 
    user_id,
    elo,
    rank,
    problems_solved_today,
    problems_solved_total,
    last_activity_date,
    updated_at
FROM user_stats
WHERE user_id IN (
    SELECT DISTINCT user_id 
    FROM solved_problems 
    LIMIT 1
);

-- 7. Test manual: încearcă să apelezi funcția direct
-- Înlocuiește valorile cu date reale
-- SELECT award_elo_for_problem(
--     'user-uuid-aici'::uuid,
--     'problem-id-aici'::text
-- );

-- 8. Verifică dacă există probleme cu dificultăți în problems
SELECT 
    COUNT(*) as total_problems,
    COUNT(CASE WHEN difficulty = 'Ușor' THEN 1 END) as usor,
    COUNT(CASE WHEN difficulty = 'Mediu' THEN 1 END) as mediu,
    COUNT(CASE WHEN difficulty = 'Avansat' THEN 1 END) as avansat,
    COUNT(CASE WHEN difficulty NOT IN ('Ușor', 'Mediu', 'Avansat') THEN 1 END) as altele
FROM problems;

-- 9. Verifică Realtime pentru user_stats
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('user_stats', 'daily_activity');

-- 10. Verifică logs pentru erori (dacă sunt activate)
-- Caută în Supabase Dashboard -> Logs pentru mesaje de eroare

