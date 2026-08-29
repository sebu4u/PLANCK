export const PREGATIRE_HUB_TABS = ["pregatiri", "teme", "notite"] as const

export type PregatireHubTab = (typeof PREGATIRE_HUB_TABS)[number]

export const PREGATIRE_HUB_TAB_STORAGE_KEY = "pregatire-hub-tab"

export const DEFAULT_PREGATIRE_HUB_TAB: PregatireHubTab = "pregatiri"

export function isPregatireHubTab(value: unknown): value is PregatireHubTab {
  return value === "pregatiri" || value === "teme" || value === "notite"
}

export function readStoredPregatireHubTab(): PregatireHubTab {
  if (typeof window === "undefined") return DEFAULT_PREGATIRE_HUB_TAB
  try {
    const stored = window.localStorage.getItem(PREGATIRE_HUB_TAB_STORAGE_KEY)
    return isPregatireHubTab(stored) ? stored : DEFAULT_PREGATIRE_HUB_TAB
  } catch {
    return DEFAULT_PREGATIRE_HUB_TAB
  }
}

export function writeStoredPregatireHubTab(tab: PregatireHubTab) {
  try {
    window.localStorage.setItem(PREGATIRE_HUB_TAB_STORAGE_KEY, tab)
  } catch {
    // ignore quota / private mode
  }
}

export const PREGATIRE_INTRO_STORAGE_KEY = "pregatire-intro-seen"

export function hasSeenPregatireIntro(): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.localStorage.getItem(PREGATIRE_INTRO_STORAGE_KEY) === "1"
  } catch {
    return true
  }
}

export function writeSeenPregatireIntro() {
  try {
    window.localStorage.setItem(PREGATIRE_INTRO_STORAGE_KEY, "1")
  } catch {
    // ignore quota / private mode
  }
}
