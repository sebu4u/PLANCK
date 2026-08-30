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
import { getFizicaMapHref } from "@/lib/supabase-fizica-learning-map"
import { getSubjectMapHref } from "@/lib/subject-map/navigation"
import { GUEST_DEMO_SIGNUP_PATH, getGuestDemoStatus, markGuestDemoCompleted } from "@/lib/onboarding"
import { endOnboardingLessonHandoff } from "@/lib/onboarding-lesson-handoff"
import { trackFunnelEvent } from "@/lib/funnel-analytics"

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

function resolveLessonExitHref(payload: LearningPathItemPayload): string {
  if (payload.isOnboardingLesson) return "/dashboard"
  if (payload.fizicaMapContext) {
    return getFizicaMapHref(
      payload.fizicaMapContext.routeSlug,
      payload.fizicaMapContext.chapterSlug,
    )
  }
  if (payload.subjectMapContext) {
    return getSubjectMapHref(
      payload.subjectMapContext.subject,
      payload.subjectMapContext.routeSlug,
      payload.subjectMapContext.chapterSlug,
    )
  }
  return payload.lessonBaseHref
}

function resolveOnboardingFinishHref(isGuest: boolean): string {
  if (!isGuest) return "/dashboard"
  const status = getGuestDemoStatus()
  if (status === "started" || status === "completed") {
    if (status === "started") markGuestDemoCompleted()
    return GUEST_DEMO_SIGNUP_PATH
  }
  return "/dashboard"
}

function resolveCompletionFinishHref(payload: LearningPathItemPayload, isGuest: boolean): string {
  if (payload.isOnboardingLesson) return resolveOnboardingFinishHref(isGuest)
  if (payload.fizicaMapContext || payload.subjectMapContext) {
    return payload.nextItemHref
  }
  return payload.lessonBaseHref
}

/** True when this visit completed ≥2 adjacent items in lesson order (ignores prior progress). */
function hasMinConsecutiveSessionCompletions(
  items: ReadonlyArray<{ id: string }>,
  sessionCompletedIds: ReadonlySet<string>,
  min = 2,
): boolean {
  if (sessionCompletedIds.size < min) return false
  let streak = 0
  for (const item of items) {
    if (sessionCompletedIds.has(item.id)) {
      streak += 1
      if (streak >= min) return true
    } else {
      streak = 0
    }
  }
  return false
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
  const [completionExitHref, setCompletionExitHref] = useState<string | null>(null)
  // Masks the brief flash while navigating away from the onboarding lesson's offer step to
  // /dashboard, with the same loading screen used elsewhere (dashboard load, name-save redirect).
  const [isLeavingToDashboard, setIsLeavingToDashboard] = useState(false)
  const lastUserIdRef = useRef<string | null | undefined>(undefined)
  const isPopstateRef = useRef(false)
  const eligibleForFirstItemEntryRef = useRef(initialPayload.itemIndex === 1)
  const [firstItemEntryConsumed, setFirstItemEntryConsumed] = useState(false)
  const sessionCompletedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        endOnboardingLessonHandoff()
      })
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [])

  useEffect(() => {
    trackFunnelEvent("lesson_started", {
      chapter: initialPayload.chapterSlug,
      lesson: initialPayload.lessonSlug,
      item_index: payload.itemIndex,
    })
  }, [initialPayload.chapterSlug, initialPayload.lessonSlug, payload.itemIndex])
  const baselineCompletedIdsRef = useRef<Set<string>>(
    new Set(initialPayload.completedItemIdsForLesson ?? []),
  )
  const usesFizicaLessonCompletionScreen = true

  const animateFirstItemEntry =
    eligibleForFirstItemEntryRef.current &&
    !firstItemEntryConsumed &&
    payload.itemIndex === 1

  const openLessonCompletion = useCallback((exitHref: string) => {
    setCompletionExitHref(exitHref)
    setShowLessonCompletion(true)
  }, [])

  const recordSessionItemCompletion = useCallback((itemId: string) => {
    if (!itemId) return
    if (baselineCompletedIdsRef.current.has(itemId)) return
    sessionCompletedIdsRef.current.add(itemId)
  }, [])

  const wasCompletedAtSessionStart = useCallback((itemId: string) => {
    return baselineCompletedIdsRef.current.has(itemId)
  }, [])

  const leaveLearningPath = useCallback(
    (exitHref: string, options?: { forceCompletion?: boolean }) => {
      if (
        !options?.forceCompletion &&
        !hasMinConsecutiveSessionCompletions(
          payload.items,
          sessionCompletedIdsRef.current,
          2,
        )
      ) {
        if (
          payload.isOnboardingLesson ||
          exitHref === "/dashboard" ||
          exitHref.startsWith("/register")
        ) {
          setIsLeavingToDashboard(true)
        }
        router.push(exitHref)
        return
      }
      openLessonCompletion(exitHref)
    },
    [openLessonCompletion, payload.isOnboardingLesson, payload.items, router],
  )

  const requestLessonExit = useCallback(() => {
    leaveLearningPath(resolveLessonExitHref(payload))
  }, [leaveLearningPath, payload])

  useEffect(() => {
    // New lesson visit → reset session streak; keep only progress already done before entry.
    sessionCompletedIdsRef.current = new Set()
    baselineCompletedIdsRef.current = new Set(payload.completedItemIdsForLesson ?? [])
  }, [payload.lessonId])

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
      openLessonCompletion(resolveCompletionFinishHref(payload, !user))
      return
    }

    const assignmentItems = getMapAssignmentItems(payload)
    if ((payload.fizicaMapContext || payload.subjectMapContext) && assignmentItems?.length) {
      if (payload.isLastItem) {
        openLessonCompletion(resolveCompletionFinishHref(payload, !user))
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
      openLessonCompletion(resolveCompletionFinishHref(payload, !user))
      return
    }
    await goToItemIndex(payload.itemIndex + 1, { urlMode: "push", direction: "forward" })
  }, [goToItem, goToItemIndex, openLessonCompletion, payload, user])

  const dismissLessonCompletion = useCallback(() => {
    const exitHref =
      completionExitHref ??
      (payload.isOnboardingLesson ? resolveOnboardingFinishHref(!user) : payload.nextItemHref)
    setShowLessonCompletion(false)
    setCompletionExitHref(null)
    if (payload.isOnboardingLesson || exitHref === "/dashboard" || exitHref.startsWith("/register")) {
      setIsLeavingToDashboard(true)
    }
    router.push(exitHref)
  }, [completionExitHref, payload.isOnboardingLesson, payload.nextItemHref, router, user])

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
    leaveLearningPath(getLearningPathPaywallDismissHref(payload.lessonBaseHref, returnSource), {
      forceCompletion: true,
    })
  }, [leaveLearningPath, payload.lessonBaseHref])

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
        requestLessonExit={requestLessonExit}
        recordSessionItemCompletion={recordSessionItemCompletion}
        wasCompletedAtSessionStart={wasCompletedAtSessionStart}
      />
      {showLessonCompletion ? (
        <FizicaLessonCompletionScreen
          totalElo={
            payload.fizicaLessonTotalElo ??
            payload.subjectMapLessonTotalElo ??
            computeLearningPathLessonEloTotal(payload.items)
          }
          itemIds={payload.items.map((lessonItem) => lessonItem.id)}
          showOfferPhase={payload.isOnboardingLesson && Boolean(user)}
          onContinue={dismissLessonCompletion}
        />
      ) : null}
      {freePlanPaywallVisible ? (
        <FreePlanLearningPathItemsPaywall onClose={dismissFreePlanPaywall} />
      ) : null}
    </>
  )
}
