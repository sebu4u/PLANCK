/** Reserved tag: learning paths with this tag render in the /invata archive. */
export const LEARNING_PATH_ARCHIVE_TAG = "arhiva"

export function normalizeLearningPathTags(tags: unknown): string[] {
  const raw = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags.split(/[,;\n]/)
      : []

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of raw) {
    const trimmed = String(value).trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(key === LEARNING_PATH_ARCHIVE_TAG ? LEARNING_PATH_ARCHIVE_TAG : trimmed)
  }

  return normalized
}

export function parseLearningPathTagsInput(
  input: unknown,
): { ok: true; tags: string[] } | { ok: false } {
  if (input == null) return { ok: true, tags: [] }
  if (Array.isArray(input) || typeof input === "string") {
    return { ok: true, tags: normalizeLearningPathTags(input) }
  }
  return { ok: false }
}

export function learningPathHasArchiveTag(tags: unknown): boolean {
  return normalizeLearningPathTags(tags).includes(LEARNING_PATH_ARCHIVE_TAG)
}

export function setLearningPathArchiveTag(tags: unknown, archived: boolean): string[] {
  const next = normalizeLearningPathTags(tags).filter((tag) => tag !== LEARNING_PATH_ARCHIVE_TAG)
  if (archived) next.push(LEARNING_PATH_ARCHIVE_TAG)
  return next
}

export function getLearningPathDisplayTags(tags: unknown): string[] {
  return normalizeLearningPathTags(tags).filter((tag) => tag !== LEARNING_PATH_ARCHIVE_TAG)
}

export function formatLearningPathTagsInput(tags: unknown): string {
  return getLearningPathDisplayTags(tags).join(", ")
}
