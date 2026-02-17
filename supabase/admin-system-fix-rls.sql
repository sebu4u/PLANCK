-- ============================================================
-- REPARARE: Politicile RLS admin care foloseau EXISTS pe profiles
-- cauzau probleme la citirea propriului profil (plan plus, poza).
-- Înlocuim cu public.is_admin() (SECURITY DEFINER) ca să nu
-- mai existe evaluare RLS recursivă.
-- Rulează acest script o singură dată în Supabase SQL Editor.
-- ============================================================

-- 1. Asigură-te că funcția is_admin există (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Șterge politicile problematice și recreează-le folosind is_admin()
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;
CREATE POLICY "admin_select_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
CREATE POLICY "admin_update_all_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Repară trigger-ul de protecție is_admin pentru bootstrap din SQL Editor.
-- Dacă auth.uid() este NULL (SQL Editor/service context), permite schimbarea.
-- Dacă există user autentificat și nu e admin, blochează schimbarea is_admin.
CREATE OR REPLACE FUNCTION public.protect_admin_flag()
RETURNS trigger AS $$
BEGIN
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
