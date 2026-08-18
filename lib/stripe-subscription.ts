import "server-only"

import type Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

import {
  getStripeMode,
  getStripePrices,
  resolvePlanFromPriceId,
  resolveStripeModeFromLivemode,
  type StripeMode,
} from "@/lib/stripe-config"
import {
  FREE_PLAN,
  PREMIUM_PLAN,
  normalizeSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/subscription-plan"

export const PARENT_FOR_CHILD_PURCHASE_TYPE = "parent_for_child"

export const ENTITLED_SUBSCRIPTION_STATUS_LIST = ["active", "trialing", "past_due"] as const
export const PORTAL_MANAGED_SUBSCRIPTION_STATUS_LIST = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
  "incomplete_expired",
] as const

const ENTITLED_SUBSCRIPTION_STATUSES = new Set<string>(ENTITLED_SUBSCRIPTION_STATUS_LIST)
const PORTAL_MANAGED_SUBSCRIPTION_STATUSES = new Set<string>(
  PORTAL_MANAGED_SUBSCRIPTION_STATUS_LIST
)

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

export const resolveCustomerId = (
  customer: Stripe.Invoice["customer"] | Stripe.Subscription["customer"] | Stripe.Checkout.Session["customer"]
) => {
  if (!customer) return null
  return typeof customer === "string" ? customer : customer.id
}

export const hasEntitledSubscriptionStatus = (status: string | null | undefined) => {
  if (!status) return false
  return ENTITLED_SUBSCRIPTION_STATUSES.has(status)
}

export const hasPortalManagedSubscription = (status: string | null | undefined) => {
  if (!status) return false
  return PORTAL_MANAGED_SUBSCRIPTION_STATUSES.has(status)
}

const stripeErrorCode = (error: unknown): string => {
  if (!error || typeof error !== "object" || !("code" in error)) return ""
  return String(error.code)
}

const stripeErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== "object" || !("message" in error)) return ""
  return String(error.message)
}

export const isStripeMissingResourceError = (error: unknown): boolean => {
  const code = stripeErrorCode(error)
  const message = stripeErrorMessage(error)
  return (
    code === "resource_missing" ||
    /no such (customer|subscription|invoice|price|product)/i.test(message)
  )
}

export const isStripeMissingCustomerError = (error: unknown): boolean => {
  return /no such customer/i.test(stripeErrorMessage(error))
}

const isMissingRelationError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false
  const code = error.code ?? ""
  const message = (error.message ?? "").toLowerCase()
  return (
    code === "42P01" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  )
}

export type StripePurchaseMetadata = {
  purchaseType: string | null
  payerUserId: string | null
  beneficiaryUserId: string | null
  userId: string | null
}

export const parseStripePurchaseMetadata = (
  metadata?: Stripe.Metadata | null
): StripePurchaseMetadata => {
  const purchaseType = metadata?.purchase_type?.trim() || null
  const payerUserId = metadata?.payer_user_id?.trim() || null
  const beneficiaryUserId = metadata?.beneficiary_user_id?.trim() || null
  const userId = metadata?.user_id?.trim() || null
  return { purchaseType, payerUserId, beneficiaryUserId, userId }
}

export const isParentForChildPurchase = (metadata?: Stripe.Metadata | null) => {
  const parsed = parseStripePurchaseMetadata(metadata)
  const payer = parsed.payerUserId || parsed.userId
  return (
    parsed.purchaseType === PARENT_FOR_CHILD_PURCHASE_TYPE &&
    Boolean(parsed.beneficiaryUserId) &&
    Boolean(payer) &&
    parsed.beneficiaryUserId !== payer
  )
}

export const findStripeCustomerIdForUser = async ({
  stripe,
  userId,
  email,
}: {
  stripe: Stripe
  userId: string
  email?: string | null
}) => {
  if (!email) return null

  const customers = await stripe.customers.list({
    email,
    limit: 10,
  })

  return customers.data.find((customer) => customer.metadata?.user_id === userId)?.id ?? customers.data[0]?.id ?? null
}

