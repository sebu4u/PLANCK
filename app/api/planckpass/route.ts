import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { buildPlanckPassState } from "@/lib/planckpass/build-state"
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

    const { data: season } = await supabase
      .from("planckpass_seasons")
      .select("id, title, starts_at, ends_at, is_active")
      .eq("is_active", true)
      .maybeSingle()

    if (!season) {
      return NextResponse.json(
        buildPlanckPassState({
          season: null,
          tiers: [],
          xpTotal: 0,
          claimedTierNumbers: [],
          plan: "free",
          plusMonthsRemaining: 0,
          coins: 0,
          eloBoostUntil: null,
          streakFreezeUntil: null,
        }),
      )
    }

    const [
      { data: tiers },
      { data: progress },
      { data: claims },
      { data: profile },
      { data: stats },
      adminUnlockAll,
    ] = await Promise.all([
      supabase
        .from("planckpass_tiers")
        .select(
          "tier_number, is_free, reward_kind, label, xp_required, coins_amount, elo_amount, elo_multiplier_minutes, streak_freeze_hours, cosmetic_id, planckpass_cosmetics(id, kind, name, image_url, meta)",
        )
        .eq("season_id", season.id)
        .order("tier_number", { ascending: true }),
      supabase
        .from("planckpass_user_progress")
        .select("xp_total")
        .eq("user_id", user.id)
        .eq("season_id", season.id)
        .maybeSingle(),
      supabase
        .from("planckpass_user_claims")
        .select("tier_number")
        .eq("user_id", user.id)
        .eq("season_id", season.id),
      supabase
        .from("profiles")
        .select("plan, plus_months_remaining")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_stats")
        .select("coins, elo_boost_until, streak_freeze_until")
        .eq("user_id", user.id)
        .maybeSingle(),
      isAdminFromDB(supabase),
    ])

    return NextResponse.json(
      buildPlanckPassState({
        season,
        tiers: (tiers ?? []) as unknown as Parameters<typeof buildPlanckPassState>[0]["tiers"],
        xpTotal: progress?.xp_total ?? 0,
        claimedTierNumbers: (claims ?? []).map((c) => c.tier_number),
        plan: profile?.plan,
        plusMonthsRemaining: profile?.plus_months_remaining,
        coins: stats?.coins ?? 0,
        eloBoostUntil: stats?.elo_boost_until ?? null,
        streakFreezeUntil: stats?.streak_freeze_until ?? null,
        adminUnlockAll,
      }),
    )
  } catch (err) {
    logger.error("[planckpass] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
