"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { FakeSolveSocialContent } from "@/components/dashboard/fake-solve-social-content"
import {
  buildFakeSolveNotification,
  type FakeSolveNotification,
  type FakeSolveProblem,
} from "@/lib/dashboard/fake-solve-social-proof"

const DASHBOARD_MOBILE_QUERY = "(max-width: 1023px)"
const MIN_DELAY_MS = 15_000
const MAX_DELAY_MS = 20_000
const DISPLAY_MS = 4_500
const EXIT_MS = 300

interface UseDashboardFakeSolveSocialProofOptions {
  enabled: boolean
  problemPool: FakeSolveProblem[]
}

function getNextDelay() {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1))
}

function isDashboardMobile() {
  return typeof window !== "undefined" && window.matchMedia(DASHBOARD_MOBILE_QUERY).matches
}

export function useDashboardFakeSolveSocialProof({
  enabled,
  problemPool,
}: UseDashboardFakeSolveSocialProofOptions) {
  const [mobileNotification, setMobileNotification] = useState<FakeSolveNotification | null>(null)
  const [mobileVisible, setMobileVisible] = useState(false)
  const scheduleTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const removeTimerRef = useRef<number | null>(null)

  const clearMobileTimers = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (removeTimerRef.current) {
      window.clearTimeout(removeTimerRef.current)
      removeTimerRef.current = null
    }
  }, [])

  const dismissMobileNotification = useCallback(() => {
    clearMobileTimers()
    setMobileVisible(false)
    removeTimerRef.current = window.setTimeout(() => {
      setMobileNotification(null)
      removeTimerRef.current = null
    }, EXIT_MS)
  }, [clearMobileTimers])

  const showNextNotification = useCallback(() => {
    const notification = buildFakeSolveNotification(problemPool)
    if (!notification) return

    const href = `/probleme/${encodeURIComponent(notification.problem.id)}`

    if (isDashboardMobile()) {
      clearMobileTimers()
      setMobileNotification(notification)
      window.setTimeout(() => setMobileVisible(true), 20)
      hideTimerRef.current = window.setTimeout(() => {
        setMobileVisible(false)
        removeTimerRef.current = window.setTimeout(() => {
          setMobileNotification(null)
          removeTimerRef.current = null
        }, EXIT_MS)
      }, DISPLAY_MS)
      return
    }

    toast.custom(
      () => (
        <FakeSolveSocialContent
          notification={notification}
          href={href}
          variant="desktop"
        />
      ),
      {
        duration: DISPLAY_MS,
        position: "bottom-right",
      },
    )
  }, [clearMobileTimers, problemPool])

  useEffect(() => {
    if (!enabled || problemPool.length === 0) {
      if (scheduleTimerRef.current) {
        window.clearTimeout(scheduleTimerRef.current)
        scheduleTimerRef.current = null
      }
      clearMobileTimers()
      setMobileVisible(false)
      setMobileNotification(null)
      return
    }

    let cancelled = false

    function clearScheduleTimer() {
      if (scheduleTimerRef.current) {
        window.clearTimeout(scheduleTimerRef.current)
        scheduleTimerRef.current = null
      }
    }

    function scheduleNext() {
      clearScheduleTimer()
      if (cancelled || document.visibilityState === "hidden") return

      scheduleTimerRef.current = window.setTimeout(() => {
        if (cancelled) return
        showNextNotification()
        scheduleNext()
      }, getNextDelay())
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        scheduleNext()
      } else {
        clearScheduleTimer()
      }
    }

    scheduleNext()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      clearScheduleTimer()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [clearMobileTimers, enabled, problemPool.length, showNextNotification])

  useEffect(() => {
    return () => {
      if (scheduleTimerRef.current) window.clearTimeout(scheduleTimerRef.current)
      clearMobileTimers()
    }
  }, [clearMobileTimers])

  return {
    mobileNotification,
    mobileVisible,
    dismissMobileNotification,
  }
}
