import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"
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
  throw error
}

const resolveSubscriptionId = (value: Stripe.Checkout.Session["subscription"] | Stripe.Invoice["subscription"]) => {
  if (!value) return null
  return typeof value === "string" ? value : value.id
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient()
  const { webhookSecret } = getStripeConfig()

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("[stripe/webhook] Signature error:", err?.message || err)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

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
          await updateProfileFromSubscription(subscription, customerId, userId)
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
        await updateProfileFromSubscription(subscription, customerId, userId)
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = resolveSubscriptionId(invoice.subscription)
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          })
          const customerId = resolveCustomerId(subscription.customer)
          const userId = subscription.metadata?.user_id || null
          await updateProfileFromSubscription(subscription, customerId, userId)
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
