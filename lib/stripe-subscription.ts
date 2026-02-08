import "server-only"

import type Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

import { getStripeConfig, resolvePlanFromPriceId } from "@/lib/stripe-config"

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])

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

export const updateProfileFromSubscription = async (
  subscription: Stripe.Subscription,
  customerId: string | null,
  userId?: string | null
) => {
  const supabase = getSupabaseAdmin()
  const { prices } = getStripeConfig()
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const plan = resolvePlanFromPriceId(priceId, prices)
  const status = subscription.status
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null

  const updatePayload: Record<string, any> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    stripe_subscription_status: status,
    stripe_current_period_end: currentPeriodEnd,
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
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
