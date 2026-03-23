import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getStripeClient } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { findStripeCustomerIdForUser } from "@/lib/stripe-subscription"

export const runtime = "nodejs"

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle()

    const stripe = getStripeClient()
    const recoveredCustomerId =
      profile?.stripe_customer_id ??
      (await findStripeCustomerIdForUser({
        stripe,
        userId: userData.user.id,
        email: userData.user.email,
      }))

    if (!recoveredCustomerId) {
      return NextResponse.json({ error: "Nu există abonament activ." }, { status: 400 })
    }
    const { siteUrl } = getStripeConfig()

    if (recoveredCustomerId !== profile?.stripe_customer_id) {
      const { error: updateError } = await supabase
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
  } catch (error: any) {
    console.error("[stripe/portal] Error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
