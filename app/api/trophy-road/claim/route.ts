import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { mapTrophyRoadClaimRpcResult } from "@/lib/trophy-road/claim-map"
import { createServerClientWithToken } from "@/lib/supabaseServer"

const bodySchema = z.object({
  milestoneId: z.string().uuid(),
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

    const milestoneId = parsed.data.milestoneId
    const isAdmin = await isAdminFromDB(supabase, userData.user)

    const { data, error } = await supabase.rpc("claim_trophy_road_milestone", {
      p_milestone_id: milestoneId,
    })

    if (error) {
      if (isAdmin) {
        // Admin preview: load milestone and return a synthetic reward for animation testing
        const { data: row } = await supabase
          .from("trophy_road_milestones")
          .select(
            "id, threshold, reward_kind, label, coins_amount, elo_amount, elo_multiplier_minutes, streak_freeze_hours, cosmetic_id, planckpass_cosmetics(id, kind, name, image_url)",
          )
          .eq("id", milestoneId)
          .maybeSingle()

        if (row) {
          const cosRaw = Array.isArray(row.planckpass_cosmetics)
            ? row.planckpass_cosmetics[0]
            : row.planckpass_cosmetics
          return NextResponse.json({
            success: true,
            preview: true,
            reward: mapTrophyRoadClaimRpcResult({
              milestoneId: row.id,
              threshold: row.threshold,
              rewardKind: row.reward_kind,
              label: row.label,
              coinsAmount: row.coins_amount,
              eloAmount: row.elo_amount,
              eloMultiplierMinutes: row.elo_multiplier_minutes,
              streakFreezeHours: row.streak_freeze_hours,
              cosmetic: cosRaw
                ? {
                    id: cosRaw.id,
                    kind: cosRaw.kind,
                    name: cosRaw.name,
                    imageUrl: cosRaw.image_url,
                  }
                : null,
            }),
          })
        }
      }

      const msg = error.message || "Nu am putut revendica recompensa."
      const status =
        /blocat|Deja|inexistent|configurată|Invalid|authenticated/i.test(msg) ? 400 : 500
      return NextResponse.json({ error: msg }, { status })
    }

    return NextResponse.json({
      success: true,
      reward: mapTrophyRoadClaimRpcResult(data as Record<string, unknown>),
    })
  } catch (err) {
    logger.error("[trophy-road/claim] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
