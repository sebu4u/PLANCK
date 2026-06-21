import { NextRequest, NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/stripe-subscription"

export const runtime = "nodejs"

type MailerLiteWebhookPayload = {
  events?: Array<{
    type?: string
    data?: {
      subscriber?: {
        email?: string
        status?: string
      }
    }
  }>
  type?: string
  subscriber?: {
    email?: string
    status?: string
  }
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const normalized = email.trim().toLowerCase()
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const match = data.users.find((u) => u.email?.toLowerCase() === normalized)
    if (match) return match.id

    if (data.users.length < 1000) break
    page++
  }

  return null
}

async function handleUnsubscribe(email: string) {
  const supabase = getSupabaseAdmin()
  const userId = await findUserIdByEmail(email)
  if (!userId) {
    console.info("[mailerlite/webhook] unsubscribe for unknown email:", email)
    return
  }

  const { error } = await supabase
    .from("profiles")
    .update({ marketing_emails_opt_out: true })
    .eq("user_id", userId)

  if (error) {
    console.error("[mailerlite/webhook] failed to update profile opt-out:", error.message)
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MAILERLITE_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = request.headers.get("signature") ?? request.headers.get("x-mailerlite-signature")
    if (signature !== webhookSecret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  let payload: MailerLiteWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const events = payload.events ?? [
    {
      type: payload.type,
      data: { subscriber: payload.subscriber },
    },
  ]

  for (const event of events) {
    const eventType = event.type ?? ""
    if (eventType !== "subscriber.unsubscribed" && eventType !== "subscriber.unsubscribe") {
      continue
    }

    const email = event.data?.subscriber?.email
    if (email) {
      await handleUnsubscribe(email)
    }
  }

  return NextResponse.json({ ok: true })
}
