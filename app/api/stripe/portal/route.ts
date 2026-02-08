import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getStripeClient } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"
import { parseAccessToken } from "@/lib/subscription-plan-server"

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

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "Nu există abonament activ." }, { status: 400 })
    }

    const stripe = getStripeClient()
    const { siteUrl } = getStripeConfig()

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/pricing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("[stripe/portal] Error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
