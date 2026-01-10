import type { NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  FREE_PLAN,
  PLAN_PROPERTY_PRIORITY,
  SubscriptionPlan,
  resolvePlanFromCandidates,
} from "./subscription-plan"

export const parseAccessToken = (request: NextRequest) => {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization")
  if (!header) {
    return undefined
  }
  const [scheme, token] = header.split(" ")
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return undefined
  }
  return token
}

export const resolvePlanForRequest = async (
  supabase: SupabaseClient,
  accessToken?: string
): Promise<SubscriptionPlan> => {
  if (!accessToken) {
    return FREE_PLAN
  }

  try {
    const { data: userData } = await supabase.auth.getUser(accessToken)
    const user = userData?.user
    if (!user) {
      return FREE_PLAN
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plus_months_remaining")
      .eq("user_id", user.id)
      .maybeSingle()

    const metadata = (user.user_metadata as Record<string, unknown>) ?? {}
    const appMetadata = (user.app_metadata as Record<string, unknown>) ?? {}

    const candidates: unknown[] = [profile?.plan]
    PLAN_PROPERTY_PRIORITY.forEach((prop) => {
      candidates.push(metadata[prop])
    })
    PLAN_PROPERTY_PRIORITY.forEach((prop) => {
      candidates.push(appMetadata[prop])
    })

    const resolvedPlan = resolvePlanFromCandidates(candidates)

    // Check for referral rewards (override free plan if user has Plus months remaining)
    if (resolvedPlan === "free" && profile?.plus_months_remaining > 0) {
      return "plus"
    }

    return resolvedPlan
  } catch (error) {
    console.error("[subscription-plan] Failed to resolve plan:", error)
    return FREE_PLAN
  }
}

