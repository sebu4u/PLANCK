import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabaseAdmin"
import {
  ENTITLED_SUBSCRIPTION_STATUS_LIST,
  hasEntitledSubscriptionStatus,
  hasPortalManagedSubscription,
} from "@/lib/stripe-subscription"
import {
  FREE_PLAN,
  PREMIUM_PLAN,
  normalizeSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/subscription-plan"
import { normalizeUserType } from "@/lib/user-types"
import type { ChildBillingSnapshot, ChildBillingSource } from "@/lib/parent/billing-types"

export type { ChildBillingSnapshot, ChildBillingSource } from "@/lib/parent/billing-types"

export class ParentChildBillingError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "ParentChildBillingError"
    this.code = code
    this.status = status
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isUuid = (value: string): boolean => UUID_RE.test(value)

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

type GrantRow = {
  parent_id: string
  child_id: string
  stripe_subscription_status: string | null
  current_period_end: string | null
}

const isGrantRow = (value: unknown): value is GrantRow => {
  if (typeof value !== "object" || value === null) return false
  const row = value as Record<string, unknown>
  return typeof row.parent_id === "string" && typeof row.child_id === "string"
}

export const childHasEntitledParentGrant = async (
  admin: SupabaseClient,
  childId: string
): Promise<boolean> => {
  const { data, error } = await admin
    .from("parent_child_subscriptions")
    .select("id")
    .eq("child_id", childId)
    .in("stripe_subscription_status", [...ENTITLED_SUBSCRIPTION_STATUS_LIST])
    .limit(1)

  if (error) {
    throw error
  }

  return (data?.length ?? 0) > 0
}

export const getParentManagedGrant = async (
  admin: SupabaseClient,
  parentId: string,
  childId: string
) => {
  const { data, error } = await admin
    .from("parent_child_subscriptions")
    .select(
      "id, parent_id, child_id, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, current_period_end"
    )
    .eq("parent_id", parentId)
    .eq("child_id", childId)
    .maybeSingle()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return data
}

export async function getChildrenBillingForParent(
  parentId: string,
  childIds: string[]
): Promise<Map<string, ChildBillingSnapshot>> {
  const result = new Map<string, ChildBillingSnapshot>()
  if (childIds.length === 0) return result

  const admin = createAdminClient()

  const [{ data: profiles }, { data: grantRows }] = await Promise.all([
    admin
      .from("profiles")
      .select("user_id, plan, plus_months_remaining, stripe_subscription_status, stripe_current_period_end")
      .in("user_id", childIds),
    admin
      .from("parent_child_subscriptions")
      .select("parent_id, child_id, stripe_subscription_status, current_period_end")
      .in("child_id", childIds),
  ])

  const profileById = new Map<string, Record<string, unknown>>()
  for (const row of profiles ?? []) {
    if (typeof row !== "object" || row === null) continue
    const userId = asString((row as { user_id?: unknown }).user_id)
    if (userId) profileById.set(userId, row as Record<string, unknown>)
  }

  const grants = (grantRows ?? []).filter(isGrantRow)

  for (const childId of childIds) {
    const profile = profileById.get(childId)
    const ownStatus = asString(profile?.stripe_subscription_status)
    const ownEntitled = hasEntitledSubscriptionStatus(ownStatus)
    const storedPlan = normalizeSubscriptionPlan(profile?.plan)
    const plusMonths =
      typeof profile?.plus_months_remaining === "number" ? profile.plus_months_remaining : 0

    const childGrants = grants.filter((grant) => grant.child_id === childId)
    const myGrant = childGrants.find(
      (grant) =>
        grant.parent_id === parentId &&
        hasEntitledSubscriptionStatus(grant.stripe_subscription_status)
    )
    const otherGrant = childGrants.find(
      (grant) =>
        grant.parent_id !== parentId &&
        hasEntitledSubscriptionStatus(grant.stripe_subscription_status)
    )

    let billing_source: ChildBillingSource = "none"
    let plan: SubscriptionPlan = storedPlan
    let current_period_end: string | null =
      typeof profile?.stripe_current_period_end === "string"
        ? profile.stripe_current_period_end
        : null
    let can_manage = false

    if (ownEntitled) {
      billing_source = "own"
      plan = storedPlan === FREE_PLAN ? PREMIUM_PLAN : storedPlan
    } else if (myGrant) {
      billing_source = "parent"
      plan = PREMIUM_PLAN
      can_manage = true
      current_period_end =
        typeof myGrant.current_period_end === "string" ? myGrant.current_period_end : null
    } else if (otherGrant) {
      billing_source = "other"
      plan = PREMIUM_PLAN
      current_period_end =
        typeof otherGrant.current_period_end === "string" ? otherGrant.current_period_end : null
    } else if (storedPlan === PREMIUM_PLAN) {
      billing_source = "other"
    } else if (storedPlan === FREE_PLAN && plusMonths > 0) {
      plan = "plus"
    }

    const can_purchase = billing_source === "none" && plan !== PREMIUM_PLAN

    result.set(childId, {
      plan,
      billing_source,
      current_period_end,
      can_manage,
      can_purchase,
    })
  }

  return result
}

export async function assertParentCanPurchaseForChild(parentId: string, childId: string) {
  if (!isUuid(childId)) {
    throw new ParentChildBillingError("invalid_child", "Copil invalid.")
  }

  const admin = createAdminClient()

  const { data: parentProfile } = await admin
    .from("profiles")
    .select("user_type")
    .eq("user_id", parentId)
    .maybeSingle()

  if (normalizeUserType(parentProfile?.user_type) !== "parinte") {
    throw new ParentChildBillingError(
      "not_parent",
      "Doar un părinte poate cumpăra Premium pentru un copil.",
      403
    )
  }

  const { data: relationship } = await admin
    .from("parent_child_relationships")
    .select("id, status")
    .eq("parent_id", parentId)
    .eq("child_id", childId)
    .eq("status", "active")
    .maybeSingle()

  if (!relationship) {
    throw new ParentChildBillingError(
      "not_linked",
      "Acest copil nu este conectat la contul tău."
    )
  }

  const { data: childProfile } = await admin
    .from("profiles")
    .select("user_type, plan, stripe_subscription_status")
    .eq("user_id", childId)
    .maybeSingle()

  if (!childProfile) {
    throw new ParentChildBillingError("child_missing", "Nu am găsit profilul copilului.")
  }

  if (normalizeUserType(childProfile.user_type) !== "elev") {
    throw new ParentChildBillingError(
      "not_student",
      "Poți cumpăra Premium doar pentru un cont de elev."
    )
  }

  if (hasEntitledSubscriptionStatus(childProfile.stripe_subscription_status)) {
    throw new ParentChildBillingError(
      "child_own_premium",
      "Copilul are deja un abonament Premium pe contul lui."
    )
  }

  if (normalizeSubscriptionPlan(childProfile.plan) === PREMIUM_PLAN) {
    throw new ParentChildBillingError(
      "child_already_premium",
      "Copilul are deja Premium."
    )
  }

  if (await childHasEntitledParentGrant(admin, childId)) {
    throw new ParentChildBillingError(
      "child_already_premium",
      "Copilul are deja Premium."
    )
  }

  const existingGrant = await getParentManagedGrant(admin, parentId, childId)
  if (
    existingGrant &&
    hasPortalManagedSubscription(asString(existingGrant.stripe_subscription_status)) &&
    asString(existingGrant.stripe_subscription_status) !== "incomplete_expired"
  ) {
    throw new ParentChildBillingError(
      "grant_exists",
      "Ai deja un abonament pentru acest copil. Gestionează-l din portal.",
      409
    )
  }
}

export async function assertParentCanManageChildGrant(parentId: string, childId: string) {
  if (!isUuid(childId)) {
    throw new ParentChildBillingError("invalid_child", "Copil invalid.")
  }

  const admin = createAdminClient()
  const grant = await getParentManagedGrant(admin, parentId, childId)
  const status = asString(grant?.stripe_subscription_status)

  if (!grant || !grant.stripe_subscription_id || !grant.stripe_customer_id) {
    throw new ParentChildBillingError(
      "grant_missing",
      "Nu există un abonament de gestionat pentru acest copil."
    )
  }

  if (!hasPortalManagedSubscription(status)) {
    throw new ParentChildBillingError(
      "grant_inactive",
      "Nu există un abonament activ de gestionat pentru acest copil."
    )
  }

  return {
    customerId: grant.stripe_customer_id as string,
    subscriptionId: grant.stripe_subscription_id as string,
  }
}
