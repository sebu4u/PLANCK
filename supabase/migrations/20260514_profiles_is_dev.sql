-- ============================================================
-- Dev flag on profiles (dashboard dev separat)
-- Setare manuală în SQL Editor / service role, sau de către admin din app.
-- ============================================================

-- 1. Coloană is_dev
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_dev'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_dev boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_dev ON public.profiles (is_dev) WHERE is_dev = true;

-- 2. Helper RLS / politici viitoare (mirror is_admin)
CREATE OR REPLACE FUNCTION public.is_dev()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND is_dev = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Userii non-admin nu pot modifica is_dev (adminii pot; SQL Editor cu auth.uid() null poate totul)
CREATE OR REPLACE FUNCTION public.protect_dev_flag()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.is_dev := OLD.is_dev;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_dev_flag_trigger ON public.profiles;
CREATE TRIGGER protect_dev_flag_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_dev_flag();

-- Exemplu promovare dev (rulezi tu în SQL Editor):
--
--   UPDATE public.profiles
--   SET is_dev = true
--   WHERE user_id = 'UUID-UL-USERULUI';
--
--   UPDATE public.profiles
--   SET is_dev = true
--   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email@exemplu.com');
