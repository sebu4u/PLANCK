import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"
import {
  getFizicaMapItemCacheSuffix,
  type FizicaMapItemContext,
} from "@/lib/fizica-map-item-navigation"
import {
  getSubjectMapItemCacheSuffix,
  type SubjectMapItemContext,
} from "@/lib/subject-map/navigation"

function getMapContextCacheSuffix(
  fizicaMapContext?: FizicaMapItemContext | null,
  subjectMapContext?: SubjectMapItemContext | null,
): string {
  if (fizicaMapContext) return getFizicaMapItemCacheSuffix(fizicaMapContext)
  if (subjectMapContext) return getSubjectMapItemCacheSuffix(subjectMapContext)
  return ""
}

const itemPayloadCache = new Map<string, LearningPathItemPayload>()

export type LearningPathItemFetchResult =
  | { status: "ok"; payload: LearningPathItemPayload }
  | { status: "locked" }
  | { status: "not_found" }
  | { status: "error" }

export function getLearningPathItemCacheKey(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  fizicaMapContext?: FizicaMapItemContext | null,
  subjectMapContext?: SubjectMapItemContext | null,
): string {
  return `${chapterSlug}/${lessonSlug}/${itemIndex}${getMapContextCacheSuffix(fizicaMapContext, subjectMapContext)}`
}

export function getCachedLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  fizicaMapContext?: FizicaMapItemContext | null,
  subjectMapContext?: SubjectMapItemContext | null,
): LearningPathItemPayload | undefined {
  return itemPayloadCache.get(
    getLearningPathItemCacheKey(chapterSlug, lessonSlug, itemIndex, fizicaMapContext, subjectMapContext),
  )
}

export function setCachedLearningPathItemPayload(payload: LearningPathItemPayload): void {
  itemPayloadCache.set(
    getLearningPathItemCacheKey(
      payload.chapterSlug,
      payload.lessonSlug,
      payload.itemIndex,
      payload.fizicaMapContext,
      payload.subjectMapContext,
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
  options?: {
    silent?: boolean
    fizicaMapContext?: FizicaMapItemContext | null
    subjectMapContext?: SubjectMapItemContext | null
  },
): Promise<LearningPathItemFetchResult> {
  const fizicaMapContext = options?.fizicaMapContext ?? null
  const subjectMapContext = options?.subjectMapContext ?? null
  const cached = getCachedLearningPathItemPayload(
    chapterSlug,
    lessonSlug,
    itemIndex,
    fizicaMapContext,
    subjectMapContext,
  )
  if (cached) return { status: "ok", payload: cached }

  try {
    const querySuffix = getMapContextCacheSuffix(fizicaMapContext, subjectMapContext)
    const res = await fetch(
      `/api/learning-path/items/${encodeURIComponent(chapterSlug)}/${encodeURIComponent(lessonSlug)}/${itemIndex}${querySuffix}`,
      { cache: "no-store" },
    )

    if (res.status === 403) {
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
  subjectMapContext?: SubjectMapItemContext | null,
): void {
  if (itemIndex < 1) return
  if (getCachedLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, fizicaMapContext, subjectMapContext)) {
    return
  }
  void fetchLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, {
    silent: true,
    fizicaMapContext,
    subjectMapContext,
  })
}

const LEARNING_PATH_PREFETCH_RADIUS = 1

function isSameItemRoute(
  a: { chapterSlug: string; lessonSlug: string; itemIndex: number },
  b: { chapterSlug: string; lessonSlug: string; itemIndex: number },
): boolean {
  return a.chapterSlug === b.chapterSlug && a.lessonSlug === b.lessonSlug && a.itemIndex === b.itemIndex
}

export function prefetchNearbyLearningPathItems(payload: LearningPathItemPayload): void {
  const assignmentItems = payload.fizicaAssignmentItems ?? payload.subjectMapAssignmentItems
  const mapContext = payload.fizicaMapContext ?? payload.subjectMapContext

  if (mapContext && assignmentItems?.length) {
    const currentIndex = assignmentItems.findIndex((item) =>
      isSameItemRoute(item, payload),
    )
    if (currentIndex < 0) return

    const firstAssignmentIndex = Math.max(0, currentIndex - LEARNING_PATH_PREFETCH_RADIUS)
    const lastAssignmentIndex = Math.min(
      assignmentItems.length - 1,
      currentIndex + LEARNING_PATH_PREFETCH_RADIUS,
    )

    for (let index = firstAssignmentIndex; index <= lastAssignmentIndex; index += 1) {
      const item = assignmentItems[index]
      if (!item || isSameItemRoute(item, payload)) continue
      prefetchLearningPathItem(
        item.chapterSlug,
        item.lessonSlug,
        item.itemIndex,
        payload.fizicaMapContext,
        payload.subjectMapContext,
      )
    }
    return
  }

  const firstIndex = Math.max(1, payload.itemIndex - LEARNING_PATH_PREFETCH_RADIUS)
  const lastIndex = Math.min(payload.items.length, payload.itemIndex + LEARNING_PATH_PREFETCH_RADIUS)

  for (let index = firstIndex; index <= lastIndex; index += 1) {
    if (index === payload.itemIndex) continue
    prefetchLearningPathItem(payload.chapterSlug, payload.lessonSlug, index)
  }
}
