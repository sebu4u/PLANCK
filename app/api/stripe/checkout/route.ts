import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getStripeClient } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"
import { normalizeSubscriptionPlan } from "@/lib/subscription-plan"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { canPurchaseSubscriptions } from "@/lib/access-config"
import {
  getOrCreateStripeCustomerId,
  hasPortalManagedSubscription,
  isStripeMissingCustomerError,
} from "@/lib/stripe-subscription"

export const runtime = "nodejs"

type CheckoutBody = {
  plan?: string
  interval?: "month" | "year"
}

const FORBIDDEN_CARD_FIELDS = new Set([
  "card",
  "number",
  "exp_month",
  "exp_year",
  "cvc",
  "card_number",
  "cardnumber",
  "payment_method_data",
  "source",
])

const hasRawCardData = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.some(hasRawCardData)
  if (typeof value !== "object") return false

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_CARD_FIELDS.has(key.toLowerCase())) return true
    if (hasRawCardData(nested)) return true
  }
  return false
}

const resolvePriceId = (plan: "plus" | "premium", interval: "month" | "year") => {
  const { prices } = getStripeConfig()
  if (plan === "plus") {
    return interval === "year" ? prices.plus.yearly : prices.plus.monthly
  }
  return interval === "year" ? prices.premium.yearly : prices.premium.monthly
}

export async function POST(req: NextRequest) {
  try {
    if (!canPurchaseSubscriptions()) {
      return NextResponse.json(
        { error: "Achiziția abonamentelor este dezactivată temporar." },
        { status: 403 }
      )
    }

    const accessToken = parseAccessToken(req)
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    let body: CheckoutBody
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
    }

    // Compliance guard: card data must never pass through our API.
    // Payments are collected only on Stripe-hosted Checkout/Billing pages.
    if (hasRawCardData(body)) {
      return NextResponse.json(
        { error: "Datele cardului nu pot fi transmise către server. Folosește checkout-ul Stripe." },
        { status: 400 }
      )
    }

    const normalizedPlan = normalizeSubscriptionPlan(body?.plan)
    if (normalizedPlan !== "plus" && normalizedPlan !== "premium") {
      return NextResponse.json({ error: "Plan invalid." }, { status: 400 })
    }

    const interval = body?.interval === "year" ? "year" : "month"
    const priceId = resolvePriceId(normalizedPlan, interval)
    const stripe = getStripeClient()
    const { siteUrl } = getStripeConfig()

    const user = userData.user
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_status")
      .eq("user_id", user.id)
      .maybeSingle()

    let existingCustomerId = profile?.stripe_customer_id ?? null
    const existingStatus = profile?.stripe_subscription_status ?? null
    if (existingCustomerId && hasPortalManagedSubscription(existingStatus)) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: existingCustomerId,
          return_url: `${siteUrl}/pricing`,
        })

        return NextResponse.json({
          url: portalSession.url,
          flow: "portal",
        })
      } catch (error) {
        if (!isStripeMissingCustomerError(error)) {
          throw error
        }

        console.warn(
          `[stripe/checkout] Stored customer ${existingCustomerId} not found in current mode; recreating customer.`
        )
        existingCustomerId = null

        const { error: cleanupError } = await supabase
          .from("profiles")
          .update({
            plan: "free",
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
            stripe_subscription_status: null,
            stripe_current_period_end: null,
          })
          .eq("user_id", user.id)

        if (cleanupError) {
          console.warn("[stripe/checkout] Failed to clear stale Stripe references:", cleanupError.message)
        }
      }
    }

    const stripeCustomerId = await getOrCreateStripeCustomerId({
      stripe,
      userId: user.id,
      email: user.email,
      existingCustomerId,
    })

    if (stripeCustomerId !== existingCustomerId) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", user.id)
      if (updateError) {
        console.warn("[stripe/checkout] Failed to persist customer ID:", updateError.message)
      }
    }

    // We only create hosted Checkout sessions here; sensitive card input stays on Stripe.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?checkout=canceled`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan: normalizedPlan,
        interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: normalizedPlan,
          interval,
        },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: "Nu am putut crea sesiunea Stripe." }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("[stripe/checkout] Error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
