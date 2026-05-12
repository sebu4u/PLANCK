export const GUEST_LEARNING_PATH_PROGRESS_COOKIE = "planck_guest_lp"

export type GuestLearningPathProgressMap = Record<string, string[]>

export function parseGuestLearningPathProgress(raw: string | undefined): GuestLearningPathProgressMap {
  if (!raw?.trim()) return {}
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== "object" || Array.isArray(v)) return {}
    return v as GuestLearningPathProgressMap
  } catch {
    return {}
  }
}

/** Număr unic de itemi marcați ca finalizați (în orice lecție), pentru limita planului free. */
export function countGuestCompletedLearningPathItems(map: GuestLearningPathProgressMap): number {
  const set = new Set<string>()
  for (const ids of Object.values(map)) {
    if (!Array.isArray(ids)) continue
    for (const id of ids) {
      if (typeof id === "string" && id.trim()) set.add(id)
    }
  }
  return set.size
}

export function getGuestCompletedItemIdsForLesson(
  map: GuestLearningPathProgressMap,
  lessonId: string
): string[] {
  const ids = map[lessonId]
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && id.trim()) : []
}
