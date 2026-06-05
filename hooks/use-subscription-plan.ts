import { useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  SubscriptionPlan,
  normalizeSubscriptionPlan,
} from "@/lib/subscription-plan"

export function useSubscriptionPlan() {
  const { profile, subscriptionPlan } = useAuth()

  const resolvedPlan = useMemo<SubscriptionPlan>(() => {
    const planFromProfile = normalizeSubscriptionPlan(profile?.plan ?? subscriptionPlan)

    if (planFromProfile === "free" && (profile?.plus_months_remaining ?? 0) > 0) {
      return "plus"
    }

    return planFromProfile
  }, [subscriptionPlan, profile?.plan, profile?.plus_months_remaining])

  return {
    plan: resolvedPlan,
    isFree: resolvedPlan === "free",
    isPlus: resolvedPlan === "plus",
    isPremium: resolvedPlan === "premium",
    isPaid: resolvedPlan === "plus" || resolvedPlan === "premium",
  }
}
