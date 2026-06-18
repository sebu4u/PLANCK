"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"
import {
  clearLearningPathItemCache,
  fetchLearningPathItemPayload,
  getCachedLearningPathItemPayload,
  prefetchAllLearningPathItems,
  setCachedLearningPathItemPayload,
  type LearningPathItemFetchResult,
} from "@/lib/learning-path-item-client-cache"
import { appendFizicaMapItemQuery } from "@/lib/fizica-map-item-navigation"
import type { FizicaMapAssignmentItemRoute } from "@/lib/supabase-fizica-learning-map"
import { LearningPathItemView } from "@/components/invata/learning-path-item-view"
import { FreePlanComparisonScreen } from "@/components/invata/free-plan-comparison-screen"
import { FizicaLessonCompletionScreen } from "@/components/invata/fizica-lesson-completion-screen"
import type { LearningPathSlideDirection } from "@/components/invata/learning-path-item-slide-container"

interface LearningPathItemExperienceProps {
  initialPayload: LearningPathItemPayload
}

function buildItemUrl(payload: LearningPathItemPayload): string {
  const base = `${payload.lessonBaseHref}/${payload.itemIndex}`
  if (payload.fizicaMapContext) {
    return appendFizicaMapItemQuery(base, payload.fizicaMapContext)
  }
  return base
}

function isSameItemRoute(
  a: FizicaMapAssignmentItemRoute,
  b: FizicaMapAssignmentItemRoute,
): boolean {
  return a.chapterSlug === b.chapterSlug && a.lessonSlug === b.lessonSlug && a.itemIndex === b.itemIndex
}

function findFizicaAssignmentIndex(
  items: FizicaMapAssignmentItemRoute[],
  payload: LearningPathItemPayload,
): number {
  return items.findIndex((item) =>
    isSameItemRoute(item, {
      chapterSlug: payload.chapterSlug,
      lessonSlug: payload.lessonSlug,
      itemIndex: payload.itemIndex,
    }),
  )
}

