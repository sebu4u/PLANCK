import { useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  PLAN_PROPERTY_PRIORITY,
  SubscriptionPlan,
  resolvePlanFromCandidates,
} from "@/lib/subscription-plan"

export function useSubscriptionPlan() {
  const { user, profile, subscriptionPlan } = useAuth()

  const resolvedPlan = useMemo<SubscriptionPlan>(() => {
    const candidates: unknown[] = [subscriptionPlan, profile?.plan]

    const metadata = (user?.user_metadata as Record<string, unknown>) ?? {}
    const appMetadata = (user?.app_metadata as Record<string, unknown>) ?? {}

    PLAN_PROPERTY_PRIORITY.forEach((prop) => {
      candidates.push(metadata[prop])
    })
    PLAN_PROPERTY_PRIORITY.forEach((prop) => {
      candidates.push(appMetadata[prop])
    })

    return resolvePlanFromCandidates(candidates)
  }, [subscriptionPlan, profile?.plan, user])

  return {
    plan: resolvedPlan,
    isFree: resolvedPlan === "free",
    isPlus: resolvedPlan === "plus",
    isPremium: resolvedPlan === "premium",
    isPaid: resolvedPlan === "plus" || resolvedPlan === "premium",
  }
}

