import type { PlanckPassCosmetic, PlanckPassRewardKind } from "@/lib/planckpass/types"
import {
  isMilestoneConfigured,
  type TrophyRoadMilestone,
  type TrophyRoadState,
} from "@/lib/trophy-road/types"

type CosmeticRaw = {
  id: string
  kind: string
  name: string
  image_url: string
  meta?: Record<string, unknown> | null
} | null

export type TrophyRoadMilestoneRow = {
  id: string
  threshold: number
  sort_order: number
  reward_kind: string
  label: string
  coins_amount: number | null
  elo_amount: number | null
  elo_multiplier_minutes: number | null
  streak_freeze_hours: number | null
  cosmetic_id: string | null
  is_active: boolean
  planckpass_cosmetics?: CosmeticRaw | CosmeticRaw[]
}

function mapCosmetic(raw: CosmeticRaw | CosmeticRaw[] | undefined): PlanckPassCosmetic | null {
  const c = Array.isArray(raw) ? raw[0] : raw
  if (!c?.id) return null
  return {
    id: c.id,
    kind: c.kind as PlanckPassCosmetic["kind"],
    name: c.name,
    imageUrl: c.image_url,
    meta: (c.meta as Record<string, unknown>) ?? undefined,
  }
}

export function buildTrophyRoadState(input: {
  userElo: number
  milestones: TrophyRoadMilestoneRow[]
  claimedMilestoneIds: string[]
  coins: number
  eloBoostUntil: string | null
  streakFreezeUntil: string | null
  adminUnlockAll?: boolean
}): TrophyRoadState {
  const claimed = new Set(input.claimedMilestoneIds)
  const adminUnlockAll = Boolean(input.adminUnlockAll)
  const sorted = [...input.milestones]
    .filter((m) => m.is_active)
    .sort((a, b) => a.threshold - b.threshold || a.sort_order - b.sort_order)

  const milestones: TrophyRoadMilestone[] = sorted.map((row) => {
    const configured = isMilestoneConfigured(row)
    const unlocked = adminUnlockAll || input.userElo >= row.threshold
    const isClaimed = claimed.has(row.id)
    const claimable = adminUnlockAll
      ? configured && !isClaimed
      : unlocked && configured && !isClaimed
    const cosmetic = mapCosmetic(row.planckpass_cosmetics)
    const kind = row.reward_kind as PlanckPassRewardKind
    const label =
      row.label?.trim() ||
      (configured
        ? kind === "coins"
          ? "Monede"
          : kind === "elo"
            ? "+ELO"
            : kind === "elo_2x"
              ? "Boost ELO"
              : kind === "streak_freeze"
                ? "Streak Freeze"
                : cosmetic?.name || "Recompensă"
        : "În curând")

    return {
      id: row.id,
      threshold: row.threshold,
      sortOrder: row.sort_order,
      kind,
      label,
      coinsAmount: row.coins_amount,
      eloAmount: row.elo_amount,
      eloMultiplierMinutes: row.elo_multiplier_minutes,
      streakFreezeHours: row.streak_freeze_hours,
      cosmetic,
      configured,
      claimed: isClaimed,
      unlocked,
      claimable,
      isActive: row.is_active,
    }
  })

  return {
    userElo: input.userElo,
    milestones,
    claimableCount: milestones.filter((m) => m.claimable).length,
    coins: input.coins,
    eloBoostUntil: input.eloBoostUntil,
    streakFreezeUntil: input.streakFreezeUntil,
  }
}
