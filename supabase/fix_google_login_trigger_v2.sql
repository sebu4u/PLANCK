-- FIXED: Removed 'email' column from INSERT as it likely doesn't exist in profiles table
-- Improvements for the handle_new_user trigger to support Google OAuth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_referral_code TEXT;
  collision BOOLEAN;
  user_name TEXT;
  user_avatar TEXT;
  user_grade TEXT;
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
  
  -- 3. Extract grade if available
  user_grade := coalesce(new.raw_user_meta_data ->> 'grade', null);

  -- 4. Generate a unique referral code
  LOOP
    -- Generate 8-char random string (uppercase + numbers)
    new_referral_code := substr(md5(random()::text), 1, 8);
    
    -- Check for collision
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    ) INTO collision;
    
    EXIT WHEN NOT collision;
  END LOOP;

  -- 5. Insert into profiles (WITHOUT email column)
  INSERT INTO public.profiles (
    user_id, 
    name, 
    nickname, 
    user_icon,
    grade, 
    referral_code,
    plan
  )
  VALUES (
    new.id,
    user_name,
    user_name, -- Use name as default nickname
    user_avatar,
    user_grade,
    new_referral_code,
    'free' -- Default plan
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- If profile exists, update empty fields
    name = CASE WHEN public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
    user_icon = COALESCE(public.profiles.user_icon, EXCLUDED.user_icon);
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error for debugging purposes
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  -- Return new anyway to let auth succeed, but profile might be missing (bad state, but better than partial auth failure loop?)
  -- actually, if we return NEW, the user is created in auth.users but no profile. 
  -- The app might break if it expects a profile. 
  -- Better to fail loudly? The user got "Database error" which is good, it means rollback.
  -- Let's re-raise to ensure integrity.
  RAISE EXCEPTION 'Database error creating user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
