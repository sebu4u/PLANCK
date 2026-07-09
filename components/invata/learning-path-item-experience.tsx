"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"
import {
  clearLearningPathItemCache,
  fetchLearningPathItemPayload,
  getCachedLearningPathItemPayload,
  prefetchNearbyLearningPathItems,
  setCachedLearningPathItemPayload,
  type LearningPathItemFetchResult,
} from "@/lib/learning-path-item-client-cache"
import {
  appendLearningPathItemReturnFromLocation,
  getLearningPathItemReturnSourceFromLocation,
  getLearningPathPaywallDismissHref,
} from "@/lib/learning-path-item-return"
import { appendFizicaMapItemQuery } from "@/lib/fizica-map-item-navigation"
import { appendSubjectMapItemQuery } from "@/lib/subject-map/navigation"
import type { SubjectMapAssignmentItemRoute } from "@/lib/subject-map/types"
import { LearningPathItemView } from "@/components/invata/learning-path-item-view"
import { FreePlanLearningPathItemsPaywall } from "@/components/invata/free-plan-learning-path-items-paywall"
import { FizicaLessonCompletionScreen } from "@/components/invata/fizica-lesson-completion-screen"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { computeLearningPathLessonEloTotal } from "@/lib/learning-path-elo"
import type { LearningPathSlideDirection } from "@/components/invata/learning-path-item-slide-container"

interface LearningPathItemExperienceProps {
  initialPayload: LearningPathItemPayload
}

type MapAssignmentItemRoute = SubjectMapAssignmentItemRoute

const FREE_PLAN_PAYWALL_DELAY_MS = 1000

function buildItemUrl(payload: LearningPathItemPayload): string {
  const base = `${payload.lessonBaseHref}/${payload.itemIndex}`
  let url = base
  if (payload.fizicaMapContext) {
    url = appendFizicaMapItemQuery(url, payload.fizicaMapContext)
  }
  if (payload.subjectMapContext) {
    url = appendSubjectMapItemQuery(url, payload.subjectMapContext)
  }
  return appendLearningPathItemReturnFromLocation(url)
}

function getMapAssignmentItems(payload: LearningPathItemPayload): MapAssignmentItemRoute[] | undefined {
  return payload.fizicaAssignmentItems ?? payload.subjectMapAssignmentItems
}

function isSameItemRoute(
  a: MapAssignmentItemRoute,
  b: MapAssignmentItemRoute,
): boolean {
  return a.chapterSlug === b.chapterSlug && a.lessonSlug === b.lessonSlug && a.itemIndex === b.itemIndex
}

