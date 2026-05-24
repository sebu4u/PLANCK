import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"

const itemPayloadCache = new Map<string, LearningPathItemPayload>()

export type LearningPathItemFetchResult =
  | { status: "ok"; payload: LearningPathItemPayload }
  | { status: "blocked"; lessonBaseHref: string }
  | { status: "locked" }
  | { status: "not_found" }
  | { status: "error" }

export function getLearningPathItemCacheKey(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number
): string {
  return `${chapterSlug}/${lessonSlug}/${itemIndex}`
}

export function getCachedLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number
): LearningPathItemPayload | undefined {
  return itemPayloadCache.get(getLearningPathItemCacheKey(chapterSlug, lessonSlug, itemIndex))
}

export function setCachedLearningPathItemPayload(payload: LearningPathItemPayload): void {
  itemPayloadCache.set(
    getLearningPathItemCacheKey(payload.chapterSlug, payload.lessonSlug, payload.itemIndex),
    payload
  )
}

export function clearLearningPathItemCache(): void {
  itemPayloadCache.clear()
}

export async function fetchLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  options?: { silent?: boolean }
): Promise<LearningPathItemFetchResult> {
  const cached = getCachedLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex)
  if (cached) return { status: "ok", payload: cached }

  try {
    const res = await fetch(
      `/api/learning-path/items/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(lessonSlug)}/${itemIndex}`,
      { cache: "no-store" }
    )

    if (res.status === 403) {
      const body = (await res.json().catch(() => null)) as {
        error?: string
        lessonBaseHref?: string
      } | null
      if (body?.error === "blocked" && body.lessonBaseHref) {
        return { status: "blocked", lessonBaseHref: body.lessonBaseHref }
      }
      return { status: "locked" }
    }

    if (res.status === 404) {
      return { status: "not_found" }
    }

    if (!res.ok) {
      if (!options?.silent) {
        console.error("Failed to fetch learning path item:", chapterSlug, lessonSlug, itemIndex, res.status)
      }
      return { status: "error" }
    }

    const data = (await res.json()) as LearningPathItemPayload
    if (data?.item?.id) {
      setCachedLearningPathItemPayload(data)
      return { status: "ok", payload: data }
    }
    return { status: "not_found" }
  } catch (error) {
    if (!options?.silent) {
      console.error("Failed to fetch learning path item:", chapterSlug, lessonSlug, itemIndex, error)
    }
    return { status: "error" }
  }
}

export function prefetchLearningPathItem(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number
): void {
  if (itemIndex < 1) return
  if (getCachedLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex)) return
  void fetchLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, { silent: true })
}
