import {
  LEARNING_PATH_ELO_AWARD_AMOUNT,
  type LearningPathEloAward,
} from "@/lib/learning-path-elo"

export const GUEST_LEARNING_PATH_ELO_STORAGE_KEY = "planck_guest_lp_elo"
export const GUEST_LEARNING_PATH_DEFAULT_ELO = 500

export interface GuestLearningPathEloState {
  elo: number
  awardedItemIds: string[]
}

export function readGuestLearningPathEloState(): GuestLearningPathEloState {
  if (typeof window === "undefined") {
    return { elo: GUEST_LEARNING_PATH_DEFAULT_ELO, awardedItemIds: [] }
  }

  try {
    const raw = localStorage.getItem(GUEST_LEARNING_PATH_ELO_STORAGE_KEY)
    if (!raw) {
      return { elo: GUEST_LEARNING_PATH_DEFAULT_ELO, awardedItemIds: [] }
    }

    const parsed = JSON.parse(raw) as Partial<GuestLearningPathEloState>
    return {
      elo:
        typeof parsed.elo === "number" && Number.isFinite(parsed.elo)
          ? parsed.elo
          : GUEST_LEARNING_PATH_DEFAULT_ELO,
      awardedItemIds: Array.isArray(parsed.awardedItemIds)
        ? parsed.awardedItemIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        : [],
    }
  } catch {
    return { elo: GUEST_LEARNING_PATH_DEFAULT_ELO, awardedItemIds: [] }
  }
}

function writeGuestLearningPathEloState(state: GuestLearningPathEloState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(GUEST_LEARNING_PATH_ELO_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}

export function awardGuestLearningPathItemElo(itemId: string): LearningPathEloAward | null {
  const trimmedItemId = itemId.trim()
  if (!trimmedItemId) return null

  const state = readGuestLearningPathEloState()
  const previousElo = state.elo

  if (state.awardedItemIds.includes(trimmedItemId)) {
    return {
      awarded: false,
      previousElo,
      newElo: previousElo,
      awardAmount: 0,
    }
  }

  const newElo = previousElo + LEARNING_PATH_ELO_AWARD_AMOUNT
  writeGuestLearningPathEloState({
    elo: newElo,
    awardedItemIds: [...state.awardedItemIds, trimmedItemId],
  })

  return {
    awarded: true,
    previousElo,
    newElo,
    awardAmount: LEARNING_PATH_ELO_AWARD_AMOUNT,
  }
}
