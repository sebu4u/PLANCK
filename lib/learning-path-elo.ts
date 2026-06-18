export interface LearningPathEloAward {
  awarded: boolean
  previousElo: number
  newElo: number
  awardAmount: number
}

export const LEARNING_PATH_ELO_AWARD_AMOUNT = 15

export const LEARNING_PATH_ELO_ELIGIBLE_ITEM_TYPES = [
  "grila",
  "problem",
  "poll",
  "fill_slot",
] as const

export function countLearningPathEligibleEloItems(
  items: ReadonlyArray<{ item_type: string }>,
): number {
  return items.filter((item) =>
    LEARNING_PATH_ELO_ELIGIBLE_ITEM_TYPES.includes(
      item.item_type as (typeof LEARNING_PATH_ELO_ELIGIBLE_ITEM_TYPES)[number],
    ),
  ).length
}

export function computeLearningPathLessonEloTotal(
  items: ReadonlyArray<{ item_type: string }>,
): number {
  return countLearningPathEligibleEloItems(items) * LEARNING_PATH_ELO_AWARD_AMOUNT
}
