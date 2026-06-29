export const INVATA_HUB_REFRESH_EVENT = "planck:invata-hub-refresh"

export function dispatchInvataHubRefresh() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(INVATA_HUB_REFRESH_EVENT))
}
