/**
 * Trophy Road helpers — DB-backed milestones are the source of truth.
 * This module keeps display helpers + a static fallback for pre-migration.
 */

export {
  TROPHY_ROAD_DEFAULT_THRESHOLDS as TROPHY_ROAD_THRESHOLDS,
  TROPHY_ROAD_MAX,
  formatMilestoneAmount,
  getNextMilestone,
  getMilestoneNodeState,
  getRewardKindLabel,
  toDisplayKind,
  type TrophyRoadDisplayKind,
  type TrophyRoadMilestone,
  type TrophyRoadNodeState,
  type TrophyRoadRewardKind,
} from "@/lib/trophy-road/types"

import {
  TROPHY_ROAD_DEFAULT_THRESHOLDS,
  type TrophyRoadMilestone,
} from "@/lib/trophy-road/types"

/** Static fallback rows when API/DB is unavailable (preview only, not claimable). */
export const TROPHY_ROAD_MILESTONES: TrophyRoadMilestone[] =
  TROPHY_ROAD_DEFAULT_THRESHOLDS.map((threshold, index) => ({
    id: `fallback-${threshold}`,
    threshold,
    sortOrder: index + 1,
    kind: "coins",
    label: "În curând",
    coinsAmount: null,
    eloAmount: null,
    eloMultiplierMinutes: null,
    streakFreezeHours: null,
    cosmetic: null,
    configured: false,
    claimed: false,
    unlocked: false,
    claimable: false,
    isActive: true,
  }))
