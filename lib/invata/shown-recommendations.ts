const STORAGE_KEY = "planck-invata-shown-recommendations"
const MAX_TRACKED = 24

type ShownEntry = {
  key: string
  shownAt: number
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function normalizeKey(type: string, id: string): string {
  return `${type}:${id}`
}

function readEntries(): ShownEntry[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (entry): entry is ShownEntry =>
          !!entry &&
          typeof entry === "object" &&
          typeof (entry as ShownEntry).key === "string" &&
          typeof (entry as ShownEntry).shownAt === "number",
      )
      .slice(0, MAX_TRACKED)
  } catch {
    return []
  }
}

function writeEntries(entries: ShownEntry[]) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_TRACKED)))
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function readShownRecommendationKeys(maxAgeMs = 1000 * 60 * 60 * 24 * 7): string[] {
  const cutoff = Date.now() - maxAgeMs
  return readEntries()
    .filter((entry) => entry.shownAt >= cutoff)
    .map((entry) => entry.key)
}

export function trackShownRecommendations(
  resources: Array<{ type: string; id: string }> | null | undefined,
) {
  if (!resources?.length) return
  const fresh = resources
    .map((resource) => ({ key: normalizeKey(resource.type, resource.id), shownAt: Date.now() }))
  if (!fresh.length) return

  const existing = readEntries().filter((entry) => !fresh.some((entry2) => entry2.key === entry.key))
  writeEntries([...fresh, ...existing])
}
