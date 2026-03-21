-- Waitlist for Premium prelaunch (concurs end card + future sources).
-- Does not ALTER any existing application tables.

CREATE TABLE IF NOT EXISTS public.premium_prelaunch_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'contest_end_card',
  CONSTRAINT premium_prelaunch_signups_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_premium_prelaunch_signups_created_at
  ON public.premium_prelaunch_signups (created_at DESC);

COMMENT ON TABLE public.premium_prelaunch_signups IS
  'Users who opted in to be notified for Premium launch; one row per user.';

ALTER TABLE public.premium_prelaunch_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "premium_prelaunch_signups_select_own" ON public.premium_prelaunch_signups;
CREATE POLICY "premium_prelaunch_signups_select_own"
  ON public.premium_prelaunch_signups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "premium_prelaunch_signups_insert_own" ON public.premium_prelaunch_signups;
CREATE POLICY "premium_prelaunch_signups_insert_own"
  ON public.premium_prelaunch_signups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
