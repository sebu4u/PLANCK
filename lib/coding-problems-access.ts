import type { SupabaseClient } from "@supabase/supabase-js"
import { ALLOW_ALL_CODING_PROBLEMS } from "@/lib/access-config"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"
import { isPaidPlan } from "@/lib/subscription-plan"
import { resolvePlanForRequest } from "@/lib/subscription-plan-server"

export async function getActiveCodingProblemBySlug(supabase: SupabaseClient, slug: string) {
  return supabase.from("coding_problems").select("*").eq("slug", slug).eq("is_active", true).maybeSingle()
}

export async function isCodingProblemUnlocked(
  supabase: SupabaseClient,
  authedSupabase: SupabaseClient,
  accessToken: string | undefined,
  problemId: string
): Promise<{ ok: boolean; isFreeMonthly: boolean }> {
  const [monthlyFreeSet, userPlan] = await Promise.all([
    getMonthlyFreeProblemSet(supabase),
    resolvePlanForRequest(authedSupabase, accessToken),
  ])
  const isFreeMonthly = monthlyFreeSet.has(problemId)
  if (ALLOW_ALL_CODING_PROBLEMS || isPaidPlan(userPlan) || isFreeMonthly) {
    return { ok: true, isFreeMonthly }
  }
  return { ok: false, isFreeMonthly }
}
