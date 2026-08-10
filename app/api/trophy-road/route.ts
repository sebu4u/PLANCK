import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { buildTrophyRoadState } from "@/lib/trophy-road/build-state"
import type { TrophyRoadMilestoneRow } from "@/lib/trophy-road/build-state"
import { TROPHY_ROAD_DEFAULT_THRESHOLDS } from "@/lib/trophy-road/types"
import { createServerClientWithToken } from "@/lib/supabaseServer"

async function getAuthedUser(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const supabase = createServerClientWithToken(accessToken)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  return { supabase, user: data.user }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthedUser(req)
    if ("error" in auth && auth.error) return auth.error
    const { supabase, user } = auth as {
      supabase: ReturnType<typeof createServerClientWithToken>
      user: { id: string }
    }

    const [
      { data: milestones, error: milestonesErr },
      { data: claims },
      { data: stats },
      adminUnlockAll,
    ] = await Promise.all([
      supabase
        .from("trophy_road_milestones")
        .select(
          "id, threshold, sort_order, reward_kind, label, coins_amount, elo_amount, elo_multiplier_minutes, streak_freeze_hours, cosmetic_id, is_active, planckpass_cosmetics(id, kind, name, image_url, meta)",
        )
        .eq("is_active", true)
        .order("threshold", { ascending: true }),
      supabase
        .from("trophy_road_user_claims")
        .select("milestone_id")
        .eq("user_id", user.id),
      supabase
        .from("user_stats")
        .select("elo, coins, elo_boost_until, streak_freeze_until")
        .eq("user_id", user.id)
        .maybeSingle(),
      isAdminFromDB(supabase),
    ])

    if (milestonesErr) {
      // Table may not exist yet — fall back to static thresholds
      logger.warn("[trophy-road] milestones load failed, using fallback:", milestonesErr.message)
      const fallbackRows: TrophyRoadMilestoneRow[] = TROPHY_ROAD_DEFAULT_THRESHOLDS.map(
        (threshold, index) => ({
          id: `fallback-${threshold}`,
          threshold,
          sort_order: index + 1,
          reward_kind: "coins",
          label: "",
          coins_amount: null,
          elo_amount: null,
          elo_multiplier_minutes: null,
          streak_freeze_hours: null,
          cosmetic_id: null,
          is_active: true,
        }),
      )
      return NextResponse.json(
        buildTrophyRoadState({
          userElo: stats?.elo ?? 500,
          milestones: fallbackRows,
          claimedMilestoneIds: [],
          coins: stats?.coins ?? 0,
          eloBoostUntil: stats?.elo_boost_until ?? null,
          streakFreezeUntil: stats?.streak_freeze_until ?? null,
        }),
      )
    }

    return NextResponse.json(
      buildTrophyRoadState({
        userElo: stats?.elo ?? 500,
        milestones: (milestones ?? []) as unknown as TrophyRoadMilestoneRow[],
        claimedMilestoneIds: (claims ?? []).map((c) => c.milestone_id),
        coins: stats?.coins ?? 0,
        eloBoostUntil: stats?.elo_boost_until ?? null,
        streakFreezeUntil: stats?.streak_freeze_until ?? null,
        adminUnlockAll,
      }),
    )
  } catch (err) {
    logger.error("[trophy-road] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
