import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getStripeClient } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import {
  findStripeCustomerIdForUser,
  getSupabaseAdmin,
  isStripeMissingCustomerError,
} from "@/lib/stripe-subscription"
import {
  ParentChildBillingError,
  assertParentCanManageChildGrant,
} from "@/lib/parent/billing"
import { normalizeUserType } from "@/lib/user-types"

export const runtime = "nodejs"

type PortalBody = {
  childId?: string
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = parseAccessToken(req)
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    let childId = ""
    const contentType = req.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      try {
        const body = (await req.json()) as PortalBody
        childId = typeof body?.childId === "string" ? body.childId.trim() : ""
      } catch {
        childId = ""
      }
    }

    const stripe = getStripeClient()
    const { siteUrl } = getStripeConfig()
    const supabaseAdmin = getSupabaseAdmin()

    if (childId) {
      const grant = await assertParentCanManageChildGrant(userData.user.id, childId)
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: grant.customerId,
          return_url: `${siteUrl}/dashboard/parent`,
          flow_data: {
            type: "subscription_update",
            subscription_update: {
              subscription: grant.subscriptionId,
            },
          },
        })
        return NextResponse.json({ url: portalSession.url })
      } catch (error) {
        if (isStripeMissingCustomerError(error)) {
          return NextResponse.json({ error: "Nu există abonament activ." }, { status: 400 })
        }
        console.warn("[stripe/portal] Child subscription_update flow failed, using generic portal:", error)
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: grant.customerId,
          return_url: `${siteUrl}/dashboard/parent`,
        })
        return NextResponse.json({ url: portalSession.url })
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, user_type")
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (normalizeUserType(profile?.user_type) === "parinte") {
      return NextResponse.json(
        { error: "Alege copilul al cărui abonament vrei să îl gestionezi." },
        { status: 400 }
      )
    }

    let recoveredCustomerId = profile?.stripe_customer_id ?? null
    let hadInvalidStoredCustomer = false
    if (recoveredCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(recoveredCustomerId)
        if ("deleted" in customer && customer.deleted) {
          recoveredCustomerId = null
          hadInvalidStoredCustomer = true
        }
      } catch (error) {
        if (isStripeMissingCustomerError(error)) {
          recoveredCustomerId = null
          hadInvalidStoredCustomer = true
        } else {
          throw error
        }
      }
    }

    if (!recoveredCustomerId) {
      recoveredCustomerId = await findStripeCustomerIdForUser({
        stripe,
        userId: userData.user.id,
        email: userData.user.email,
      })
    }

    if (hadInvalidStoredCustomer && !recoveredCustomerId) {
      const { error: cleanupError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
          stripe_customer_id: null,
          stripe_subscription_id: null,
          stripe_price_id: null,
          stripe_subscription_status: null,
          stripe_current_period_end: null,
        })
        .eq("user_id", userData.user.id)

      if (cleanupError) {
        console.warn("[stripe/portal] Failed to clear stale Stripe references:", cleanupError.message)
      }
    }

    if (!recoveredCustomerId) {
      return NextResponse.json({ error: "Nu există abonament activ." }, { status: 400 })
    }

    if (recoveredCustomerId !== profile?.stripe_customer_id) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: recoveredCustomerId })
        .eq("user_id", userData.user.id)

      if (updateError) {
        console.warn("[stripe/portal] Failed to persist recovered customer ID:", updateError.message)
      }
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: recoveredCustomerId,
      return_url: `${siteUrl}/pricing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: unknown) {
    if (error instanceof ParentChildBillingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error("[stripe/portal] Error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
