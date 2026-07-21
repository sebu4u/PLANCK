import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import {
  awardPlanckPassXpServer,
  resolvePlanckPassXpAmount,
  type PlanckPassXpSource,
} from "@/lib/planckpass/award-server"
import { createServerClientWithToken } from "@/lib/supabaseServer"

const SOURCES = ["problem", "lp_interactive", "lp_item", "lp_test", "coding"] as const

const bodySchema = z.object({
  source: z.enum(SOURCES),
  sourceKey: z.string().min(1).max(200),
  difficulty: z.string().max(64).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 })
    }

    const source = parsed.data.source as PlanckPassXpSource
    const amount = resolvePlanckPassXpAmount(source, parsed.data.difficulty)

    const result = await awardPlanckPassXpServer({
      userId: userData.user.id,
      amount,
      source,
      sourceKey: parsed.data.sourceKey,
    })

    return NextResponse.json({
      awarded: result.awarded,
      xp_total: result.xpTotal,
      season_id: result.seasonId,
      // Always the resolved grant size (even on idempotent miss) so the lesson HUD can animate.
      amount,
    })
  } catch (err) {
    logger.error("[planckpass/award] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