export const getOrCreateStripeCustomerId = async ({
  stripe,
  userId,
  email,
  existingCustomerId,
}: {
  stripe: Stripe
  userId: string
  email?: string | null
  existingCustomerId?: string | null
}) => {
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId)
      if ("deleted" in customer && customer.deleted) {
        // Deleted customers cannot be used for new checkout sessions.
      } else {
        return existingCustomerId
      }
    } catch (error) {
      if (!isStripeMissingCustomerError(error)) {
        throw error
      }
    }
  }

  const matchedCustomerId = await findStripeCustomerIdForUser({
    stripe,
    userId,
    email,
  })

  if (matchedCustomerId) {
    await stripe.customers.update(matchedCustomerId, {
      email: email || undefined,
      metadata: {
        user_id: userId,
      },
    })
    return matchedCustomerId
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      user_id: userId,
    },
  })

  return customer.id
}

const subscriptionPeriodEnd = (subscription: Stripe.Subscription): string | null => {
  const rawCurrentPeriodEnd =
    (subscription as Stripe.Subscription & { current_period_end?: number | null }).current_period_end ??
    subscription.items.data[0]?.current_period_end ??
    null
  return rawCurrentPeriodEnd ? new Date(rawCurrentPeriodEnd * 1000).toISOString() : null
}

const grantPremiumWorkshopEnergy = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) => {
  const { error: energyError } = await supabase.rpc("grant_premium_workshop_energy_upgrade", {
    p_user_id: userId,
  })
  if (energyError) {
    console.error("[stripe] Failed to grant premium workshop energy:", energyError.message)
  }
}

export const recomputeUserEntitlement = async (userId: string, mode?: StripeMode) => {
  const supabase = getSupabaseAdmin()
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, plus_months_remaining, stripe_subscription_status, stripe_price_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (profileError) {
    throw new Error(`[stripe] Failed to load profile for entitlement: ${profileError.message}`)
  }
  if (!profile) return

  const previousPlan = normalizeSubscriptionPlan(profile.plan)
  const plusMonths =
    typeof profile.plus_months_remaining === "number" ? profile.plus_months_remaining : 0

  let nextPlan: SubscriptionPlan = FREE_PLAN
  const ownEntitled = hasEntitledSubscriptionStatus(profile.stripe_subscription_status)

  if (ownEntitled) {
    const prices = getStripePrices(mode ?? getStripeMode())
    const ownPlan = resolvePlanFromPriceId(profile.stripe_price_id, prices)
    if (ownPlan) {
      nextPlan = ownPlan
    } else if (previousPlan === "plus" || previousPlan === "premium") {
      nextPlan = previousPlan
    } else {
      nextPlan = PREMIUM_PLAN
    }
  }

  if (nextPlan !== PREMIUM_PLAN) {
    const { data: grants, error: grantsError } = await supabase
      .from("parent_child_subscriptions")
      .select("id")
      .eq("child_id", userId)
      .in("stripe_subscription_status", [...ENTITLED_SUBSCRIPTION_STATUS_LIST])
      .limit(1)

    if (grantsError) {
      if (!isMissingRelationError(grantsError)) {
        throw new Error(`[stripe] Failed to load parent-child grants: ${grantsError.message}`)
      }
      console.warn("[stripe] parent_child_subscriptions table missing; skipping grant lookup.")
    } else if ((grants?.length ?? 0) > 0) {
      nextPlan = PREMIUM_PLAN
    }
  }

  if (nextPlan === FREE_PLAN && plusMonths > 0) {
    nextPlan = "plus"
  }

  if (nextPlan === previousPlan) return

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan: nextPlan })
    .eq("user_id", userId)

  if (updateError) {
    throw new Error(`[stripe] Failed to recompute entitlement: ${updateError.message}`)
  }

  if (nextPlan === PREMIUM_PLAN && previousPlan !== PREMIUM_PLAN) {
    await grantPremiumWorkshopEnergy(supabase, userId)
  }
}

