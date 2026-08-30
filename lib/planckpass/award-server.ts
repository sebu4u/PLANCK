import "server-only"

import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { PLANCKPASS_XP, xpForDifficulty, xpForQuizDifficulty } from "@/lib/planckpass/xp"

export type PlanckPassXpSource =
  | "problem"
  | "quiz"
  | "lp_interactive"
  | "lp_item"
  | "lp_test"
  | "coding"

const FIXED_AMOUNTS: Record<Exclude<PlanckPassXpSource, "problem" | "coding" | "quiz">, number> = {
  lp_interactive: PLANCKPASS_XP.lpInteractive,
  lp_item: PLANCKPASS_XP.lpItem,
  lp_test: PLANCKPASS_XP.lpTest,
}

/** Resolve canonical XP for a source (never trust client amount alone). */
export function resolvePlanckPassXpAmount(
  source: PlanckPassXpSource,
  difficulty?: string | null,
): number {
  if (source === "problem" || source === "coding") {
    return xpForDifficulty(difficulty)
  }
  if (source === "quiz") {
    return xpForQuizDifficulty(difficulty)
  }
  return FIXED_AMOUNTS[source]
}

/**
 * Idempotent PlanckPass XP grant via service role.
 * Bypasses the broken SQL RPC (ambiguous season_id out-params) until the
 * migration `20260721_planckpass_xp_ambiguous_fix.sql` is applied.
 */
export async function awardPlanckPassXpServer(input: {
  userId: string
  amount: number
  source: string
  sourceKey: string
}): Promise<{ awarded: boolean; xpTotal: number; seasonId: string | null }> {
  const amount = Math.floor(Number(input.amount) || 0)
  const source = String(input.source || "").trim()
  const sourceKey = String(input.sourceKey || "").trim()

  if (!input.userId || amount <= 0 || !source || !sourceKey) {
    return { awarded: false, xpTotal: 0, seasonId: null }
  }

  const admin = getServiceRoleSupabase()

  const { data: season, error: seasonErr } = await admin
    .from("planckpass_seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle()

  if (seasonErr || !season?.id) {
    return { awarded: false, xpTotal: 0, seasonId: null }
  }

  const seasonId = season.id as string

  await admin.from("planckpass_user_progress").upsert(
    {
      user_id: input.userId,
      season_id: seasonId,
      xp_total: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,season_id", ignoreDuplicates: true },
  )

  const { data: inserted, error: insertErr } = await admin
    .from("planckpass_xp_events")
    .insert({
      user_id: input.userId,
      season_id: seasonId,
      source,
      source_key: sourceKey,
      amount,
    })
    .select("id")
    .maybeSingle()

  if (insertErr) {
    // Unique violation → already awarded
    if (insertErr.code === "23505") {
      const { data: progress } = await admin
        .from("planckpass_user_progress")
        .select("xp_total")
        .eq("user_id", input.userId)
        .eq("season_id", seasonId)
        .maybeSingle()
      return {
        awarded: false,
        xpTotal: Number(progress?.xp_total ?? 0),
        seasonId,
      }
    }
    throw insertErr
  }

  if (!inserted) {
    const { data: progress } = await admin
      .from("planckpass_user_progress")
      .select("xp_total")
      .eq("user_id", input.userId)
      .eq("season_id", seasonId)
      .maybeSingle()
    return {
      awarded: false,
      xpTotal: Number(progress?.xp_total ?? 0),
      seasonId,
    }
  }

  const { data: current } = await admin
    .from("planckpass_user_progress")
    .select("xp_total")
    .eq("user_id", input.userId)
    .eq("season_id", seasonId)
    .maybeSingle()

  const nextTotal = Number(current?.xp_total ?? 0) + amount

  const { data: updated, error: updateErr } = await admin
    .from("planckpass_user_progress")
    .update({
      xp_total: nextTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .eq("season_id", seasonId)
    .select("xp_total")
    .maybeSingle()

  if (updateErr) throw updateErr

  return {
    awarded: true,
    xpTotal: Number(updated?.xp_total ?? nextTotal),
    seasonId,
  }
}