export function LearningPathItemExperience({ initialPayload }: LearningPathItemExperienceProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [payload, setPayload] = useState(initialPayload)
  const [isNavigating, setIsNavigating] = useState(false)
  const [freePlanPaywall, setFreePlanPaywall] = useState<{ lessonBaseHref: string } | null>(null)
  const [slideDirection, setSlideDirection] = useState<LearningPathSlideDirection>("forward")
  const [showLessonCompletion, setShowLessonCompletion] = useState(false)
  const lastUserIdRef = useRef<string | null | undefined>(undefined)
  const isPopstateRef = useRef(false)
  const eligibleForFirstItemEntryRef = useRef(initialPayload.itemIndex === 1)
  const [firstItemEntryConsumed, setFirstItemEntryConsumed] = useState(false)
  const usesFizicaLessonCompletionScreen = Boolean(payload.fizicaMapContext)

  const animateFirstItemEntry =
    eligibleForFirstItemEntryRef.current &&
    !firstItemEntryConsumed &&
    payload.itemIndex === 1

  useEffect(() => {
    if (payload.itemIndex !== 1 && eligibleForFirstItemEntryRef.current) {
      setFirstItemEntryConsumed(true)
    }
  }, [payload.itemIndex])

  const syncUrl = useCallback((next: LearningPathItemPayload, mode: "replace" | "push" = "replace") => {
    const url = buildItemUrl(next)
    if (mode === "push") {
      window.history.pushState({ learningPathItemIndex: next.itemIndex }, "", url)
    } else {
      window.history.replaceState({ learningPathItemIndex: next.itemIndex }, "", url)
    }
  }, [])

  const applyPayload = useCallback(
    (next: LearningPathItemPayload, options?: { urlMode?: "replace" | "push"; skipPrefetch?: boolean }) => {
      setCachedLearningPathItemPayload(next)
      setPayload(next)
      if (!isPopstateRef.current) {
        syncUrl(next, options?.urlMode ?? "replace")
      }
      if (!options?.skipPrefetch) {
        prefetchAllLearningPathItems(next)
      }
    },
    [syncUrl],
  )

  const loadItem = useCallback(
    async (
      chapterSlug: string,
      lessonSlug: string,
      itemIndex: number,
      fizicaMapContext: LearningPathItemPayload["fizicaMapContext"],
    ): Promise<LearningPathItemFetchResult> => {
      return fetchLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, { fizicaMapContext })
    },
    [],
  )

  const goToItem = useCallback(
    async (
      target: FizicaMapAssignmentItemRoute,
      options?: { urlMode?: "replace" | "push"; direction?: LearningPathSlideDirection },
    ) => {
      if (
        target.chapterSlug === payload.chapterSlug &&
        target.lessonSlug === payload.lessonSlug &&
        target.itemIndex === payload.itemIndex
      ) {
        return
      }

      setSlideDirection(
        options?.direction ??
          (() => {
            if (payload.fizicaMapContext && payload.fizicaAssignmentItems?.length) {
              const fromIndex = findFizicaAssignmentIndex(payload.fizicaAssignmentItems, payload)
              const toIndex = payload.fizicaAssignmentItems.findIndex((item) =>
                isSameItemRoute(item, target),
              )
              return toIndex > fromIndex ? "forward" : "backward"
            }
            return target.itemIndex > payload.itemIndex ? "forward" : "backward"
          })(),
      )

      const cached = getCachedLearningPathItemPayload(
        target.chapterSlug,
        target.lessonSlug,
        target.itemIndex,
        payload.fizicaMapContext,
      )
      if (cached) {
        setFreePlanPaywall(null)
        applyPayload(cached, { urlMode: options?.urlMode })
        isPopstateRef.current = false
        return
      }

      setIsNavigating(true)
      try {
        const result = await loadItem(
          target.chapterSlug,
          target.lessonSlug,
          target.itemIndex,
          payload.fizicaMapContext,
        )
        if (result.status === "ok") {
          setFreePlanPaywall(null)
          applyPayload(result.payload, { urlMode: options?.urlMode })
          return
        }
        if (result.status === "blocked") {
          setFreePlanPaywall({ lessonBaseHref: result.lessonBaseHref })
          if (!isPopstateRef.current) {
            const blockedPayload = { ...payload, ...target }
            const url = buildItemUrl(blockedPayload as LearningPathItemPayload)
            if (options?.urlMode === "push") {
              window.history.pushState({ learningPathItemIndex: target.itemIndex }, "", url)
            } else {
              window.history.replaceState({ learningPathItemIndex: target.itemIndex }, "", url)
            }
          }
          return
        }
        const fallbackUrl = buildItemUrl({
          ...payload,
          chapterSlug: target.chapterSlug,
          lessonSlug: target.lessonSlug,
          itemIndex: target.itemIndex,
          lessonBaseHref: `/invata/${target.chapterSlug}/${target.lessonSlug}`,
        })
        router.push(fallbackUrl)
      } finally {
        setIsNavigating(false)
        isPopstateRef.current = false
      }
    },
    [applyPayload, loadItem, payload, router],
  )

  const goToItemIndex = useCallback(
    async (
      targetIndex: number,
      options?: { urlMode?: "replace" | "push"; direction?: LearningPathSlideDirection },
    ) => {
      await goToItem(
        {
          chapterSlug: payload.chapterSlug,
          lessonSlug: payload.lessonSlug,
          itemIndex: targetIndex,
        },
        options,
      )
    },
    [goToItem, payload.chapterSlug, payload.lessonSlug],
  )

  const goToNextItem = useCallback(async () => {
    if (payload.fizicaMapContext && payload.fizicaAssignmentItems?.length) {
      if (payload.isLastItem) {
        setShowLessonCompletion(true)
        return
      }
      const currentIndex = findFizicaAssignmentIndex(payload.fizicaAssignmentItems, payload)
      const nextItem = payload.fizicaAssignmentItems[currentIndex + 1]
      if (nextItem) {
        await goToItem(nextItem, { urlMode: "push", direction: "forward" })
      }
      return
    }

    if (payload.isLastItem) {
      router.push(payload.lessonBaseHref)
      return
    }
    await goToItemIndex(payload.itemIndex + 1, { urlMode: "push", direction: "forward" })
  }, [goToItem, goToItemIndex, payload, router])

  const dismissLessonCompletion = useCallback(() => {
    setShowLessonCompletion(false)
    router.push(payload.nextItemHref)
  }, [payload.nextItemHref, router])

  const goToPrevItem = useCallback(async () => {
    if (payload.fizicaMapContext && payload.fizicaAssignmentItems?.length) {
      const currentIndex = findFizicaAssignmentIndex(payload.fizicaAssignmentItems, payload)
      const prevItem = currentIndex > 0 ? payload.fizicaAssignmentItems[currentIndex - 1] : null
      if (prevItem) {
        await goToItem(prevItem, { urlMode: "push", direction: "backward" })
      }
      return
    }

    if (payload.itemIndex <= 1) return
    await goToItemIndex(payload.itemIndex - 1, { urlMode: "push", direction: "backward" })
  }, [goToItem, goToItemIndex, payload])

  useEffect(() => {
    setCachedLearningPathItemPayload(initialPayload)
    prefetchAllLearningPathItems(initialPayload)
  }, [initialPayload])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [payload.itemIndex, payload.item.id])

  useEffect(() => {
    if (lastUserIdRef.current === undefined) {
      lastUserIdRef.current = user?.id ?? null
      return
    }
    if (lastUserIdRef.current === (user?.id ?? null)) return
    lastUserIdRef.current = user?.id ?? null

    clearLearningPathItemCache()
    setFreePlanPaywall(null)
    void (async () => {
      const refreshed = await loadItem(
        payload.chapterSlug,
        payload.lessonSlug,
        payload.itemIndex,
        payload.fizicaMapContext,
      )
      if (refreshed.status === "ok") {
        applyPayload(refreshed.payload, { skipPrefetch: false })
      }
    })()
  }, [applyPayload, loadItem, payload.chapterSlug, payload.fizicaMapContext, payload.itemIndex, payload.lessonSlug, user?.id])

  useEffect(() => {
    const handlePopState = () => {
      if (payload.fizicaMapContext && payload.fizicaAssignmentItems?.length) {
        const targetPath = window.location.pathname
        const targetItem = payload.fizicaAssignmentItems.find((item) => {
          const itemPath = `/invata/${item.chapterSlug}/${item.lessonSlug}/${item.itemIndex}`
          return targetPath === itemPath
        })
        if (targetItem) {
          isPopstateRef.current = true
          void goToItem(targetItem, { urlMode: "replace" })
        }
        return
      }

      const parts = window.location.pathname.split("/").filter(Boolean)
      if (parts[0] !== "invata" || parts.length < 4) return
      const targetIndex = Number.parseInt(parts[3] ?? "", 10)
      if (!Number.isFinite(targetIndex) || targetIndex < 1) return

      if (targetIndex === payload.itemIndex) {
        setFreePlanPaywall(null)
        return
      }

      isPopstateRef.current = true
      void goToItemIndex(targetIndex, { urlMode: "replace" })
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [goToItem, goToItemIndex, payload.fizicaAssignmentItems, payload.fizicaMapContext, payload.itemIndex])

  if (freePlanPaywall) {
    return (
      <main className="min-h-screen bg-[#ffffff]">
        <FreePlanComparisonScreen backHref={freePlanPaywall.lessonBaseHref} />
      </main>
    )
  }

  return (
    <>
      <LearningPathItemView
        payload={payload}
        goToNextItem={goToNextItem}
        goToPrevItem={goToPrevItem}
        isNavigating={isNavigating}
        slideDirection={slideDirection}
        usesFizicaLessonCompletionScreen={usesFizicaLessonCompletionScreen}
        animateFirstItemEntry={animateFirstItemEntry}
      />
      {showLessonCompletion ? (
        <FizicaLessonCompletionScreen
          totalElo={payload.fizicaLessonTotalElo ?? 0}
          onContinue={dismissLessonCompletion}
        />
      ) : null}
    </>
  )
}
