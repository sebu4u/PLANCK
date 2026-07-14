import type { SupabaseClient } from "@supabase/supabase-js"
import type { CodingProblem } from "@/components/coding-problems/types"
import { ALLOW_ALL_CODING_PROBLEMS } from "@/lib/access-config"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"
import { isPaidPlan, normalizeSubscriptionPlan } from "@/lib/subscription-plan"
import { resolvePlanForRequest } from "@/lib/subscription-plan-server"

export async function resolveCanAccessPremiumHints(
  supabase: SupabaseClient,
  accessToken?: string
): Promise<boolean> {
  const plan = await resolvePlanForRequest(supabase, accessToken)
  return isPaidPlan(plan)
}

export async function resolveCanAccessPremiumHintsFromSession(
  supabase: SupabaseClient
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plus_months_remaining")
    .eq("user_id", user.id)
    .maybeSingle()

  const resolvedPlan = normalizeSubscriptionPlan(profile?.plan)
  if (isPaidPlan(resolvedPlan)) return true
  return (profile?.plus_months_remaining ?? 0) > 0
}

export function applyCodingProblemPremiumGating(
  problem: CodingProblem,
  canAccessPremiumHints: boolean
): CodingProblem {
  return {
    ...problem,
    hint_1_markdown: problem.hint_1_markdown ?? null,
    hint_2_markdown: canAccessPremiumHints ? (problem.hint_2_markdown ?? null) : null,
    solution_markdown: canAccessPremiumHints ? (problem.solution_markdown ?? null) : null,
    canAccessPremiumHints,
  }
}

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
