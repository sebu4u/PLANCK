import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import { getStripeWebhookSecretEntries, type StripeMode } from "@/lib/stripe-config"
import {
  applyStripeSubscription,
  getSupabaseAdmin,
  isParentForChildPurchase,
  isStripeMissingResourceError,
  resolveCustomerId,
} from "@/lib/stripe-subscription"
import { markPrizeRedeemed } from "@/lib/prize-wheel/server"
import { markShopCouponRedeemed } from "@/lib/shop/server"
import { sendTikTokCheckoutPurchase } from "@/lib/tiktok-events-api"
import { capturePosthogServerEvent } from "@/lib/posthog-server"

export const runtime = "nodejs"

type WebhookEventClaim = {
  shouldProcess: boolean
  releaseOnFailure: boolean
}

const isSchemaMissingError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? String(error.code) : ""
  const message = "message" in error ? String(error.message).toLowerCase() : ""
  const details = "details" in error ? String(error.details).toLowerCase() : ""
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache") ||
    details.includes("purchased_balance")
  )
}

const claimWebhookEvent = async (eventId: string): Promise<WebhookEventClaim> => {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: eventId })
  if (!error) {
    return {
      shouldProcess: true,
      releaseOnFailure: true,
    }
  }
  if (error.code === "23505" || error.message?.toLowerCase().includes("duplicate")) {
    return {
      shouldProcess: false,
      releaseOnFailure: false,
    }
  }
  if (error.code === "42P01") {
    console.warn("[stripe/webhook] stripe_webhook_events table missing; processing without idempotency.")
    return {
      shouldProcess: true,
      releaseOnFailure: false,
    }
  }
  throw error
}

const releaseWebhookEventClaim = async (eventId: string) => {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("stripe_webhook_events").delete().eq("event_id", eventId)
    if (error && error.code !== "42P01") {
      console.warn("[stripe/webhook] Failed to release webhook event claim:", error.message)
    }
  } catch (error) {
    console.warn("[stripe/webhook] Failed to release webhook event claim:", error)
  }
}

const resolveSubscriptionId = (value: unknown) => {
  if (!value) return null
  if (typeof value === "string") return value
  if (typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id
  }
  return null
}

const resolveInvoiceSubscriptionId = (invoice: Stripe.Invoice) => {
  const legacySubscription = (invoice as Stripe.Invoice & { subscription?: unknown }).subscription
  const nestedSubscription = (invoice as Stripe.Invoice & {
    parent?: { subscription_details?: { subscription?: unknown } | null } | null
  }).parent?.subscription_details?.subscription

  return resolveSubscriptionId(legacySubscription ?? nestedSubscription ?? null)
}

const retrieveSubscription = async (stripe: Stripe, subscriptionId: string) => {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    })
  } catch (error) {
    if (isStripeMissingResourceError(error)) {
      console.warn("[stripe/webhook] Ignoring missing Stripe subscription:", subscriptionId)
      return null
    }
    throw error
  }
}

const redeemCheckoutPerks = async (session: Stripe.Checkout.Session) => {
  const prizeId = session.metadata?.prize_wheel_prize_id?.trim() || null
  if (prizeId) {
    try {
      await markPrizeRedeemed({
        prizeId,
        sessionId: session.id,
      })
    } catch (error) {
      if (!isSchemaMissingError(error)) throw error
      console.warn("[stripe/webhook] prize_wheel_prizes table missing; skipping prize redemption.")
    }
  }

  const shopCouponId = session.metadata?.shop_coupon_id?.trim() || null
  if (shopCouponId) {
    try {
      await markShopCouponRedeemed({
        couponId: shopCouponId,
        sessionId: session.id,
      })
    } catch (error) {
      if (!isSchemaMissingError(error)) throw error
      console.warn("[stripe/webhook] planckpass_shop_coupons table missing; skipping shop coupon redemption.")
    }
  }
}

export async function POST(req: NextRequest) {
  let webhookSecretEntries: ReturnType<typeof getStripeWebhookSecretEntries>
  try {
    webhookSecretEntries = getStripeWebhookSecretEntries()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error
    console.error("[stripe/webhook] Missing webhook secrets:", message)
    return NextResponse.json({ error: "Webhook secrets are not configured." }, { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event | null = null
  let verifiedMode: StripeMode | null = null
  let signatureError: unknown = null

  for (const entry of webhookSecretEntries) {
    try {
      event = Stripe.webhooks.constructEvent(body, signature, entry.secret)
      verifiedMode = entry.mode
      signatureError = null
      break
    } catch (err) {
      signatureError = err
    }
  }

  if (!event) {
    const err: { message?: string } | unknown = signatureError
    const message = typeof err === "object" && err && "message" in err ? err.message : err
    console.error("[stripe/webhook] Signature error:", message)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  const stripeMode = verifiedMode ?? (event.livemode ? "live" : "test")
  let claim: WebhookEventClaim | null = null

  try {
    const stripe = getStripeClient(stripeMode)

    claim = await claimWebhookEvent(event.id)
    if (!claim.shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break

        const customerId = resolveCustomerId(session.customer)
        const subscriptionId = resolveSubscriptionId(session.subscription)
        const userId =
          session.metadata?.payer_user_id ||
          session.metadata?.user_id ||
          session.client_reference_id ||
          null

        if (subscriptionId) {
          const subscription = await retrieveSubscription(stripe, subscriptionId)
          if (subscription) {
            if (
              isParentForChildPurchase(session.metadata) &&
              !isParentForChildPurchase(subscription.metadata)
            ) {
              subscription.metadata = {
                ...subscription.metadata,
                ...session.metadata,
              }
            }
            await applyStripeSubscription(subscription, customerId, userId, stripeMode)
          }
        } else if (userId && customerId) {
          const supabase = getSupabaseAdmin()
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("user_id", userId)
        }

        await redeemCheckoutPerks(session)
        void sendTikTokCheckoutPurchase(session)
        if (userId) {
          void capturePosthogServerEvent({
            distinctId: userId,
            event: "subscription_purchased",
            properties: {
              $insert_id: `purchase:${session.id}`,
              session_id: session.id,
              interval: session.metadata?.interval,
              campaign: session.metadata?.campaign,
              value: typeof session.amount_total === "number" ? session.amount_total / 100 : undefined,
              currency: session.currency,
              plan: "premium",
            },
          })
        }
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = resolveCustomerId(subscription.customer)
        const userId =
          subscription.metadata?.payer_user_id || subscription.metadata?.user_id || null
        await applyStripeSubscription(subscription, customerId, userId, stripeMode)
        break
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = resolveInvoiceSubscriptionId(invoice)
        if (subscriptionId) {
          const subscription = await retrieveSubscription(stripe, subscriptionId)
          if (subscription) {
            const customerId = resolveCustomerId(subscription.customer)
            const userId =
              subscription.metadata?.payer_user_id || subscription.metadata?.user_id || null
            await applyStripeSubscription(subscription, customerId, userId, stripeMode)
          }
        }
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    if (claim?.releaseOnFailure) {
      await releaseWebhookEventClaim(event.id)
    }
    console.error("[stripe/webhook] Handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }
}
