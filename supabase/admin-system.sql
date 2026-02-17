-- ============================================================
-- Admin System Migration
-- Adaugă coloana is_admin în tabelul profiles
-- și configurează politicile RLS necesare
-- ============================================================

-- 1. Adaugă coloana is_admin (default false) dacă nu există deja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Creează un index pe is_admin pentru query-uri rapide
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin) WHERE is_admin = true;

-- 3. Funcție helper pentru RLS (SECURITY DEFINER = citește fără RLS, evită recursivitate)
-- Trebuie definită ÎNAINTE de politicile care o folosesc
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Politică RLS: Adminii pot citi TOATE profilurile
-- Folosim public.is_admin() în loc de EXISTS pe profiles, ca să nu mai fie RLS recursiv
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;
CREATE POLICY "admin_select_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 5. Politică RLS: Adminii pot actualiza TOATE profilurile
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
CREATE POLICY "admin_update_all_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Protejează coloana is_admin: userii normali nu pot seta is_admin = true
-- Userii normali NU pot seta is_admin = true pe propriul profil
-- Politica profiles_update_own existentă permite update doar pe propriul profil,
-- dar trebuie să ne asigurăm că is_admin nu poate fi schimbat de useri normali.
-- Acest lucru se face printr-un trigger:

CREATE OR REPLACE FUNCTION public.protect_admin_flag()
RETURNS trigger AS $$
BEGIN
  -- Blochează schimbarea is_admin doar pentru useri autentificați non-admin.
  -- În SQL Editor/auth.uid()=NULL permitem update-ul (bootstrap primul admin).
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_admin_flag_trigger ON public.profiles;
CREATE TRIGGER protect_admin_flag_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_flag();

-- ============================================================
-- NOTĂ: Pentru a seta un user ca admin, rulează manual în SQL Editor:
--
--   UPDATE public.profiles
--   SET is_admin = true
--   WHERE user_id = 'UUID-UL-USERULUI';
--
-- SAU după email:
--
--   UPDATE public.profiles
--   SET is_admin = true
--   WHERE user_id = (
--     SELECT id FROM auth.users WHERE email = 'email@exemplu.com'
--   );
-- ============================================================