function findMapAssignmentIndex(
  items: MapAssignmentItemRoute[],
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
  const [freePlanPaywallDue, setFreePlanPaywallDue] = useState(initialPayload.showFreePlanPaywall ?? false)
  const [freePlanPaywallVisible, setFreePlanPaywallVisible] = useState(false)
  const [slideDirection, setSlideDirection] = useState<LearningPathSlideDirection>("forward")
  const [showLessonCompletion, setShowLessonCompletion] = useState(false)
  // Masks the brief flash while navigating away from the onboarding lesson's offer step to
  // /dashboard, with the same loading screen used elsewhere (dashboard load, name-save redirect).
  const [isLeavingToDashboard, setIsLeavingToDashboard] = useState(false)
  const lastUserIdRef = useRef<string | null | undefined>(undefined)
  const isPopstateRef = useRef(false)
  const eligibleForFirstItemEntryRef = useRef(initialPayload.itemIndex === 1)
  const [firstItemEntryConsumed, setFirstItemEntryConsumed] = useState(false)
  const usesFizicaLessonCompletionScreen = Boolean(
    payload.fizicaMapContext || payload.subjectMapContext || payload.isOnboardingLesson,
  )

  const animateFirstItemEntry =
    eligibleForFirstItemEntryRef.current &&
    !firstItemEntryConsumed &&
    payload.itemIndex === 1

  useEffect(() => {
    if (payload.itemIndex !== 1 && eligibleForFirstItemEntryRef.current) {
      setFirstItemEntryConsumed(true)
    }
  }, [payload.itemIndex])

  useEffect(() => {
    if (!freePlanPaywallDue) {
      setFreePlanPaywallVisible(false)
      return
    }

    const timer = window.setTimeout(() => {
      setFreePlanPaywallVisible(true)
    }, FREE_PLAN_PAYWALL_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [freePlanPaywallDue, payload.item.id])

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
        prefetchNearbyLearningPathItems(next)
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
      subjectMapContext: LearningPathItemPayload["subjectMapContext"],
    ): Promise<LearningPathItemFetchResult> => {
      return fetchLearningPathItemPayload(chapterSlug, lessonSlug, itemIndex, {
        fizicaMapContext,
        subjectMapContext,
      })
    },
    [],
  )

  const goToItem = useCallback(
    async (
      target: MapAssignmentItemRoute,
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
            const assignmentItems = getMapAssignmentItems(payload)
            if ((payload.fizicaMapContext || payload.subjectMapContext) && assignmentItems?.length) {
              const fromIndex = findMapAssignmentIndex(assignmentItems, payload)
              const toIndex = assignmentItems.findIndex((item) =>
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
        payload.subjectMapContext,
      )
      if (cached) {
        applyPayload(cached, { urlMode: options?.urlMode })
        setFreePlanPaywallDue(cached.showFreePlanPaywall ?? false)
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
          payload.subjectMapContext,
        )
        if (result.status === "ok") {
          applyPayload(result.payload, { urlMode: options?.urlMode })
          setFreePlanPaywallDue(result.payload.showFreePlanPaywall ?? false)
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
    if (payload.isOnboardingLesson && payload.isLastItem) {
      setShowLessonCompletion(true)
      return
    }

    const assignmentItems = getMapAssignmentItems(payload)
    if ((payload.fizicaMapContext || payload.subjectMapContext) && assignmentItems?.length) {
      if (payload.isLastItem) {
        setShowLessonCompletion(true)
        return
      }
      const currentIndex = findMapAssignmentIndex(assignmentItems, payload)
      const nextItem = assignmentItems[currentIndex + 1]
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
    if (payload.isOnboardingLesson) {
      setIsLeavingToDashboard(true)
    }
    router.push(payload.isOnboardingLesson ? "/dashboard" : payload.nextItemHref)
  }, [payload.isOnboardingLesson, payload.nextItemHref, router])

  const goToPrevItem = useCallback(async () => {
    const assignmentItems = getMapAssignmentItems(payload)
    if ((payload.fizicaMapContext || payload.subjectMapContext) && assignmentItems?.length) {
      const currentIndex = findMapAssignmentIndex(assignmentItems, payload)
      const prevItem = currentIndex > 0 ? assignmentItems[currentIndex - 1] : null
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
    prefetchNearbyLearningPathItems(initialPayload)
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
    setFreePlanPaywallDue(false)
    void (async () => {
      const refreshed = await loadItem(
        payload.chapterSlug,
        payload.lessonSlug,
        payload.itemIndex,
        payload.fizicaMapContext,
        payload.subjectMapContext,
      )
      if (refreshed.status === "ok") {
        applyPayload(refreshed.payload, { skipPrefetch: false })
        setFreePlanPaywallDue(refreshed.payload.showFreePlanPaywall ?? false)
      }
    })()
  }, [applyPayload, loadItem, payload.chapterSlug, payload.fizicaMapContext, payload.subjectMapContext, payload.itemIndex, payload.lessonSlug, user?.id])

  useEffect(() => {
    const handlePopState = () => {
      const assignmentItems = getMapAssignmentItems(payload)
      if ((payload.fizicaMapContext || payload.subjectMapContext) && assignmentItems?.length) {
        const targetPath = window.location.pathname
        const targetItem = assignmentItems.find((item) => {
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
        setFreePlanPaywallDue(false)
        return
      }

      isPopstateRef.current = true
      void goToItemIndex(targetIndex, { urlMode: "replace" })
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [goToItem, goToItemIndex, payload, payload.itemIndex])

  const dismissFreePlanPaywall = useCallback(() => {
    setFreePlanPaywallDue(false)
    setFreePlanPaywallVisible(false)
    const returnSource = getLearningPathItemReturnSourceFromLocation()
    router.push(getLearningPathPaywallDismissHref(payload.lessonBaseHref, returnSource))
  }, [payload.lessonBaseHref, router])

  if (isLeavingToDashboard) {
    return <LoadingVideoOverlay zIndex={500} />
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
          totalElo={
            payload.fizicaLessonTotalElo ??
            payload.subjectMapLessonTotalElo ??
            (payload.isOnboardingLesson ? computeLearningPathLessonEloTotal(payload.items) : 0)
          }
          showOfferPhase={payload.isOnboardingLesson}
          onContinue={dismissLessonCompletion}
        />
      ) : null}
      {freePlanPaywallVisible ? (
        <FreePlanLearningPathItemsPaywall onClose={dismissFreePlanPaywall} />
      ) : null}
    </>
  )
}
