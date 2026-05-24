"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"
import {
  clearLearningPathItemCache,
  fetchLearningPathItemPayload,
  prefetchLearningPathItem,
  setCachedLearningPathItemPayload,
  type LearningPathItemFetchResult,
} from "@/lib/learning-path-item-client-cache"
import { LearningPathItemView } from "@/components/invata/learning-path-item-view"
import { FreePlanComparisonScreen } from "@/components/invata/free-plan-comparison-screen"
import type { LearningPathSlideDirection } from "@/components/invata/learning-path-item-slide-container"

interface LearningPathItemExperienceProps {
  initialPayload: LearningPathItemPayload
}

function buildItemUrl(chapterSlug: string, lessonSlug: string, itemIndex: number): string {
  return `/invata/${chapterSlug}/${lessonSlug}/${itemIndex}`
}

function parseItemIndexFromPathname(pathname: string): number | null {
  const parts = pathname.split("/").filter(Boolean)
  if (parts[0] !== "invata" || parts.length < 4) return null
  const parsed = Number.parseInt(parts[3] ?? "", 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null
}

export function LearningPathItemExperience({ initialPayload }: LearningPathItemExperienceProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [payload, setPayload] = useState(initialPayload)
  const [isNavigating, setIsNavigating] = useState(false)
  const [freePlanPaywall, setFreePlanPaywall] = useState<{ lessonBaseHref: string } | null>(null)
  const [slideDirection, setSlideDirection] = useState<LearningPathSlideDirection>("forward")
  const lastUserIdRef = useRef<string | null | undefined>(undefined)
  const isPopstateRef = useRef(false)

  const prefetchAdjacent = useCallback((current: LearningPathItemPayload) => {
    if (current.itemIndex < current.items.length) {
      prefetchLearningPathItem(
        current.chapterSlug,
        current.lessonSlug,
        current.itemIndex + 1
      )
    }
  }, [])

  const syncUrl = useCallback((next: LearningPathItemPayload, mode: "replace" | "push" = "replace") => {
    const url = buildItemUrl(next.chapterSlug, next.lessonSlug, next.itemIndex)
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
        prefetchAdjacent(next)
      }
    },
    [prefetchAdjacent, syncUrl]
  )

  const loadItemAtIndex = useCallback(
    async (targetIndex: number): Promise<LearningPathItemFetchResult> => {
      return fetchLearningPathItemPayload(
        payload.chapterSlug,
        payload.lessonSlug,
        targetIndex
      )
    },
    [payload.chapterSlug, payload.lessonSlug]
  )

  const goToItemIndex = useCallback(
    async (
      targetIndex: number,
      options?: { urlMode?: "replace" | "push"; direction?: LearningPathSlideDirection }
    ) => {
      if (targetIndex === payload.itemIndex) return

      setSlideDirection(
        options?.direction ?? (targetIndex > payload.itemIndex ? "forward" : "backward")
      )
      setIsNavigating(true)
      try {
        const result = await loadItemAtIndex(targetIndex)
        if (result.status === "ok") {
          setFreePlanPaywall(null)
          applyPayload(result.payload, { urlMode: options?.urlMode })
          return
        }
        if (result.status === "blocked") {
          setFreePlanPaywall({ lessonBaseHref: result.lessonBaseHref })
          if (!isPopstateRef.current) {
            const url = buildItemUrl(payload.chapterSlug, payload.lessonSlug, targetIndex)
            if (options?.urlMode === "push") {
              window.history.pushState({ learningPathItemIndex: targetIndex }, "", url)
            } else {
              window.history.replaceState({ learningPathItemIndex: targetIndex }, "", url)
            }
          }
          return
        }
        router.push(buildItemUrl(payload.chapterSlug, payload.lessonSlug, targetIndex))
      } finally {
        setIsNavigating(false)
        isPopstateRef.current = false
      }
    },
    [applyPayload, loadItemAtIndex, payload.chapterSlug, payload.itemIndex, payload.lessonSlug, router]
  )

  const goToNextItem = useCallback(async () => {
    if (payload.isLastItem) {
      router.push(payload.lessonBaseHref)
      return
    }
    await goToItemIndex(payload.itemIndex + 1, { urlMode: "push", direction: "forward" })
  }, [goToItemIndex, payload.isLastItem, payload.itemIndex, payload.lessonBaseHref, router])

  const goToPrevItem = useCallback(async () => {
    if (payload.itemIndex <= 1) return
    await goToItemIndex(payload.itemIndex - 1, { urlMode: "push", direction: "backward" })
  }, [goToItemIndex, payload.itemIndex])

  useEffect(() => {
    setCachedLearningPathItemPayload(initialPayload)
    prefetchAdjacent(initialPayload)
  }, [initialPayload, prefetchAdjacent])

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
      const refreshed = await fetchLearningPathItemPayload(
        payload.chapterSlug,
        payload.lessonSlug,
        payload.itemIndex
      )
      if (refreshed.status === "ok") {
        applyPayload(refreshed.payload, { skipPrefetch: false })
      }
    })()
  }, [applyPayload, payload.chapterSlug, payload.itemIndex, payload.lessonSlug, user?.id])

  useEffect(() => {
    const handlePopState = () => {
      const targetIndex = parseItemIndexFromPathname(window.location.pathname)
      if (targetIndex == null) return

      if (targetIndex === payload.itemIndex) {
        setFreePlanPaywall(null)
        return
      }

      isPopstateRef.current = true
      void goToItemIndex(targetIndex, { urlMode: "replace" })
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [goToItemIndex, payload.itemIndex])

  if (freePlanPaywall) {
    return (
      <main className="min-h-screen bg-[#ffffff]">
        <FreePlanComparisonScreen backHref={freePlanPaywall.lessonBaseHref} />
      </main>
    )
  }

  return (
    <LearningPathItemView
      payload={payload}
      goToNextItem={goToNextItem}
      goToPrevItem={goToPrevItem}
      isNavigating={isNavigating}
      slideDirection={slideDirection}
    />
  )
}