const upsertParentChildGrant = async ({
  parentId,
  childId,
  customerId,
  subscription,
  mode,
}: {
  parentId: string
  childId: string
  customerId: string | null
  subscription: Stripe.Subscription
  mode?: StripeMode
}) => {
  const supabase = getSupabaseAdmin()
  const effectiveMode = mode ?? resolveStripeModeFromLivemode(subscription.livemode)
  const prices = getStripePrices(effectiveMode)
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const plan = resolvePlanFromPriceId(priceId, prices)
  const status = subscription.status
  const currentPeriodEnd = subscriptionPeriodEnd(subscription)

  const { data: existingByPair } = await supabase
    .from("parent_child_subscriptions")
    .select("id, stripe_customer_id")
    .eq("parent_id", parentId)
    .eq("child_id", childId)
    .maybeSingle()

  const payload = {
    parent_id: parentId,
    child_id: childId,
    stripe_customer_id: customerId || existingByPair?.stripe_customer_id || "",
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    stripe_subscription_status: status,
    plan: plan ?? (hasEntitledSubscriptionStatus(status) ? PREMIUM_PLAN : null),
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  }

  if (existingByPair?.id) {
    const { error } = await supabase
      .from("parent_child_subscriptions")
      .update(payload)
      .eq("id", existingByPair.id)
    if (error) {
      throw new Error(`[stripe] Failed to update parent-child grant: ${error.message}`)
    }
    return
  }

  const { error } = await supabase.from("parent_child_subscriptions").insert(payload)
  if (error) {
    throw new Error(`[stripe] Failed to insert parent-child grant: ${error.message}`)
  }
}

export const updateProfileFromSubscription = async (
  subscription: Stripe.Subscription,
  customerId: string | null,
  userId?: string | null,
  mode?: StripeMode
) => {
  if (isParentForChildPurchase(subscription.metadata)) {
    throw new Error("[stripe] parent_for_child subscriptions must use applyStripeSubscription")
  }

  const supabase = getSupabaseAdmin()

  const effectiveMode = mode ?? resolveStripeModeFromLivemode(subscription.livemode)
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const status = subscription.status
  const currentPeriodEnd = subscriptionPeriodEnd(subscription)

  const updatePayload: Record<string, unknown> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    stripe_subscription_status: status,
    stripe_current_period_end: currentPeriodEnd,
  }

  let targetUserId: string | null = userId ?? null

  if (userId) {
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          ...updatePayload,
        },
        { onConflict: "user_id" }
      )
    if (error) {
      throw new Error(`[stripe] Failed to update profile by user ID: ${error.message}`)
    }
  } else if (customerId) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()
    targetUserId = typeof existing?.user_id === "string" ? existing.user_id : null

    const { error } = await supabase.from("profiles").update(updatePayload).eq("stripe_customer_id", customerId)
    if (error) {
      throw new Error(`[stripe] Failed to update profile by customer ID: ${error.message}`)
    }
  }

  if (targetUserId) {
    await recomputeUserEntitlement(targetUserId, effectiveMode)
  }
}

export const applyStripeSubscription = async (
  subscription: Stripe.Subscription,
  customerId: string | null,
  fallbackUserId?: string | null,
  mode?: StripeMode
) => {
  const effectiveMode = mode ?? resolveStripeModeFromLivemode(subscription.livemode)
  const parsed = parseStripePurchaseMetadata(subscription.metadata)

  if (isParentForChildPurchase(subscription.metadata)) {
    const parentId = parsed.payerUserId || parsed.userId
    const childId = parsed.beneficiaryUserId
    if (!parentId || !childId) {
      throw new Error("[stripe] parent_for_child subscription is missing payer or beneficiary")
    }
    await upsertParentChildGrant({
      parentId,
      childId,
      customerId,
      subscription,
      mode: effectiveMode,
    })
    await recomputeUserEntitlement(childId, effectiveMode)
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: existingGrant, error: existingGrantError } = await supabase
    .from("parent_child_subscriptions")
    .select("parent_id, child_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle()

  if (existingGrantError) {
    if (!isMissingRelationError(existingGrantError)) {
      throw new Error(`[stripe] Failed to load parent-child grant: ${existingGrantError.message}`)
    }
    console.warn(
      "[stripe] parent_child_subscriptions table missing; applying as own subscription."
    )
  } else if (existingGrant?.parent_id && existingGrant?.child_id) {
    await upsertParentChildGrant({
      parentId: existingGrant.parent_id,
      childId: existingGrant.child_id,
      customerId,
      subscription,
      mode: effectiveMode,
    })
    await recomputeUserEntitlement(existingGrant.child_id, effectiveMode)
    return
  }

  await updateProfileFromSubscription(subscription, customerId, fallbackUserId, effectiveMode)
}
