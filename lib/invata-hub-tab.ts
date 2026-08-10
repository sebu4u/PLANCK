export const INVATA_HUB_TABS = ["trasee", "lectii"] as const

export type InvataHubTab = (typeof INVATA_HUB_TABS)[number]

export const INVATA_HUB_TAB_STORAGE_KEY = "invata-hub-tab"

export const DEFAULT_INVATA_HUB_TAB: InvataHubTab = "trasee"

export function isInvataHubTab(value: unknown): value is InvataHubTab {
  return value === "trasee" || value === "lectii"
}

export function readStoredInvataHubTab(): InvataHubTab {
  if (typeof window === "undefined") return DEFAULT_INVATA_HUB_TAB
  try {
    const stored = window.localStorage.getItem(INVATA_HUB_TAB_STORAGE_KEY)
    return isInvataHubTab(stored) ? stored : DEFAULT_INVATA_HUB_TAB
  } catch {
    return DEFAULT_INVATA_HUB_TAB
  }
}

export function writeStoredInvataHubTab(tab: InvataHubTab) {
  try {
    window.localStorage.setItem(INVATA_HUB_TAB_STORAGE_KEY, tab)
  } catch {
    // ignore quota / private mode
  }
}
