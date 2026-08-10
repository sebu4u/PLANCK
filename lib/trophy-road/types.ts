import type { PlanckPassCosmetic, PlanckPassRewardKind } from "@/lib/planckpass/types"

export type TrophyRoadRewardKind = PlanckPassRewardKind

export interface TrophyRoadMilestone {
  id: string
  threshold: number
  sortOrder: number
  kind: TrophyRoadRewardKind
  label: string
  coinsAmount: number | null
  eloAmount: number | null
  eloMultiplierMinutes: number | null
  streakFreezeHours: number | null
  cosmetic: PlanckPassCosmetic | null
  /** Reward fields are filled in admin — unconfigured milestones show as "În curând" */
  configured: boolean
  claimed: boolean
  unlocked: boolean
  claimable: boolean
  isActive: boolean
}

export interface TrophyRoadState {
  userElo: number
  milestones: TrophyRoadMilestone[]
  claimableCount: number
  coins: number
  eloBoostUntil: string | null
  streakFreezeUntil: string | null
}

export interface TrophyRoadClaimResult {
  milestoneId: string
  threshold: number
  rewardKind: TrophyRoadRewardKind
  label: string
  coinsAmount: number | null
  eloAmount: number | null
  eloMultiplierMinutes: number | null
  streakFreezeHours: number | null
  cosmetic: PlanckPassCosmetic | null
  eloBoostUntil?: string | null
  streakFreezeUntil?: string | null
  newElo?: number | null
  newCoins?: number | null
}

/** Legacy display kinds used by the map UI before Pass alignment */
export type TrophyRoadDisplayKind =
  | "coins"
  | "elo_boost"
  | "freeze"
  | "cosmetic"
  | "special"

export function toDisplayKind(kind: TrophyRoadRewardKind): TrophyRoadDisplayKind {
  switch (kind) {
    case "coins":
      return "coins"
    case "elo":
    case "elo_2x":
      return "elo_boost"
    case "streak_freeze":
      return "freeze"
    case "icon":
    case "border":
    case "skin":
      return "cosmetic"
    case "badge":
      return "special"
  }
}

export function getRewardKindLabel(kind: TrophyRoadRewardKind): string {
  switch (kind) {
    case "coins":
      return "Monede"
    case "elo":
      return "+ELO"
    case "elo_2x":
      return "Boost ELO"
    case "streak_freeze":
      return "Streak Freeze"
    case "icon":
      return "Iconiță"
    case "badge":
      return "Badge"
    case "border":
      return "Cadru"
    case "skin":
      return "Skin"
  }
}

export function formatMilestoneAmount(m: {
  kind: TrophyRoadRewardKind
  coinsAmount?: number | null
  eloAmount?: number | null
  eloMultiplierMinutes?: number | null
  streakFreezeHours?: number | null
  label: string
}): string {
  if (m.kind === "coins" && m.coinsAmount != null) return String(m.coinsAmount)
  if (m.kind === "elo" && m.eloAmount != null) return `+${m.eloAmount}`
  if (m.kind === "elo_2x" && m.eloMultiplierMinutes != null) {
    return `${m.eloMultiplierMinutes}m`
  }
  if (m.kind === "streak_freeze" && m.streakFreezeHours != null) {
    return `${m.streakFreezeHours}h`
  }
  return m.label
}

export function isMilestoneConfigured(input: {
  reward_kind: string
  coins_amount: number | null
  elo_amount: number | null
  elo_multiplier_minutes: number | null
  streak_freeze_hours: number | null
  cosmetic_id: string | null
}): boolean {
  switch (input.reward_kind) {
    case "coins":
      return (input.coins_amount ?? 0) > 0
    case "elo":
      return (input.elo_amount ?? 0) > 0
    case "elo_2x":
      return (input.elo_multiplier_minutes ?? 0) > 0
    case "streak_freeze":
      return (input.streak_freeze_hours ?? 0) > 0
    case "icon":
    case "badge":
    case "border":
    case "skin":
      return Boolean(input.cosmetic_id)
    default:
      return false
  }
}

/** Established thresholds — used as fallback before DB is migrated */
export const TROPHY_ROAD_DEFAULT_THRESHOLDS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1150,
  1300, 1500, 1700, 1900, 2100, 2300, 2500, 2750, 3000, 3300, 3600, 4000, 4400,
  4800, 5200, 5600, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 10000, 11000,
  12000, 13000, 14000, 15000,
] as const

export const TROPHY_ROAD_MAX = 15_000

export type TrophyRoadNodeState = "claimed" | "claimable" | "current" | "locked" | "soon"

export function getMilestoneNodeState(
  milestone: Pick<
    TrophyRoadMilestone,
    "threshold" | "claimed" | "claimable" | "unlocked" | "configured"
  >,
  userElo: number,
  milestones: readonly Pick<TrophyRoadMilestone, "threshold">[],
): TrophyRoadNodeState {
  if (milestone.claimed) return "claimed"
  if (milestone.claimable) return "claimable"
  if (milestone.unlocked && !milestone.configured) return "soon"

  const next = milestones.find((m) => m.threshold > userElo)
  if (next && next.threshold === milestone.threshold) return "current"
  return "locked"
}

export function getNextMilestone(
  userElo: number,
  milestones: readonly Pick<TrophyRoadMilestone, "threshold">[],
): { threshold: number } | undefined {
  return milestones.find((m) => m.threshold > userElo)
}
