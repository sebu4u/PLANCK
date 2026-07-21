import type { PlanckPassClaimResult, PlanckPassRewardKind } from "@/lib/planckpass/types"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Builds a claim-result payload from the active season tier (no side effects).
 * Used so admins can re-trigger the claim reveal animation for testing.
 */
export async function buildPlanckPassClaimPreview(
  supabase: SupabaseClient,
  tierNumber: number,
): Promise<PlanckPassClaimResult | null> {
  const { data: season } = await supabase
    .from("planckpass_seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle()

  if (!season?.id) return null

  const { data: tier } = await supabase
    .from("planckpass_tiers")
    .select(
      "tier_number, is_free, reward_kind, label, coins_amount, elo_amount, elo_multiplier_minutes, streak_freeze_hours, planckpass_cosmetics(id, kind, name, image_url)",
    )
    .eq("season_id", season.id)
    .eq("tier_number", tierNumber)
    .maybeSingle()

  if (!tier) return null

  const cosmeticRaw = Array.isArray(tier.planckpass_cosmetics)
    ? tier.planckpass_cosmetics[0]
    : tier.planckpass_cosmetics

  return {
    tierNumber: tier.tier_number,
    rewardKind: tier.reward_kind as PlanckPassRewardKind,
    label: tier.label ?? "",
    isFree: Boolean(tier.is_free),
    coinsAmount: tier.coins_amount ?? null,
    eloAmount: tier.elo_amount ?? null,
    eloMultiplierMinutes: tier.elo_multiplier_minutes ?? null,
    streakFreezeHours: tier.streak_freeze_hours ?? null,
    cosmetic: cosmeticRaw
      ? {
          id: String(cosmeticRaw.id),
          kind: cosmeticRaw.kind as NonNullable<PlanckPassClaimResult["cosmetic"]>["kind"],
          name: String(cosmeticRaw.name),
          imageUrl: String(cosmeticRaw.image_url),
        }
      : null,
  }
}

export function mapPlanckPassClaimRpcResult(raw: Record<string, unknown>): PlanckPassClaimResult {
  const cosmeticRaw = raw.cosmetic as Record<string, unknown> | null
  return {
    tierNumber: Number(raw.tierNumber),
    rewardKind: raw.rewardKind as PlanckPassClaimResult["rewardKind"],
    label: String(raw.label ?? ""),
    isFree: Boolean(raw.isFree),
    coinsAmount: (raw.coinsAmount as number | null) ?? null,
    eloAmount: (raw.eloAmount as number | null) ?? null,
    eloMultiplierMinutes: (raw.eloMultiplierMinutes as number | null) ?? null,
    streakFreezeHours: (raw.streakFreezeHours as number | null) ?? null,
    cosmetic: cosmeticRaw
      ? {
          id: String(cosmeticRaw.id),
          kind: cosmeticRaw.kind as NonNullable<PlanckPassClaimResult["cosmetic"]>["kind"],
          name: String(cosmeticRaw.name),
          imageUrl: String(cosmeticRaw.imageUrl),
        }
      : null,
    eloBoostUntil: (raw.eloBoostUntil as string | null) ?? null,
    streakFreezeUntil: (raw.streakFreezeUntil as string | null) ?? null,
    newElo: (raw.newElo as number | null) ?? null,
    newCoins: (raw.newCoins as number | null) ?? null,
  }
}
