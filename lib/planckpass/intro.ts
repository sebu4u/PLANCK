export const PLANCKPASS_INTRO_SEASON_LABEL = "Sezonul 1"
export const PLANCKPASS_INTRO_STORAGE_PREFIX = "planckpass_s1_intro_seen_"

export function planckPassIntroStorageKey(userId: string) {
  return `${PLANCKPASS_INTRO_STORAGE_PREFIX}${userId}`
}

export function hasLocalPlanckPassIntroSeen(userId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(planckPassIntroStorageKey(userId)) === "1"
  } catch {
    return false
  }
}

export function markLocalPlanckPassIntroSeen(userId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(planckPassIntroStorageKey(userId), "1")
  } catch {
    // ignore
  }
}

/** First-entry PLANCKPASS intro only on the student homepage. */
export function isPlanckPassIntroPath(pathname: string | null | undefined): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/"
}
