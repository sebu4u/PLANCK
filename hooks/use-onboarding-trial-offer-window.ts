"use client"

import { useLayoutEffect, useMemo, useState } from "react"

import {
  formatOnboardingTrialOfferCountdown,
  getOnboardingTrialOfferRemainingMs,
} from "@/lib/onboarding-trial-offer"

export function useOnboardingTrialOfferWindow(createdAt: string | undefined) {
  const [now, setNow] = useState(0)

  useLayoutEffect(() => {
    setNow(Date.now())
    if (!createdAt) return

    const id = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [createdAt])

  return useMemo(() => {
    const remainingMs = getOnboardingTrialOfferRemainingMs(createdAt, now)
    if (now === 0 || remainingMs <= 0) {
      return { active: false as const, remainingLabel: "0z 0h 0m 0s" }
    }

    return {
      active: true as const,
      remainingLabel: formatOnboardingTrialOfferCountdown(remainingMs),
    }
  }, [createdAt, now])
}
