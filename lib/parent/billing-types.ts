import type { SubscriptionPlan } from "@/lib/subscription-plan"

export type ChildBillingSource = "own" | "parent" | "other" | "none"

export type ChildBillingSnapshot = {
  plan: SubscriptionPlan
  billing_source: ChildBillingSource
  current_period_end: string | null
  can_manage: boolean
  can_purchase: boolean
}
