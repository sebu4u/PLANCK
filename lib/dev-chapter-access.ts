import type { DevPermissions } from "@/lib/admin-check"
import { chapterMatchesSubject, isSuperDev, type ApiDevSubject } from "@/lib/dev-subjects"

export type ChapterDevAccessRow = {
  problem_category?: string | null
  allowed_dev_user_ids?: string[] | null
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeAllowedDevUserIds(raw: unknown): string[] | null {
  if (raw === null || raw === undefined) return null
  if (!Array.isArray(raw)) return null

  const ids: string[] = []
  for (const item of raw) {
    if (typeof item !== "string") continue
    const trimmed = item.trim()
    if (!UUID_RE.test(trimmed)) continue
    if (!ids.includes(trimmed)) ids.push(trimmed)
  }

  return ids
}

export function parseAllowedDevUserIdsInput(raw: unknown): string[] | null {
  if (raw === null || raw === undefined) return null
  if (!Array.isArray(raw)) return null

  const ids: string[] = []
  for (const item of raw) {
    if (typeof item !== "string") return null
    const trimmed = item.trim()
    if (!UUID_RE.test(trimmed)) return null
    if (!ids.includes(trimmed)) ids.push(trimmed)
  }

  return ids
}

export function canDevEditChapter(
  permissions: DevPermissions,
  userId: string,
  chapter: ChapterDevAccessRow
): boolean {
  if (permissions.isAdmin || isSuperDev(permissions.isDev, permissions.devSubjects)) {
    return true
  }
  if (!permissions.isDev) return false

  const allowed = normalizeAllowedDevUserIds(chapter.allowed_dev_user_ids)
  if (!allowed || allowed.length === 0) return false
  return allowed.includes(userId)
}

export function chapterVisibleForDev(
  chapter: ChapterDevAccessRow,
  subject: ApiDevSubject,
  permissions: DevPermissions,
  userId: string
): boolean {
  if (!canDevEditChapter(permissions, userId, chapter)) return false

  if (permissions.isAdmin || isSuperDev(permissions.isDev, permissions.devSubjects)) {
    if (subject === "all") return true
    return chapterMatchesSubject(
      { problem_category: chapter.problem_category ?? null },
      subject
    )
  }

  return true
}
