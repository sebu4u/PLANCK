-- ============================================================
-- Admin Lessons & Chapters RLS Policies
-- Permite adminilor să INSERT și UPDATE pe tabelele chapters și lessons
-- Folosește funcția public.is_admin() (SECURITY DEFINER) pentru a evita
-- probleme de recursivitate RLS.
-- NU include DELETE - dezactivarea se face prin is_active = false.
-- ============================================================

-- ============================================================
-- CHAPTERS
-- ============================================================

-- Admin: SELECT toate capitolele (inclusiv inactive)
DROP POLICY IF EXISTS "admin_select_all_chapters" ON public.chapters;
CREATE POLICY "admin_select_all_chapters"
  ON public.chapters FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin: INSERT capitole noi
DROP POLICY IF EXISTS "admin_insert_chapters" ON public.chapters;
CREATE POLICY "admin_insert_chapters"
  ON public.chapters FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin: UPDATE orice capitol
DROP POLICY IF EXISTS "admin_update_chapters" ON public.chapters;
CREATE POLICY "admin_update_chapters"
  ON public.chapters FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- LESSONS
-- ============================================================

-- Admin: SELECT toate lecțiile (inclusiv inactive)
DROP POLICY IF EXISTS "admin_select_all_lessons" ON public.lessons;
CREATE POLICY "admin_select_all_lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin: INSERT lecții noi
DROP POLICY IF EXISTS "admin_insert_lessons" ON public.lessons;
CREATE POLICY "admin_insert_lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin: UPDATE orice lecție
DROP POLICY IF EXISTS "admin_update_lessons" ON public.lessons;
CREATE POLICY "admin_update_lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
