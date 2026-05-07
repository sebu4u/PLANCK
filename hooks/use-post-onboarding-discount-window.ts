"use client"

import { useLayoutEffect, useMemo, useState } from "react"

const WINDOW_MS = 24 * 60 * 60 * 1000

export function getPostOnboardingDiscountStorageKey(userId: string) {
  return `planck_new_user_discount_start_${userId}`
}

function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

export function usePostOnboardingDiscountWindow(userId: string | undefined) {
  const [now, setNow] = useState(0)

  useLayoutEffect(() => {
    setNow(Date.now())
    if (!userId) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [userId])

  return useMemo(() => {
    if (now === 0 || !userId) {
      return { active: false as const, remainingLabel: "00:00:00" }
    }

    let startRaw: string | null = null
    try {
      startRaw = localStorage.getItem(getPostOnboardingDiscountStorageKey(userId))
    } catch {
      return { active: false as const, remainingLabel: "00:00:00" }
    }

    if (!startRaw) {
      return { active: false as const, remainingLabel: "00:00:00" }
    }

    const start = Number(startRaw)
    if (!Number.isFinite(start)) {
      return { active: false as const, remainingLabel: "00:00:00" }
    }

    const end = start + WINDOW_MS
    const remainingMs = end - now

    if (remainingMs <= 0) {
      try {
        localStorage.removeItem(getPostOnboardingDiscountStorageKey(userId))
      } catch {
        // ignore
      }
      return { active: false as const, remainingLabel: "00:00:00" }
    }

    return { active: true as const, remainingLabel: formatCountdown(remainingMs) }
  }, [now, userId])
}
