import { isPaidPlan, normalizeSubscriptionPlan, type SubscriptionPlan } from "@/lib/subscription-plan"

export function canClaimPremiumPlanckPass(
  plan: unknown,
  plusMonthsRemaining: number | null | undefined,
): boolean {
  const normalized = normalizeSubscriptionPlan(plan)
  if (isPaidPlan(normalized)) return true
  return (plusMonthsRemaining ?? 0) > 0
}

export function effectivePlanForPass(
  plan: unknown,
  plusMonthsRemaining: number | null | undefined,
): SubscriptionPlan {
  if (canClaimPremiumPlanckPass(plan, plusMonthsRemaining)) {
    const n = normalizeSubscriptionPlan(plan)
    return isPaidPlan(n) ? n : "plus"
  }
  return "free"
}
