import {
  TROPHY_ROAD_MILESTONES,
  type TrophyRoadMilestone,
} from "@/lib/trophy-road/milestones"

export type TrophyRoadClimbSide = "left" | "right"

export interface TrophyRoadClimbItem extends TrophyRoadMilestone {
  /** Index in ascending-threshold milestones list */
  index: number
  /** Reward chip side relative to the center spine */
  side: TrophyRoadClimbSide
}

/** Alternating L/R for visual rhythm along the climb. */
export function getClimbSide(index: number): TrophyRoadClimbSide {
  return index % 2 === 0 ? "left" : "right"
}

/**
 * Climb rows for the vertical path.
 * Display order: summit first (top of scroll) → start last (bottom),
 * so the user scrolls up to climb.
 */
export function buildTrophyRoadClimbItems(
  milestones: readonly TrophyRoadMilestone[] = TROPHY_ROAD_MILESTONES,
): TrophyRoadClimbItem[] {
  const ascending = [...milestones]
    .filter((m) => m.isActive !== false)
    .sort((a, b) => a.threshold - b.threshold)
    .map((milestone, index) => ({
      ...milestone,
      index,
      side: getClimbSide(index),
    }))

  return [...ascending].reverse()
}
