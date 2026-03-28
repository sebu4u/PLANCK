import { isAdminFromDB } from "@/lib/admin-check"
import { createClient } from "@/lib/supabase/server"

export async function canViewLearningPathContent(): Promise<boolean> {
  const supabase = await createClient()
  return isAdminFromDB(supabase)
}
