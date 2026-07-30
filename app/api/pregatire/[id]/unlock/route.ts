import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"

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

    const { data, error } = await supabase.rpc("unlock_workshop", {
      p_workshop_id: id,
    })

    if (error) {
      logger.error("[pregatire/unlock] RPC failed:", error)
      return NextResponse.json({ error: "Nu am putut debloca pregătirea." }, { status: 500 })
    }

    const result = data as {
      ok?: boolean
      error?: string
      already_unlocked?: boolean
      meet_url?: string
      recording_url?: string | null
      balance?: number
      energy_cost?: number
    }

    if (!result?.ok) {
      const code = result?.error ?? "unknown"
      if (code === "insufficient_energy") {
        return NextResponse.json(
          {
            error: "Nu ai suficientă energie.",
            code,
            balance: result.balance,
            energy_cost: result.energy_cost,
          },
          { status: 402 },
        )
      }
      if (code === "full") {
        return NextResponse.json(
          { error: "Locurile pentru această pregătire sunt epuizate.", code },
          { status: 409 },
        )
      }
      if (code === "not_found") {
        return NextResponse.json({ error: "Pregătirea nu a fost găsită.", code }, { status: 404 })
      }
      return NextResponse.json({ error: "Nu am putut debloca pregătirea.", code }, { status: 400 })
    }

    return NextResponse.json({
      unlocked: true,
      already_unlocked: Boolean(result.already_unlocked),
      meet_url: result.meet_url ?? null,
      recording_url: result.recording_url ?? null,
      balance: result.balance ?? 0,
    })
  } catch (err) {
    logger.error("[pregatire/unlock] error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
