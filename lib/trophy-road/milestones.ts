export type TrophyRoadRewardKind =
  | "coins"
  | "elo_boost"
  | "freeze"
  | "cosmetic"
  | "special"

export interface TrophyRoadMilestone {
  id: string
  threshold: number
  kind: TrophyRoadRewardKind
  /** Display amount for coins / boost minutes / freeze hours */
  amount?: number
  /** Short Romanian label for cosmetics / specials */
  label: string
}

/**
 * Placeholder Trophy Road milestones through 15.000 trophies.
 * Dense early, then progressively sparser. Not season-bound.
 */
export const TROPHY_ROAD_MILESTONES: TrophyRoadMilestone[] = [
  // 0–1.000 — dense (~50–100)
  { id: "tr-50", threshold: 50, kind: "coins", amount: 50, label: "Monede" },
  { id: "tr-100", threshold: 100, kind: "elo_boost", amount: 15, label: "Boost ELO" },
  { id: "tr-150", threshold: 150, kind: "coins", amount: 75, label: "Monede" },
  { id: "tr-200", threshold: 200, kind: "freeze", amount: 24, label: "Streak Freeze" },
  { id: "tr-250", threshold: 250, kind: "coins", amount: 100, label: "Monede" },
  { id: "tr-300", threshold: 300, kind: "cosmetic", label: "Cadru Avatar" },
  { id: "tr-350", threshold: 350, kind: "coins", amount: 120, label: "Monede" },
  { id: "tr-400", threshold: 400, kind: "elo_boost", amount: 30, label: "Boost ELO" },
  { id: "tr-450", threshold: 450, kind: "coins", amount: 150, label: "Monede" },
  { id: "tr-500", threshold: 500, kind: "special", label: "Badge Rookie" },
  { id: "tr-600", threshold: 600, kind: "coins", amount: 180, label: "Monede" },
  { id: "tr-700", threshold: 700, kind: "freeze", amount: 24, label: "Streak Freeze" },
  { id: "tr-800", threshold: 800, kind: "coins", amount: 200, label: "Monede" },
  { id: "tr-900", threshold: 900, kind: "cosmetic", label: "Iconiță Profil" },
  { id: "tr-1000", threshold: 1000, kind: "special", label: "Titlu Explorer" },

  // 1.000–3.000 — every ~150–250
  { id: "tr-1150", threshold: 1150, kind: "coins", amount: 220, label: "Monede" },
  { id: "tr-1300", threshold: 1300, kind: "elo_boost", amount: 30, label: "Boost ELO" },
  { id: "tr-1500", threshold: 1500, kind: "coins", amount: 250, label: "Monede" },
  { id: "tr-1700", threshold: 1700, kind: "freeze", amount: 48, label: "Streak Freeze" },
  { id: "tr-1900", threshold: 1900, kind: "cosmetic", label: "Temă Chat" },
  { id: "tr-2100", threshold: 2100, kind: "coins", amount: 300, label: "Monede" },
  { id: "tr-2300", threshold: 2300, kind: "elo_boost", amount: 45, label: "Boost ELO" },
  { id: "tr-2500", threshold: 2500, kind: "special", label: "Badge Rising" },
  { id: "tr-2750", threshold: 2750, kind: "coins", amount: 350, label: "Monede" },
  { id: "tr-3000", threshold: 3000, kind: "special", label: "Titlu Scholar" },

  // 3.000–7.000 — every ~300–500
  { id: "tr-3300", threshold: 3300, kind: "coins", amount: 400, label: "Monede" },
  { id: "tr-3600", threshold: 3600, kind: "freeze", amount: 48, label: "Streak Freeze" },
  { id: "tr-4000", threshold: 4000, kind: "cosmetic", label: "Cadru Premium" },
  { id: "tr-4400", threshold: 4400, kind: "coins", amount: 450, label: "Monede" },
  { id: "tr-4800", threshold: 4800, kind: "elo_boost", amount: 60, label: "Boost ELO" },
  { id: "tr-5200", threshold: 5200, kind: "coins", amount: 500, label: "Monede" },
  { id: "tr-5600", threshold: 5600, kind: "cosmetic", label: "Avatar Rare" },
  { id: "tr-6000", threshold: 6000, kind: "special", label: "Badge Elite" },
  { id: "tr-6500", threshold: 6500, kind: "coins", amount: 600, label: "Monede" },
  { id: "tr-7000", threshold: 7000, kind: "special", label: "Titlu Master" },

  // 7.000–15.000 — every ~500–1.000
  { id: "tr-7500", threshold: 7500, kind: "coins", amount: 700, label: "Monede" },
  { id: "tr-8000", threshold: 8000, kind: "elo_boost", amount: 90, label: "Boost ELO" },
  { id: "tr-8500", threshold: 8500, kind: "freeze", amount: 72, label: "Streak Freeze" },
  { id: "tr-9000", threshold: 9000, kind: "cosmetic", label: "Cadru Legend" },
  { id: "tr-10000", threshold: 10000, kind: "special", label: "Badge Legend" },
  { id: "tr-11000", threshold: 11000, kind: "coins", amount: 1000, label: "Monede" },
  { id: "tr-12000", threshold: 12000, kind: "elo_boost", amount: 120, label: "Boost ELO" },
  { id: "tr-13000", threshold: 13000, kind: "cosmetic", label: "Avatar Mythic" },
  { id: "tr-14000", threshold: 14000, kind: "coins", amount: 1500, label: "Monede" },
  { id: "tr-15000", threshold: 15000, kind: "special", label: "Titlu Planck" },
]

export const TROPHY_ROAD_MAX = 15_000

/** Spacing along the road in px per trophy (visual density). */
export const TROPHY_ROAD_PX_PER_TROPHY = 0.55

export const TROPHY_ROAD_SIDE_PAD = 80

export function getTrophyRoadTrackLength(_orientation?: "horizontal" | "vertical"): number {
  const span = TROPHY_ROAD_MAX * TROPHY_ROAD_PX_PER_TROPHY
  return TROPHY_ROAD_SIDE_PAD * 2 + span
}

export function getMilestoneOffset(threshold: number): number {
  return TROPHY_ROAD_SIDE_PAD + threshold * TROPHY_ROAD_PX_PER_TROPHY
}

export function getProgressFillLength(elo: number): number {
  const clamped = Math.max(0, Math.min(TROPHY_ROAD_MAX, elo))
  return TROPHY_ROAD_SIDE_PAD + clamped * TROPHY_ROAD_PX_PER_TROPHY
}

export type TrophyRoadNodeState = "claimed" | "current" | "locked"

export function getMilestoneState(
  threshold: number,
  userElo: number,
  milestones: readonly TrophyRoadMilestone[] = TROPHY_ROAD_MILESTONES,
): TrophyRoadNodeState {
  if (userElo >= threshold) return "claimed"

  const next = milestones.find((m) => m.threshold > userElo)
  if (next && next.threshold === threshold) return "current"
  return "locked"
}

export function getNextMilestone(
  userElo: number,
  milestones: readonly TrophyRoadMilestone[] = TROPHY_ROAD_MILESTONES,
): TrophyRoadMilestone | undefined {
  return milestones.find((m) => m.threshold > userElo)
}

export function formatMilestoneAmount(milestone: TrophyRoadMilestone): string {
  if (milestone.kind === "coins" && milestone.amount != null) {
    return String(milestone.amount)
  }
  if (milestone.kind === "elo_boost" && milestone.amount != null) {
    return `${milestone.amount}m`
  }
  if (milestone.kind === "freeze" && milestone.amount != null) {
    return `${milestone.amount}h`
  }
  return milestone.label
}
