import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { verifyConfirmToken } from "@/lib/pregatire/confirm-token"

/**
 * POST /api/pregatire/[id]/confirm
 * Authenticated confirmation: calls confirm_workshop_attendance RPC.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
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

    const { data, error } = await supabase.rpc("confirm_workshop_attendance", {
      p_workshop_id: id,
    })

    if (error) {
      logger.error("[pregatire/confirm] RPC failed:", error)
      return NextResponse.json({ error: "Nu am putut confirma participarea." }, { status: 500 })
    }

    const result = data as {
      ok?: boolean
      error?: string
      already_confirmed?: boolean
      confirmed_at?: string
    }

    if (!result?.ok) {
      const code = result?.error ?? "unknown"
      if (code === "not_unlocked") {
        return NextResponse.json(
          { error: "Trebuie să rezervi locul înainte de a confirma.", code },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: "Nu am putut confirma participarea.", code }, { status: 400 })
    }

    return NextResponse.json({
      confirmed: true,
      already_confirmed: Boolean(result.already_confirmed),
      confirmed_at: result.confirmed_at,
    })
  } catch (err) {
    logger.error("[pregatire/confirm] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * GET /api/pregatire/[id]/confirm?token=...
 * One-click email confirmation via signed token.
 * Token = HMAC-SHA256(userId:workshopId) using WORKSHOP_CONFIRM_SECRET or CRON_SECRET fallback.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(
        new URL(`/pregatire/${id}?error=invalid_token`, req.url),
        { status: 302 },
      )
    }

    const verification = verifyConfirmToken(token, id)
    if (!verification.valid) {
      const errorType = verification.error === "secret_not_configured" ? "server_error" : "invalid_token"
      if (verification.error === "secret_not_configured") {
        logger.error("[pregatire/confirm] GET: WORKSHOP_CONFIRM_SECRET not configured")
      }
      return NextResponse.redirect(
        new URL(`/pregatire/${id}?error=${errorType}`, req.url),
        { status: 302 },
      )
    }

    const { userId, workshopId } = verification

    // Valid token: confirm attendance using service role
    const supabase = getServiceRoleSupabase()
    
    // Check if unlock exists
    const { data: unlock } = await supabase
      .from("workshop_unlocks")
      .select("confirmed_at")
      .eq("user_id", userId)
      .eq("workshop_id", workshopId)
      .maybeSingle()

    if (!unlock) {
      return NextResponse.redirect(
        new URL(`/pregatire/${id}?error=not_unlocked`, req.url),
        { status: 302 },
      )
    }

    // Update confirmation if not already confirmed
    if (!unlock.confirmed_at) {
      const { error } = await supabase
        .from("workshop_unlocks")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("workshop_id", workshopId)

      if (error) {
        logger.error("[pregatire/confirm] GET update failed:", error)
        return NextResponse.redirect(
          new URL(`/pregatire/${id}?error=update_failed`, req.url),
          { status: 302 },
        )
      }
    }

    return NextResponse.redirect(
      new URL(`/pregatire/${id}?confirmed=1`, req.url),
      { status: 302 },
    )
  } catch (err) {
    logger.error("[pregatire/confirm] GET error:", err)
    const { id } = await context.params
    return NextResponse.redirect(
      new URL(`/pregatire/${id}?error=server_error`, req.url),
      { status: 302 },
    )
  }
}

