import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import { getStripeWebhookSecretEntries, type StripeMode } from "@/lib/stripe-config"
import {
  getSupabaseAdmin,
  resolveCustomerId,
  updateProfileFromSubscription,
} from "@/lib/stripe-subscription"

export const runtime = "nodejs"

const recordWebhookEvent = async (eventId: string) => {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: eventId })
  if (!error) return true
  if (error.code === "23505" || error.message?.toLowerCase().includes("duplicate")) {
    return false
  }
  if (error.code === "42P01") {
    console.warn("[stripe/webhook] stripe_webhook_events table missing; processing without idempotency.")
    return true
  }
  throw error
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

export async function POST(req: NextRequest) {
  const webhookSecretEntries = getStripeWebhookSecretEntries()

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
      const stripe = getStripeClient(entry.mode)
      event = stripe.webhooks.constructEvent(body, signature, entry.secret)
      verifiedMode = entry.mode
      signatureError = null
      break
    } catch (err) {
      signatureError = err
    }
  }

  if (!event) {
    const err: any = signatureError
    console.error("[stripe/webhook] Signature error:", err?.message || err)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  const stripeMode = verifiedMode ?? (event.livemode ? "live" : "test")
  const stripe = getStripeClient(stripeMode)

  try {
    const shouldProcess = await recordWebhookEvent(event.id)
    if (!shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break

        const customerId = resolveCustomerId(session.customer)
        const subscriptionId = resolveSubscriptionId(session.subscription)
        const userId = session.metadata?.user_id || session.client_reference_id || null

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          })
          await updateProfileFromSubscription(subscription, customerId, userId, stripeMode)
        } else if (userId && customerId) {
          const supabase = getSupabaseAdmin()
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("user_id", userId)
        }
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = resolveCustomerId(subscription.customer)
        const userId = subscription.metadata?.user_id || null
        await updateProfileFromSubscription(subscription, customerId, userId, stripeMode)
        break
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = resolveInvoiceSubscriptionId(invoice)
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          })
          const customerId = resolveCustomerId(subscription.customer)
          const userId = subscription.metadata?.user_id || null
          await updateProfileFromSubscription(subscription, customerId, userId, stripeMode)
        }
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[stripe/webhook] Handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }
}
