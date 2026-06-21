const STORAGE_KEY = "planck-invata-recent-prompts"
const MAX_RECENT = 3

function normalizePrompt(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

export function readRecentPrompts(): string[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map(normalizePrompt)
      .filter(Boolean)
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function pushRecentPrompt(prompt: string): string[] {
  const trimmed = normalizePrompt(prompt)
  if (!trimmed) return readRecentPrompts()

  const deduped = [
    trimmed,
    ...readRecentPrompts().filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENT)

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
    } catch {
      // Ignore quota / private mode errors.
    }
  }

  return deduped
}
