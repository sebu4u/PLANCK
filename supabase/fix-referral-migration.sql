-- Fix referral system migration issues
-- Run this if you get "Database error saving new user" errors

-- 1. First, drop the problematic trigger if it exists (from old migration)
DROP TRIGGER IF EXISTS on_profile_before_insert_set_referral ON public.profiles;

-- 2. Drop the old trigger function if it exists
DROP FUNCTION IF EXISTS set_referral_code_on_insert();

-- 3. Make sure the referral_code column allows NULL (no NOT NULL constraint)
-- This is safe to run even if already nullable
DO $$
BEGIN
  -- Check if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    -- Remove NOT NULL constraint if present
    ALTER TABLE public.profiles ALTER COLUMN referral_code DROP NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors (column might not have NOT NULL constraint)
  NULL;
END $$;

-- 4. Verify the handle_new_user function is correct (should not reference referral columns)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, nickname, grade)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'nickname', ''),
    coalesce(new.raw_user_meta_data ->> 'grade', null)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! The user creation trigger should now work correctly.
-- Referral codes will be generated lazily when users access their referral page.
