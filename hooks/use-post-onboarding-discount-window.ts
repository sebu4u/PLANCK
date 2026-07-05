"use client"

import { useCallback, useLayoutEffect, useMemo, useState } from "react"

export const POST_ONBOARDING_DISCOUNT_WINDOW_MS = 60 * 60 * 1000

const WINDOW_MS = POST_ONBOARDING_DISCOUNT_WINDOW_MS

export function getPostOnboardingDiscountStorageKey(userId: string) {
  return `planck_new_user_discount_start_${userId}`
}

export function getPostOnboardingDiscountMobilePromoSessionKey(userId: string) {
  return `planck_new_user_discount_mobile_promo_session_${userId}`
}

function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  if (h > 0) {
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
  }

  return [m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

export function usePostOnboardingDiscountWindow(userId: string | undefined) {
  const [now, setNow] = useState(0)
  const [windowNonce, setWindowNonce] = useState(0)

  const ensureWindow = useCallback(() => {
    if (!userId) return

    try {
      const key = getPostOnboardingDiscountStorageKey(userId)
      const startRaw = localStorage.getItem(key)
      const start = Number(startRaw)
      const expired =
        !startRaw || !Number.isFinite(start) || start + WINDOW_MS <= Date.now()

      if (expired) {
        localStorage.setItem(key, String(Date.now()))
      }

      setWindowNonce((value) => value + 1)
    } catch {
      // ignore
    }
  }, [userId])

  useLayoutEffect(() => {
    setNow(Date.now())
    if (!userId) return
    const id = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [userId])

  const discount = useMemo(() => {
    if (now === 0 || !userId) {
      return { active: false as const, remainingLabel: "00:00" }
    }

    let startRaw: string | null = null
    try {
      startRaw = localStorage.getItem(getPostOnboardingDiscountStorageKey(userId))
    } catch {
      return { active: false as const, remainingLabel: "00:00" }
    }

    if (!startRaw) {
      return { active: false as const, remainingLabel: "00:00" }
    }

    const start = Number(startRaw)
    if (!Number.isFinite(start)) {
      return { active: false as const, remainingLabel: "00:00" }
    }

    const end = start + WINDOW_MS
    const remainingMs = end - now

    if (remainingMs <= 0) {
      try {
        localStorage.removeItem(getPostOnboardingDiscountStorageKey(userId))
      } catch {
        // ignore
      }
      return { active: false as const, remainingLabel: "00:00" }
    }

    return { active: true as const, remainingLabel: formatCountdown(remainingMs) }
  }, [now, userId, windowNonce])

  return { ...discount, ensureWindow }
}
