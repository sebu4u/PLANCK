-- ============================================
-- FIX: Reset problems_solved_today la începutul unei noi zile
-- ============================================

-- Modificăm funcția award_elo_for_problem pentru a reseta problems_solved_today
-- când last_activity_date este diferit de data de azi

CREATE OR REPLACE FUNCTION public.award_elo_for_problem(user_uuid uuid, problem_id_param text)
RETURNS void AS $$
DECLARE
  problem_difficulty text;
  elo_to_award integer;
  today_date date := current_date;
  current_problems_solved integer;
  new_activity_level integer;
  challenge_id uuid;
  challenge_bonus integer;
  challenge_completed boolean;
  last_activity date;
BEGIN
  -- Get problem difficulty (handle both text and uuid types)
  -- Try direct match first, then try casting
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
    RAISE NOTICE 'EROARE: Problem difficulty not found for problem_id: %', problem_id_param;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Problemă găsită: % cu dificultate: %', problem_id_param, problem_difficulty;
  
  -- Map difficulty to ELO (match EXACT cu valorile din problems)
  CASE problem_difficulty
    WHEN 'Ușor' THEN elo_to_award := 15;
    WHEN 'Mediu' THEN elo_to_award := 21;
    WHEN 'Avansat' THEN elo_to_award := 30;
    -- Fallback pentru alte variante posibile
    WHEN 'Easy' THEN elo_to_award := 15;
    WHEN 'Medium' THEN elo_to_award := 21;
    WHEN 'Hard' THEN elo_to_award := 30;
    WHEN 'Difficult' THEN elo_to_award := 30;
    ELSE 
      RAISE NOTICE 'ATENȚIE: Dificultate necunoscută "%". Folosim default 15 ELO.', problem_difficulty;
      elo_to_award := 15;
  END CASE;
  
  RAISE NOTICE 'ELO de acordat: %', elo_to_award;
  
  -- Initialize user_stats if not exists
  INSERT INTO public.user_stats (user_id, elo, rank)
  VALUES (user_uuid, 500, 'Bronze III')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get last_activity_date to check if we need to reset problems_solved_today
  SELECT last_activity_date INTO last_activity
  FROM public.user_stats
  WHERE user_id = user_uuid;
  
  -- Update user_stats: increment ELO, problems solved
  -- IMPORTANT: Reset problems_solved_today to 0 if last_activity_date is different from today
  -- Then increment it to 1 (so it becomes 1, not 0+1 from previous day)
  UPDATE public.user_stats
  SET elo = elo + elo_to_award,
      problems_solved_today = CASE 
        WHEN last_activity_date IS DISTINCT FROM today_date THEN 1
        ELSE problems_solved_today + 1
      END,
      problems_solved_total = problems_solved_total + 1,
      last_activity_date = today_date,
      updated_at = now()
  WHERE user_id = user_uuid;

  -- Daily challenge bonus: +bonus_elo only once per user per challenge
  BEGIN
    -- Find today's challenge that matches this problem
    SELECT id, bonus_elo
      INTO challenge_id, challenge_bonus
    FROM public.daily_challenges
    WHERE active_date = today_date
      AND problem_id::text = problem_id_param
    LIMIT 1;

    IF challenge_id IS NOT NULL THEN
      -- Check if user already marked this challenge as completed
      SELECT completed
        INTO challenge_completed
      FROM public.user_challenges
      WHERE user_id = user_uuid
        AND challenge_id = challenge_id
      LIMIT 1;

      IF challenge_completed IS DISTINCT FROM true THEN
        -- Mark challenge as completed for this user
        INSERT INTO public.user_challenges (user_id, challenge_id, completed, completed_at)
        VALUES (user_uuid, challenge_id, true, now())
        ON CONFLICT (user_id, challenge_id) DO UPDATE
          SET completed = true,
              completed_at = now();

        -- Award bonus ELO
        UPDATE public.user_stats
        SET elo = elo + COALESCE(challenge_bonus, 10),
            updated_at = now()
        WHERE user_id = user_uuid;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'EROARE non-critică în daily challenge bonus: %', SQLERRM;
  END;

  -- Non-critical: daily_activity, streak, badges.
  -- Orice eroare aici NU trebuie să anuleze update-ul de ELO de mai sus.
  BEGIN
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
    
    -- Check and award badges (already exists)
    PERFORM public.check_and_award_badges(user_uuid);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'EROARE non-critică în daily_activity/streak/badges: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

