"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { useProductGuideBlocking } from "@/components/product-guide/product-guide-blocking"
import { PRODUCT_GUIDE_SHOW_DELAY_MS } from "@/lib/product-guide/dom"
import {
  pickActiveProductGuideStep,
  shouldTrackLearningPathItemVisit,
} from "@/lib/product-guide/steps"
import {
  markProductGuideStepSeen,
  readProductGuideProgress,
  setProductGuideFlag,
} from "@/lib/product-guide/storage"
import type { ProductGuideProgress, ProductGuideStep } from "@/lib/product-guide/types"
import { normalizeUserType } from "@/lib/user-types"

const MOBILE_SHELL_MEDIA = "(max-width: 947px)"

function progressEqual(a: ProductGuideProgress, b: ProductGuideProgress): boolean {
  if (a.seen.length !== b.seen.length) return false
  if (a.seen.some((id, i) => id !== b.seen[i])) return false
  return Boolean(a.flags.visitedLearningPathItem) === Boolean(b.flags.visitedLearningPathItem)
}

export function useProductGuide() {
  const pathname = usePathname()
  const { user, loading, needsOnboarding, userType, profileSyncedUserId } = useAuth()
  const { isBlocked } = useProductGuideBlocking()

  const [progress, setProgress] = useState<ProductGuideProgress>({ seen: [], flags: {} })
  const [readyStep, setReadyStep] = useState<ProductGuideStep | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [viewportReady, setViewportReady] = useState(false)
  /** After dismissing a tip, don't show another on the same pathname until navigation. */
  const suppressPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    const media = window.matchMedia(MOBILE_SHELL_MEDIA)
    const sync = () => {
      setIsMobile(media.matches)
      setViewportReady(true)
    }
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  const userId = user?.id ?? null
  const profileReady = Boolean(userId && profileSyncedUserId === userId)
  const eligible =
    Boolean(userId) &&
    profileReady &&
    !loading &&
    !needsOnboarding &&
    !isBlocked

  useEffect(() => {
    if (!userId || !profileReady) {
      setProgress({ seen: [], flags: {} })
      return
    }

    let next = readProductGuideProgress(userId)

    if (shouldTrackLearningPathItemVisit(pathname) && !next.flags.visitedLearningPathItem) {
      next = setProductGuideFlag(userId, "visitedLearningPathItem", true)
    }

    setProgress((prev) => (progressEqual(prev, next) ? prev : next))
  }, [userId, profileReady, pathname])

  // Clear same-page suppress when the route changes
  useEffect(() => {
    if (suppressPathnameRef.current && suppressPathnameRef.current !== pathname) {
      suppressPathnameRef.current = null
    }
  }, [pathname])

  useEffect(() => {
    setReadyStep(null)

    if (!eligible || !userId || !pathname || !viewportReady) return
    if (suppressPathnameRef.current === pathname) return

    const candidate = pickActiveProductGuideStep(
      normalizeUserType(userType),
      pathname,
      progress,
      { isMobile },
    )
    if (!candidate) return

    const delay = candidate.showDelayMs ?? PRODUCT_GUIDE_SHOW_DELAY_MS

    const timer = window.setTimeout(() => {
      if (suppressPathnameRef.current === pathname) return

      const latest = readProductGuideProgress(userId)
      const stillActive = pickActiveProductGuideStep(
        normalizeUserType(userType),
        pathname,
        latest,
        { isMobile },
      )
      if (stillActive?.id === candidate.id) {
        setReadyStep(stillActive)
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [eligible, userId, pathname, progress, userType, isMobile, viewportReady])

  useEffect(() => {
    if (isBlocked) setReadyStep(null)
  }, [isBlocked])

  const dismiss = useCallback(() => {
    if (!userId || !readyStep) return
    const next = markProductGuideStepSeen(userId, readyStep.id)
    const following = pickActiveProductGuideStep(
      normalizeUserType(userType),
      pathname ?? "",
      next,
      { isMobile },
    )
    suppressPathnameRef.current = following ? null : pathname
    setProgress(next)
    setReadyStep(null)
  }, [userId, readyStep, pathname, userType, isMobile])

  return {
    activeStep: readyStep,
    dismiss,
  }
}
