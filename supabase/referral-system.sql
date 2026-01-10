-- Referral/Affiliate Link System for Planck
-- Allows users to invite friends and earn Plus+ months
-- IMPORTANT: Run this AFTER the profiles table is created and the handle_new_user trigger exists

-- Add referral_code column to profiles (unique 8-character code)
-- Using NULL default so the existing trigger doesn't break
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT;
  END IF;
END $$;

-- Add unique constraint separately (only if column exists and constraint doesn't)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referral_code_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Constraint might already exist under a different name, ignore
  NULL;
END $$;

-- Add plus_months_remaining to track earned Plus+ months
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plus_months_remaining'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plus_months_remaining INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add referred_by to track who referred this user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by UUID;
  END IF;
END $$;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  credited BOOLEAN DEFAULT FALSE,
  credited_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (referrer_id = (SELECT auth.uid()) OR referred_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "referrals_insert_all" ON public.referrals;
CREATE POLICY "referrals_insert_all"
  ON public.referrals FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Function to generate unique referral code (8 characters, alphanumeric without confusing chars)
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

-- Function to ensure referral code is set (can be called after profile creation)
CREATE OR REPLACE FUNCTION ensure_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_existing TEXT;
BEGIN
  -- Check if already has a code
  SELECT referral_code INTO v_existing FROM public.profiles WHERE user_id = p_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Generate a new unique code
  v_code := generate_referral_code();
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code) LOOP
    v_code := generate_referral_code();
  END LOOP;

  -- Update the profile
  UPDATE public.profiles SET referral_code = v_code WHERE user_id = p_user_id;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate referral codes for existing profiles that don't have one
DO $$
DECLARE
  profile_record RECORD;
  new_code TEXT;
BEGIN
  FOR profile_record IN SELECT user_id FROM public.profiles WHERE referral_code IS NULL LOOP
    new_code := generate_referral_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) LOOP
      new_code := generate_referral_code();
    END LOOP;
    UPDATE public.profiles SET referral_code = new_code WHERE user_id = profile_record.user_id;
  END LOOP;
END $$;

-- Function to process a referral and credit the referrer
CREATE OR REPLACE FUNCTION process_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
BEGIN
  -- Get the referrer's user_id from their referral code
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Don't allow self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, credited, credited_at)
  VALUES (v_referrer_id, p_referred_user_id, true, now())
  RETURNING id INTO v_referral_id;

  -- Update referred user's profile with referrer info
  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE user_id = p_referred_user_id;

  -- Credit the referrer with 1 extra month of Plus+
  UPDATE public.profiles
  SET plus_months_remaining = COALESCE(plus_months_remaining, 0) + 1
  WHERE user_id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

-- Add comments
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique 8-character referral code for affiliate links';
COMMENT ON COLUMN public.profiles.plus_months_remaining IS 'Number of Plus+ months earned through referrals';
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID of who referred this user';
COMMENT ON TABLE public.referrals IS 'Tracks referral relationships and credit status';
