import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { logger } from "@/lib/logger"
import { getPrizeWheelCampaign, toPrizeView } from "@/lib/prize-wheel/server"
import { isCampaignLive } from "@/lib/prize-wheel/types"

export const runtime = "nodejs"

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const supabaseUser = createServerClientWithToken(accessToken)
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(supabaseUser, user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }
  return { userId: user.id }
}

const patchSchema = z
  .object({
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
  })
  .refine((value) => (value.startsAt == null) === (value.endsAt == null), {
    message: "Setează ambele date sau lasă-le goale ca să oprești campania.",
  })
  .refine(
    (value) => {
      if (!value.startsAt || !value.endsAt) return true
      const start = new Date(value.startsAt)
      const end = new Date(value.endsAt)
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end.getTime() > start.getTime()
    },
    { message: "Data de sfârșit trebuie să fie după data de început." }
  )

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const campaign = await getPrizeWheelCampaign()
    if (!campaign) {
      return NextResponse.json({ error: "Campania nu există." }, { status: 404 })
    }

    const admin = getServiceRoleSupabase()
    const { data: prizes, error } = await admin
      .from("prize_wheel_prizes")
      .select(
        "id, user_id, prize_type, code, email, display_name, redeemed_at, created_at"
      )
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const winners = (prizes ?? []).map((row) => {
      const view = toPrizeView(row)
      return {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        prizeType: row.prize_type,
        label: view?.label ?? row.prize_type,
        code: row.code,
        redeemedAt: row.redeemed_at,
        createdAt: row.created_at,
      }
    })

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        startsAt: campaign.starts_at,
        endsAt: campaign.ends_at,
        isLive: isCampaignLive(campaign.starts_at, campaign.ends_at),
        guaranteedLimit: campaign.guaranteed_1leu_limit,
        guaranteedAwarded: campaign.guaranteed_1leu_awarded,
      },
      winners,
    })
  } catch (error) {
    logger.error("[admin/prize-wheel] GET failed", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Date invalide." },
        { status: 400 }
      )
    }

    const campaign = await getPrizeWheelCampaign()
    if (!campaign) {
      return NextResponse.json({ error: "Campania nu există." }, { status: 404 })
    }

    const admin = getServiceRoleSupabase()
    const { data, error } = await admin
      .from("prize_wheel_campaigns")
      .update({
        starts_at: parsed.data.startsAt,
        ends_at: parsed.data.endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id)
      .select(
        "id, starts_at, ends_at, guaranteed_1leu_limit, guaranteed_1leu_awarded, created_at, updated_at"
      )
      .single()

    if (error) throw error

    return NextResponse.json({
      campaign: {
        id: data.id,
        startsAt: data.starts_at,
        endsAt: data.ends_at,
        isLive: isCampaignLive(data.starts_at, data.ends_at),
        guaranteedLimit: data.guaranteed_1leu_limit,
        guaranteedAwarded: data.guaranteed_1leu_awarded,
      },
    })
  } catch (error) {
    logger.error("[admin/prize-wheel] PATCH failed", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
