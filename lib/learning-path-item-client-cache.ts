import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"
import {
  getFizicaMapItemCacheSuffix,
  type FizicaMapItemContext,
} from "@/lib/fizica-map-item-navigation"

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
  itemIndex: number,
  fizicaMapContext?: FizicaMapItemContext | null,
): string {
  return `${chapterSlug}/${lessonSlug}/${itemIndex}${getFizicaMapItemCacheSuffix(fizicaMapContext)}`
}

export function getCachedLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  fizicaMapContext?: FizicaMapItemContext | null,
): LearningPathItemPayload | undefined {
  return itemPayloadCache.get(
    getLearningPathItemCacheKey(chapterSlug, lessonSlug, itemIndex, fizicaMapContext),
  )
}

export function setCachedLearningPathItemPayload(payload: LearningPathItemPayload): void {
  itemPayloadCache.set(
    getLearningPathItemCacheKey(
      payload.chapterSlug,
      payload.lessonSlug,
      payload.itemIndex,
      payload.fizicaMapContext,
    ),
    payload,
  )
}

export function clearLearningPathItemCache(): void {
  itemPayloadCache.clear()
}

export async function fetchLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  options?: { silent?: boolean; fizicaMapContext?: FizicaMapItemContext | null },
): Promise<LearningPathItemFetchResult> {
  const fizicaMapContext = options?.fizicaMapContext ?? null
  const cached = getCachedLearningPathItemPayload(
    chapterSlug,
    lessonSlug,
    itemIndex,
    fizicaMapContext,
  )
  if (cached) return { status: "ok", payload: cached }

  try {
    const querySuffix = getFizicaMapItemCacheSuffix(fizicaMapContext)
    const res = await fetch(
      `/api/learning-path/items/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(lessonSlug)}/${itemIndex}${querySuffix}`,
      { cache: "no-store" },
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
  itemIndex: number,
  fizicaMapContext?: FizicaMapItemContext | null,
): void {
  if (itemIndex < 1) return
  if (getCachedLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, fizicaMapContext)) return
  void fetchLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, {
    silent: true,
    fizicaMapContext,
  })
}

function isSameItemRoute(
  a: { chapterSlug: string; lessonSlug: string; itemIndex: number },
  b: { chapterSlug: string; lessonSlug: string; itemIndex: number },
): boolean {
  return a.chapterSlug === b.chapterSlug && a.lessonSlug === b.lessonSlug && a.itemIndex === b.itemIndex
}

export function prefetchAllLearningPathItems(payload: LearningPathItemPayload): void {
  if (payload.fizicaMapContext && payload.fizicaAssignmentItems?.length) {
    for (const item of payload.fizicaAssignmentItems) {
      if (isSameItemRoute(item, payload)) continue
      prefetchLearningPathItem(
        item.chapterSlug,
        item.lessonSlug,
        item.itemIndex,
        payload.fizicaMapContext,
      )
    }
    return
  }

  for (let index = 1; index <= payload.items.length; index += 1) {
    if (index === payload.itemIndex) continue
    prefetchLearningPathItem(payload.chapterSlug, payload.lessonSlug, index)
  }
}
