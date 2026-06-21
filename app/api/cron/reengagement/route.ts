import { NextRequest, NextResponse } from "next/server"

import { runReengagementJob } from "@/lib/reengagement/run-job"
import { getSupabaseAdmin } from "@/lib/stripe-subscription"

export const runtime = "nodejs"
export const maxDuration = 300

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get("authorization")
  if (authHeader === `Bearer ${cronSecret}`) return true

  // Vercel Cron also sends this header; still require Bearer secret.
  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.MAILERLITE_API_KEY) {
    console.error("[cron/reengagement] MAILERLITE_API_KEY missing")
    return NextResponse.json({ error: "MailerLite not configured" }, { status: 500 })
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []

  try {
    const supabase = getSupabaseAdmin()
    const summary = await runReengagementJob(supabase, adminEmails)

    console.info("[cron/reengagement] completed", JSON.stringify(summary))

    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[cron/reengagement] failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
