-- Contest Registration System
-- Stores registrations for Concursul Național de Fizică PLANCK

-- Create contest_registrations table
CREATE TABLE IF NOT EXISTS public.contest_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  school text NOT NULL,
  grade text NOT NULL CHECK (grade IN ('IX', 'X', 'XI', 'XII')),
  contest_code text NOT NULL UNIQUE,
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on contest_code for fast lookups during contest
CREATE INDEX IF NOT EXISTS idx_contest_registrations_code ON public.contest_registrations(contest_code);

-- Create index on user_id for profile queries
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user ON public.contest_registrations(user_id);

-- Enable RLS
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own registration
DROP POLICY IF EXISTS "contest_registrations_select_own" ON public.contest_registrations;
CREATE POLICY "contest_registrations_select_own"
  ON public.contest_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registration
DROP POLICY IF EXISTS "contest_registrations_insert_own" ON public.contest_registrations;
CREATE POLICY "contest_registrations_insert_own"
  ON public.contest_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate unique contest code
CREATE OR REPLACE FUNCTION generate_contest_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase)
    v_code := 'CNF' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM public.contest_registrations WHERE contest_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Comments
COMMENT ON TABLE public.contest_registrations IS 'Stores participant registrations for Concursul Național de Fizică PLANCK';
COMMENT ON COLUMN public.contest_registrations.contest_code IS 'Unique 8-character code (CNF + 5 chars) for contest access';
COMMENT ON COLUMN public.contest_registrations.grade IS 'Student grade level: IX, X, XI, or XII';
