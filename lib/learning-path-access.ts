import { isAdminFromDB } from "@/lib/admin-check"
import { createClient } from "@/lib/supabase/server"
import {
  PLAN_PROPERTY_PRIORITY,
  isPaidPlan,
  resolvePlanFromCandidates,
} from "@/lib/subscription-plan"

/**
 * Adminii și utilizatorii cu plan Plus/Premium văd itemii reali din
 * `learning_path_lesson_items` și preview-ul complet; ceilalți văd itemi placeholder.
 */
export async function canViewLearningPathContent(): Promise<boolean> {
  const supabase = await createClient()

  if (await isAdminFromDB(supabase)) {
    return true
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plus_months_remaining")
    .eq("user_id", user.id)
    .maybeSingle()

  const appMetadata = (user.app_metadata as Record<string, unknown>) ?? {}
  const candidates: unknown[] = [profile?.plan]

  PLAN_PROPERTY_PRIORITY.forEach((prop) => {
    candidates.push(appMetadata[prop])
  })

  const resolvedPlan = resolvePlanFromCandidates(candidates)
  const plusMonthsRemaining = Number(profile?.plus_months_remaining ?? 0)

  return isPaidPlan(resolvedPlan) || plusMonthsRemaining > 0
}
