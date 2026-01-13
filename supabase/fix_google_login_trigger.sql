-- Improvements for the handle_new_user trigger to support Google OAuth
-- This handles cases where metadata keys are different (e.g. Google uses 'full_name' or 'name')
-- and ensures robust profile creation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_referral_code TEXT;
  collision BOOLEAN;
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- 1. Extract name safely (Google often sends 'full_name' or 'name')
  user_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    ''
  );

  -- 2. Extract avatar if available
  user_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture',
    null
  );

  -- 3. Generate a unique referral code
  -- We use a loop to ensure uniqueness
  LOOP
    -- Generate 8-char random string (uppercase + numbers, excluding ambiguous chars like 0/O, 1/I)
    -- Using a simpler set for robustness
    new_referral_code := substr(md5(random()::text), 1, 8);
    
    -- Check for collision
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    ) INTO collision;
    
    EXIT WHEN NOT collision;
  END LOOP;

  -- 4. Insert into profiles with robust error handling
  INSERT INTO public.profiles (
    user_id, 
    name, 
    nickname, 
    user_icon,
    grade, 
    referral_code,
    plan,
    email
  )
  VALUES (
    new.id,
    user_name,
    user_name, -- Use name as default nickname
    user_avatar,
    coalesce(new.raw_user_meta_data ->> 'grade', null),
    new_referral_code,
    'free', -- Default plan
    new.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- If profile exists (rare race condition), update empty fields
    name = CASE WHEN public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
    user_icon = COALESCE(public.profiles.user_icon, EXCLUDED.user_icon),
    email = EXCLUDED.email;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction if possible, 
  -- OR re-raise with a clear message. 
  -- For auth, failing the trigger fails the signup, so we must be careful.
  -- We'll raise a clearer error for debugging.
  RAISE EXCEPTION 'Database error creating user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
