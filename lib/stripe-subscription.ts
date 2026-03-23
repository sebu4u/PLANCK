import "server-only"

import type Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

import {
  getStripePrices,
  resolvePlanFromPriceId,
  resolveStripeModeFromLivemode,
  type StripeMode,
} from "@/lib/stripe-config"

const ENTITLED_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])
const PORTAL_MANAGED_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
  "incomplete_expired",
])

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

export const hasPortalManagedSubscription = (status: string | null | undefined) => {
  if (!status) return false
  return PORTAL_MANAGED_SUBSCRIPTION_STATUSES.has(status)
}

export const isStripeMissingCustomerError = (error: unknown): boolean => {
  const message = typeof error === "object" && error && "message" in error ? String(error.message) : ""
  return /no such customer/i.test(message)
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

export const updateProfileFromSubscription = async (
  subscription: Stripe.Subscription,
  customerId: string | null,
  userId?: string | null,
  mode?: StripeMode
) => {
  const supabase = getSupabaseAdmin()
  const effectiveMode = mode ?? resolveStripeModeFromLivemode(subscription.livemode)
  const prices = getStripePrices(effectiveMode)
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const plan = resolvePlanFromPriceId(priceId, prices)
  const status = subscription.status
  const rawCurrentPeriodEnd =
    (subscription as Stripe.Subscription & { current_period_end?: number | null }).current_period_end ?? null
  const currentPeriodEnd = rawCurrentPeriodEnd
    ? new Date(rawCurrentPeriodEnd * 1000).toISOString()
    : null

  const updatePayload: Record<string, any> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    stripe_subscription_status: status,
    stripe_current_period_end: currentPeriodEnd,
  }

  if (ENTITLED_SUBSCRIPTION_STATUSES.has(status)) {
    if (plan) {
      updatePayload.plan = plan
    } else {
      console.warn("[stripe] Unknown price ID:", priceId)
    }
  } else {
    updatePayload.plan = "free"
  }

  if (userId) {
    await supabase.from("profiles").update(updatePayload).eq("user_id", userId)
    return
  }

  if (customerId) {
    await supabase.from("profiles").update(updatePayload).eq("stripe_customer_id", customerId)
  }
}
