-- ============================================
-- Script complet pentru a repara sistemul ELO
-- Rulează acest script în Supabase SQL Editor
-- ============================================

-- 1. Actualizare funcție get_rank_from_elo() cu distribuție progresivă
CREATE OR REPLACE FUNCTION public.get_rank_from_elo(elo_value integer)
RETURNS text AS $$
BEGIN
  IF elo_value < 833 THEN RETURN 'Bronze III';
  ELSIF elo_value < 1166 THEN RETURN 'Bronze II';
  ELSIF elo_value < 1500 THEN RETURN 'Bronze I';
  ELSIF elo_value < 2000 THEN RETURN 'Silver III';
  ELSIF elo_value < 2500 THEN RETURN 'Silver II';
  ELSIF elo_value < 3000 THEN RETURN 'Silver I';
  ELSIF elo_value < 3667 THEN RETURN 'Gold III';
  ELSIF elo_value < 4334 THEN RETURN 'Gold II';
  ELSIF elo_value < 5000 THEN RETURN 'Gold I';
  ELSIF elo_value < 5833 THEN RETURN 'Platinum III';
  ELSIF elo_value < 6666 THEN RETURN 'Platinum II';
  ELSIF elo_value < 7500 THEN RETURN 'Platinum I';
  ELSIF elo_value < 8667 THEN RETURN 'Diamond III';
  ELSIF elo_value < 9834 THEN RETURN 'Diamond II';
  ELSIF elo_value < 11000 THEN RETURN 'Diamond I';
  ELSIF elo_value < 12333 THEN RETURN 'Masters III';
  ELSIF elo_value < 13666 THEN RETURN 'Masters II';
  ELSIF elo_value < 15000 THEN RETURN 'Masters I';
  ELSIF elo_value < 16500 THEN RETURN 'Ascendant';
  ELSE RETURN 'Singularity';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Creare/Actualizare funcție award_elo_for_problem()
CREATE OR REPLACE FUNCTION public.award_elo_for_problem(user_uuid uuid, problem_id_param text)
RETURNS void AS $$
DECLARE
  problem_difficulty text;
  elo_to_award integer;
  today_date date := current_date;
  current_problems_solved integer;
  new_activity_level integer;
BEGIN
  -- Log începutul execuției
  RAISE NOTICE 'award_elo_for_problem called for user: %, problem: %', user_uuid, problem_id_param;
  
  -- Get problem difficulty (handle both text and uuid types)
  BEGIN
    SELECT difficulty INTO problem_difficulty
    FROM public.problems
    WHERE id::text = problem_id_param
    LIMIT 1;
    
    -- If not found, try uuid cast
    IF problem_difficulty IS NULL THEN
      SELECT difficulty INTO problem_difficulty
      FROM public.problems
      WHERE id = problem_id_param::uuid
      LIMIT 1;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If uuid cast fails, try text match only
      SELECT difficulty INTO problem_difficulty
      FROM public.problems
      WHERE id::text = problem_id_param
      LIMIT 1;
  END;
  
  -- If problem difficulty not found, log and return
  IF problem_difficulty IS NULL THEN
    RAISE WARNING 'Problem not found with id: %. Cannot award ELO.', problem_id_param;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Problem found with difficulty: %', problem_difficulty;
  
  -- Map difficulty to ELO
  CASE problem_difficulty
    WHEN 'Ușor' THEN elo_to_award := 15;
    WHEN 'Mediu' THEN elo_to_award := 21;
    WHEN 'Avansat' THEN elo_to_award := 30;
    ELSE elo_to_award := 15; -- Default to easy if unknown
  END CASE;
  
  RAISE NOTICE 'ELO to award: %', elo_to_award;
  
  -- Initialize user_stats if not exists
  INSERT INTO public.user_stats (user_id, elo, rank)
  VALUES (user_uuid, 500, 'Bronze III')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update user_stats: increment ELO, problems solved
  UPDATE public.user_stats
  SET elo = elo + elo_to_award,
      problems_solved_today = problems_solved_today + 1,
      problems_solved_total = problems_solved_total + 1,
      updated_at = now()
  WHERE user_id = user_uuid;
  
  RAISE NOTICE 'user_stats updated for user: %', user_uuid;
  
  -- Update or insert daily_activity
  INSERT INTO public.daily_activity (user_id, activity_date, problems_solved, time_minutes, activity_level)
  VALUES (user_uuid, today_date, 1, 0, 1)
  ON CONFLICT (user_id, activity_date) DO UPDATE
  SET problems_solved = daily_activity.problems_solved + 1,
      updated_at = now();
  
  -- Calculate activity_level based on updated problems_solved (0-4 scale)
  SELECT problems_solved INTO current_problems_solved
  FROM public.daily_activity
  WHERE user_id = user_uuid AND activity_date = today_date;
  
  IF current_problems_solved >= 5 THEN
    new_activity_level := 4;
  ELSIF current_problems_solved >= 3 THEN
    new_activity_level := 3;
  ELSIF current_problems_solved >= 2 THEN
    new_activity_level := 2;
  ELSIF current_problems_solved >= 1 THEN
    new_activity_level := 1;
  ELSE
    new_activity_level := 0;
  END IF;
  
  -- Update activity_level
  UPDATE public.daily_activity
  SET activity_level = new_activity_level
  WHERE user_id = user_uuid AND activity_date = today_date;
  
  -- Update streak
  PERFORM public.update_user_streak(user_uuid);
  
  -- Check and award badges
  PERFORM public.check_and_award_badges(user_uuid);
  
  RAISE NOTICE 'award_elo_for_problem completed successfully for user: %', user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Creare/Actualizare trigger handle_problem_solved()
CREATE OR REPLACE FUNCTION public.handle_problem_solved()
RETURNS trigger AS $$
BEGIN
  RAISE NOTICE 'Trigger on_problem_solved fired for user: %, problem: %', NEW.user_id, NEW.problem_id;
  
  -- Acordă ELO pentru problema rezolvată
  PERFORM public.award_elo_for_problem(NEW.user_id, NEW.problem_id::text);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error in handle_problem_solved: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreează trigger-ul
DROP TRIGGER IF EXISTS on_problem_solved ON public.solved_problems;
CREATE TRIGGER on_problem_solved
  AFTER INSERT ON public.solved_problems
  FOR EACH ROW EXECUTE FUNCTION public.handle_problem_solved();

-- 5. Actualizează rank-urile existente pentru toți utilizatorii
UPDATE public.user_stats
SET rank = public.get_rank_from_elo(elo),
    updated_at = now()
WHERE rank != public.get_rank_from_elo(elo);

-- 6. Activează Realtime pentru tabele necesare
-- Șterge tabelele din publicație dacă există deja, apoi le adaugă din nou
DO $$
BEGIN
  -- Încearcă să ștergi tabela din publicație (ignoră eroarea dacă nu există)
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.user_stats;
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
  
  -- Adaugă tabela în publicație
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;
  
  -- Același proces pentru daily_activity
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.daily_activity;
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
  
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_activity;
  
  RAISE NOTICE 'Realtime enabled for user_stats and daily_activity';
END $$;

-- 7. Verificare finală
SELECT 'Setup complete!' as status,
       COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname = 'on_problem_solved';

-- 8. Afișează utilizatorii cu ELO
SELECT user_id, elo, rank, problems_solved_total, updated_at
FROM user_stats
ORDER BY elo DESC
LIMIT 10;

