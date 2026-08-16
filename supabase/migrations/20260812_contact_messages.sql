-- Public contact form messages (/contact).

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_name_len CHECK (char_length(name) BETWEEN 1 AND 120),
  CONSTRAINT contact_messages_email_len CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT contact_messages_subject_len CHECK (char_length(subject) BETWEEN 1 AND 80),
  CONSTRAINT contact_messages_message_len CHECK (char_length(message) BETWEEN 1 AND 5000)
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email
  ON public.contact_messages (email);

COMMENT ON TABLE public.contact_messages IS
  'Messages submitted from the public /contact form.';

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous and logged-in users may insert; no public SELECT.
DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
CREATE POLICY "contact_messages_insert_public"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users may read only their own messages (optional self-check).
DROP POLICY IF EXISTS "contact_messages_select_own" ON public.contact_messages;
CREATE POLICY "contact_messages_select_own"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
