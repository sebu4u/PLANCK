-- Fix Referral Code Generation Logic
-- 1. Ensure generate_referral_code function exists (idempotent)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the handle_new_user trigger function to populate referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_referral_code TEXT;
  collision BOOLEAN;
BEGIN
  -- Generate a unique referral code
  LOOP
    new_referral_code := generate_referral_code();
    
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    ) INTO collision;
    
    EXIT WHEN NOT collision;
  END LOOP;

  INSERT INTO public.profiles (user_id, name, nickname, grade, referral_code)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'nickname', ''),
    coalesce(new.raw_user_meta_data ->> 'grade', null),
    new_referral_code -- Insert the generated code
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill missing referral codes for existing users
DO $$
DECLARE
  profile_record RECORD;
  new_code TEXT;
  collision BOOLEAN;
BEGIN
  FOR profile_record IN SELECT user_id FROM public.profiles WHERE referral_code IS NULL LOOP
    
    -- Generate unique code for this user
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE referral_code = new_code
      ) INTO collision;
      EXIT WHEN NOT collision;
    END LOOP;

    -- Update the user profile
    UPDATE public.profiles 
    SET referral_code = new_code 
    WHERE user_id = profile_record.user_id;
    
  END LOOP;
END $$;
