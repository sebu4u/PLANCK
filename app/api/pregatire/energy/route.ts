import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"

export async function GET(req: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(token)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const { data, error } = await supabase.rpc("ensure_workshop_energy_grant", {
      p_user_id: userData.user.id,
    })

    if (error) {
      logger.error("[pregatire/energy] grant failed:", error)
      return NextResponse.json({ error: "Nu am putut încărca energia." }, { status: 500 })
    }

    const row = data as {
      balance?: number
      carryover_balance?: number
      last_weekly_grant_week?: string | null
    } | null

    return NextResponse.json({
      balance: row?.balance ?? 0,
      carryoverBalance: row?.carryover_balance ?? 0,
      lastWeeklyGrantWeek: row?.last_weekly_grant_week ?? null,
      last_weekly_grant_week: row?.last_weekly_grant_week ?? null,
    })
  } catch (err) {
    logger.error("[pregatire/energy] error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
