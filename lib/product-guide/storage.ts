import type { ProductGuideFlags, ProductGuideProgress, ProductGuideStepId } from "@/lib/product-guide/types"

const STORAGE_PREFIX = "planck_product_guide_"

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function isStepId(value: unknown): value is ProductGuideStepId {
  return typeof value === "string" && value.length > 0
}

/** Users who already moved past the first dashboard tip should not see the new Pregătiri nudge. */
function migrateSeen(seen: ProductGuideStepId[]): ProductGuideStepId[] {
  if (seen.includes("elev-pregatire-cta")) return seen
  const progressedPastFirstDashboard = seen.some((id) => id !== "elev-home-subject")
  if (seen.includes("elev-home-subject") && progressedPastFirstDashboard) {
    return [...seen, "elev-pregatire-cta"]
  }
  return seen
}

function normalizeProgress(raw: unknown): ProductGuideProgress {
  if (!raw || typeof raw !== "object") {
    return { seen: [], flags: {} }
  }

  const record = raw as Record<string, unknown>
  const seenRaw = Array.isArray(record.seen) ? record.seen : []
  const seen = migrateSeen(seenRaw.filter(isStepId))
  const flagsRaw =
    record.flags && typeof record.flags === "object"
      ? (record.flags as ProductGuideFlags)
      : {}

  const flags: ProductGuideFlags = {}
  if (flagsRaw.visitedLearningPathItem === true) {
    flags.visitedLearningPathItem = true
  }

  return { seen, flags }
}

export function readProductGuideProgress(userId: string): ProductGuideProgress {
  if (typeof window === "undefined") return { seen: [], flags: {} }

  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return { seen: [], flags: {} }
    const parsed = JSON.parse(raw) as unknown
    const normalized = normalizeProgress(parsed)
    const rawSeenLength =
      parsed && typeof parsed === "object" && Array.isArray((parsed as { seen?: unknown }).seen)
        ? (parsed as { seen: unknown[] }).seen.length
        : 0
    if (normalized.seen.length !== rawSeenLength) {
      writeProductGuideProgress(userId, normalized)
    }
    return normalized
  } catch {
    return { seen: [], flags: {} }
  }
}

export function writeProductGuideProgress(userId: string, progress: ProductGuideProgress): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(progress))
  } catch {
    // ignore quota / private mode
  }
}

export function markProductGuideStepSeen(userId: string, stepId: ProductGuideStepId): ProductGuideProgress {
  const current = readProductGuideProgress(userId)
  if (current.seen.includes(stepId)) return current

  const next: ProductGuideProgress = {
    ...current,
    seen: [...current.seen, stepId],
  }
  writeProductGuideProgress(userId, next)
  return next
}

export function setProductGuideFlag(
  userId: string,
  flag: keyof ProductGuideFlags,
  value: boolean,
): ProductGuideProgress {
  const current = readProductGuideProgress(userId)
  if (Boolean(current.flags[flag]) === value) return current

  const next: ProductGuideProgress = {
    ...current,
    flags: {
      ...current.flags,
      [flag]: value || undefined,
    },
  }
  writeProductGuideProgress(userId, next)
  return next
}
