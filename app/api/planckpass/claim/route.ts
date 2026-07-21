import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import {
  buildPlanckPassClaimPreview,
  mapPlanckPassClaimRpcResult,
} from "@/lib/planckpass/claim-preview"
import { createServerClientWithToken } from "@/lib/supabaseServer"

const bodySchema = z.object({
  tierNumber: z.number().int().min(1).max(30),
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

    const tierNumber = parsed.data.tierNumber
    const isAdmin = await isAdminFromDB(supabase, userData.user)

    const { data, error } = await supabase.rpc("claim_planckpass_tier", {
      p_tier_number: tierNumber,
    })

    if (error) {
      // Admins can always open the claim reveal for animation testing.
      if (isAdmin) {
        const preview = await buildPlanckPassClaimPreview(supabase, tierNumber)
        if (preview) {
          return NextResponse.json({ success: true, reward: preview, preview: true })
        }
      }

      const msg = error.message || "Nu am putut revendica reward-ul."
      const status =
        /blocat|Plus|Premium|Deja|inexistent|sezon|Cosmetic|Invalid/i.test(msg) ? 400 : 500
      return NextResponse.json({ error: msg }, { status })
    }

    return NextResponse.json({
      success: true,
      reward: mapPlanckPassClaimRpcResult(data as Record<string, unknown>),
    })
  } catch (err) {
    logger.error("[planckpass/claim] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
