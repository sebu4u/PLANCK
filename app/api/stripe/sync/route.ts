import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { getStripeClient } from "@/lib/stripe"
import { updateProfileFromSubscription, resolveCustomerId } from "@/lib/stripe-subscription"

export const runtime = "nodejs"

type SyncBody = {
  session_id?: string
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

    let body: SyncBody
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
    }

    if (!body?.session_id) {
      return NextResponse.json({ error: "Lipsește session_id." }, { status: 400 })
    }

    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(body.session_id, {
      expand: ["subscription", "subscription.items.data.price"],
    })

    const userId = userData.user.id
    const sessionUserId = session.metadata?.user_id || session.client_reference_id
    if (sessionUserId && sessionUserId !== userId) {
      return NextResponse.json({ error: "Sesiune neautorizată." }, { status: 403 })
    }

    const subscription = session.subscription
    if (!subscription || typeof subscription === "string") {
      return NextResponse.json({ error: "Sesiunea nu are abonament." }, { status: 400 })
    }

    const customerId = resolveCustomerId(session.customer)
    await updateProfileFromSubscription(subscription, customerId, userId)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("[stripe/sync] Error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
