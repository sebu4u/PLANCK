-- Public webinar signup leads (physics webinar landing page).

CREATE TABLE IF NOT EXISTS public.webinar_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clasa text NOT NULL,
  nota_tintita text NOT NULL,
  metoda_pregatire text NOT NULL,
  provocare text NOT NULL,
  instrument_ideal text NOT NULL,
  email text NOT NULL,
  telefon text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webinar_leads_created_at
  ON public.webinar_leads (created_at DESC);

COMMENT ON TABLE public.webinar_leads IS
  'Signups for the free physics webinar; inserted from the public /gratuit form.';

ALTER TABLE public.webinar_leads ENABLE ROW LEVEL SECURITY;

-- Anonymous and logged-in users may insert (marketing form); no public SELECT.
DROP POLICY IF EXISTS "webinar_leads_insert_public" ON public.webinar_leads;
CREATE POLICY "webinar_leads_insert_public"
  ON public.webinar_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
