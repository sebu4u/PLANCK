import { canClaimPremiumPlanckPass } from "@/lib/planckpass/access"
import type {
  PlanckPassCosmetic,
  PlanckPassRewardKind,
  PlanckPassState,
  PlanckPassTier,
} from "@/lib/planckpass/types"
import {
  cumulativeXpToTier,
  isPlanckPassTierAutoUnlocked,
  xpBarForProgress,
} from "@/lib/planckpass/xp"

type TierRow = {
  tier_number: number
  is_free: boolean
  reward_kind: string
  label: string
  xp_required: number
  coins_amount: number | null
  elo_amount: number | null
  elo_multiplier_minutes: number | null
  streak_freeze_hours: number | null
  cosmetic_id: string | null
  planckpass_cosmetics?: {
    id: string
    kind: string
    name: string
    image_url: string
    meta?: Record<string, unknown> | null
  } | null
}

function mapCosmetic(
  raw:
    | {
        id: string
        kind: string
        name: string
        image_url: string
        meta?: Record<string, unknown> | null
      }
    | null
    | undefined,
): PlanckPassCosmetic | null {
  if (!raw?.id) return null
  return {
    id: raw.id,
    kind: raw.kind as PlanckPassCosmetic["kind"],
    name: raw.name,
    imageUrl: raw.image_url,
    meta: (raw.meta as Record<string, unknown>) ?? undefined,
  }
}

export function buildPlanckPassState(input: {
  season: {
    id: string
    title: string
    starts_at: string | null
    ends_at: string | null
    is_active: boolean
  } | null
  tiers: TierRow[]
  xpTotal: number
  claimedTierNumbers: number[]
  plan: unknown
  plusMonthsRemaining: number | null | undefined
  coins: number
  eloBoostUntil: string | null
  streakFreezeUntil: string | null
  /** Admins can always tap any tier to preview the claim animation. */
  adminUnlockAll?: boolean
}): PlanckPassState {
  const canClaimPremium = canClaimPremiumPlanckPass(input.plan, input.plusMonthsRemaining)
  const claimed = new Set(input.claimedTierNumbers)
  const sorted = [...input.tiers].sort((a, b) => a.tier_number - b.tier_number)
  const xpRequiredByTier = sorted.map((t) => t.xp_required)
  const bar = xpBarForProgress(input.xpTotal, xpRequiredByTier)
  const adminUnlockAll = Boolean(input.adminUnlockAll)

  const tiers: PlanckPassTier[] = sorted.map((t) => {
    const needed = cumulativeXpToTier(xpRequiredByTier, t.tier_number)
    const unlocked =
      adminUnlockAll || isPlanckPassTierAutoUnlocked(t.tier_number) || input.xpTotal >= needed
    const isClaimed = claimed.has(t.tier_number)
    const premiumLocked = !adminUnlockAll && !t.is_free && !canClaimPremium
    const claimable =
      adminUnlockAll || (unlocked && !isClaimed && (t.is_free || canClaimPremium))
    const cosmetic = mapCosmetic(
      Array.isArray(t.planckpass_cosmetics)
        ? t.planckpass_cosmetics[0]
        : t.planckpass_cosmetics,
    )

    return {
      tier: t.tier_number,
      isFree: t.is_free,
      kind: t.reward_kind as PlanckPassRewardKind,
      label: t.label,
      xpRequired: t.xp_required,
      coinsAmount: t.coins_amount,
      eloAmount: t.elo_amount,
      eloMultiplierMinutes: t.elo_multiplier_minutes,
      streakFreezeHours: t.streak_freeze_hours,
      cosmetic,
      claimed: isClaimed,
      unlocked,
      claimable,
      premiumLocked,
    }
  })

  return {
    season: input.season
      ? {
          id: input.season.id,
          title: input.season.title,
          startsAt: input.season.starts_at,
          endsAt: input.season.ends_at,
          isActive: input.season.is_active,
        }
      : null,
    currentTier: bar.currentTier,
    xpCurrent: bar.xpCurrent,
    xpMax: bar.xpMax,
    xpTotal: input.xpTotal,
    tiers,
    canClaimPremium,
    coins: input.coins,
    eloBoostUntil: input.eloBoostUntil,
    streakFreezeUntil: input.streakFreezeUntil,
  }
}
