import { isAdminFromDB } from "@/lib/admin-check"
import { createClient } from "@/lib/supabase/server"

/**
 * Adminii (profiles.is_admin, sau fallback metadata/ADMIN_EMAILS) văd itemii reali
 * din `learning_path_lesson_items` și preview-ul complet; ceilalți văd itemi placeholder.
 */
export async function canViewLearningPathContent(): Promise<boolean> {
  const supabase = await createClient()
  return isAdminFromDB(supabase)
}
