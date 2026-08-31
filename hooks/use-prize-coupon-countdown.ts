"use client"

import { useEffect, useState } from "react"

import {
  getPrizeCouponCountdown,
  type PrizeCouponCountdown,
} from "@/lib/prize-wheel/expiry"

const EMPTY: PrizeCouponCountdown = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: true,
}

export function usePrizeCouponCountdown(
  expiresAt: string | null | undefined,
): PrizeCouponCountdown {
  const [state, setState] = useState<PrizeCouponCountdown>(() =>
    expiresAt ? getPrizeCouponCountdown(expiresAt) : EMPTY,
  )

  useEffect(() => {
    if (!expiresAt) {
      setState(EMPTY)
      return
    }
    const tick = () => setState(getPrizeCouponCountdown(expiresAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiresAt])

  return state
}
