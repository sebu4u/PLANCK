import { NextRequest, NextResponse } from "next/server"
import { isBucharestMondayGrantWindow } from "@/lib/pregatire/dates"
import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"
export const maxDuration = 300

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const force = new URL(request.url).searchParams.get("force") === "1"
  if (!force && !isBucharestMondayGrantWindow()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "outside_monday_grant_window",
    })
  }

  try {
    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase.rpc("grant_weekly_workshop_energy_batch")
    if (error) {
      logger.error("[cron/workshop-energy] failed:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info("[cron/workshop-energy] completed", data)
    return NextResponse.json({ ok: true, result: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error("[cron/workshop-energy] error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
