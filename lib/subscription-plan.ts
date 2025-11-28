export type SubscriptionPlan = "free" | "plus" | "premium"

export const FREE_PLAN: SubscriptionPlan = "free"
export const PLUS_PLAN: SubscriptionPlan = "plus"
export const PREMIUM_PLAN: SubscriptionPlan = "premium"

export const PLAN_PROPERTY_PRIORITY = ["plan", "plan_tier", "planTier", "subscription_plan"] as const

const NORMALIZED_VALUES: Record<string, SubscriptionPlan> = {
  free: FREE_PLAN,
  "free_plan": FREE_PLAN,
  "free-tier": FREE_PLAN,
  gratuit: FREE_PLAN,
  basic: FREE_PLAN,
  plus: PLUS_PLAN,
  "plus+": PLUS_PLAN,
  "plus_plus": PLUS_PLAN,
  premium: PREMIUM_PLAN,
  pro: PREMIUM_PLAN,
}

export const normalizeSubscriptionPlan = (value: unknown): SubscriptionPlan => {
  if (typeof value !== "string") {
    return FREE_PLAN
  }

  const key = value.trim().toLowerCase()
  return NORMALIZED_VALUES[key] ?? FREE_PLAN
}

export const resolvePlanFromCandidates = (candidates: unknown[]): SubscriptionPlan => {
  const found = candidates.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0)
  return normalizeSubscriptionPlan(found)
}

export const isPaidPlan = (plan: SubscriptionPlan) => plan === PLUS_PLAN || plan === PREMIUM_PLAN

/**
 * TEMPORARY FEATURE FLAG: Allow free plan users and unauthenticated users to access all problems
 * 
 * Set this to `true` to temporarily grant:
 * - Free plan users access to the entire problem catalog (physics and coding problems)
 * - Unauthenticated users access to the entire problem catalog
 * 
 * Set this to `false` to restore the original behavior:
 * - Free users only get 50 problems/month (from monthly rotation)
 * - Unauthenticated users have no access
 * 
 * To revert to the original implementation:
 * 1. Set FREE_PLAN_FULL_ACCESS to `false`
 * 2. The system will automatically restore the original access restrictions
 */
export const FREE_PLAN_FULL_ACCESS = true

