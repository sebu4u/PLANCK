import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { logger } from "@/lib/logger"
import {
  countUserSpins,
  getPrizeWheelCampaign,
  getUserPrizeForCampaign,
  isProfilePremium,
  isProfileStudent,
  toPrizeView,
  toPublicCampaign,
} from "@/lib/prize-wheel/server"
import { isPrizeWheelSpinResult, segmentIndexForResult } from "@/lib/prize-wheel/types"

export const runtime = "nodejs"

type SpinRpcResult = {
  ok?: boolean
  error?: string
  result?: string
  segment_index?: number
  code?: string | null
  prize_id?: string | null
}

async function resolveOptionalUser(req: NextRequest) {
  const accessToken = parseAccessToken(req)
  if (!accessToken) return null
  const supabase = createServerClientWithToken(accessToken)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export async function GET(req: NextRequest) {
  try {
    const campaign = await getPrizeWheelCampaign()
    const publicCampaign = toPublicCampaign(campaign)
    const user = await resolveOptionalUser(req)

    if (!user || !campaign) {
      return NextResponse.json({ campaign: publicCampaign, user: null })
    }

    const admin = getServiceRoleSupabase()
    const { data: profile } = await admin
      .from("profiles")
      .select("user_type, plan, stripe_subscription_status, name, nickname")
      .eq("user_id", user.id)
      .maybeSingle()

    const isStudent = isProfileStudent(profile?.user_type)
    const isPremium = isProfilePremium(profile)
    const spinCount = await countUserSpins(user.id, campaign.id)
    const prizeRow = await getUserPrizeForCampaign(user.id, campaign.id)
    const prize = prizeRow ? toPrizeView(prizeRow) : null
    const isLive = publicCampaign.isLive

    return NextResponse.json({
      campaign: publicCampaign,
      user: {
        isStudent,
        isPremium,
        spinCount,
        canSpin: isLive && isStudent && !prize && spinCount < 2,
        hasSpunOnce: spinCount >= 1,
        prize,
      },
    })
  } catch (error) {
    logger.error("[prize-wheel] GET failed", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = parseAccessToken(req)
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const user = userData.user
    const admin = getServiceRoleSupabase()
    const { data: profile } = await admin
      .from("profiles")
      .select("user_type, plan, stripe_subscription_status, name, nickname")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!isProfileStudent(profile?.user_type)) {
      return NextResponse.json(
        { error: "Roata este disponibilă doar pentru elevi." },
        { status: 403 }
      )
    }

    const isPremium = isProfilePremium(profile)
    const { data: rpcData, error: rpcError } = await admin.rpc("spin_prize_wheel", {
      p_user_id: user.id,
      p_is_premium: isPremium,
    })

    if (rpcError) {
      logger.error("[prize-wheel] spin RPC failed", rpcError)
      return NextResponse.json({ error: "Nu am putut învârti roata." }, { status: 500 })
    }

    const payload = (rpcData ?? {}) as SpinRpcResult
    if (!payload.ok) {
      const message =
        payload.error === "campaign_inactive"
          ? "Campania nu rulează acum."
          : payload.error === "already_won"
            ? "Ai primit deja premiul de la roată."
            : "Nu am putut învârti roata."
      const status = payload.error === "already_won" ? 409 : 400
      return NextResponse.json({ error: message }, { status })
    }

    if (!isPrizeWheelSpinResult(payload.result)) {
      return NextResponse.json({ error: "Rezultat invalid." }, { status: 500 })
    }

    const segmentIndex = segmentIndexForResult(payload.result, payload.segment_index)

    if (payload.prize_id) {
      const displayName = profile?.nickname || profile?.name || null
      await admin
        .from("prize_wheel_prizes")
        .update({
          email: user.email ?? null,
          display_name: displayName,
        })
        .eq("id", payload.prize_id)
    }

    const campaign = await getPrizeWheelCampaign()
    const prizeRow =
      campaign && payload.prize_id
        ? await getUserPrizeForCampaign(user.id, campaign.id)
        : null

    return NextResponse.json({
      result: payload.result,
      segmentIndex,
      code: payload.code ?? null,
      prize: prizeRow ? toPrizeView(prizeRow) : null,
    })
  } catch (error) {
    logger.error("[prize-wheel] POST failed", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
