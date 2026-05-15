"use client"

import { useEffect } from "react"
import { playDashboardStartButtonClickSound } from "@/lib/ui-click-sound"

const GLOW_SELECTOR = ".dashboard-start-glow"

function nearestGlow(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  return target.closest(GLOW_SELECTOR)
}

function isDisabledOrInert(el: HTMLElement): boolean {
  if (el.matches(":disabled")) return true
  if (el.getAttribute("aria-disabled") === "true") return true
  if (el.closest("[inert]")) return true
  return false
}

/**
 * Plays the standard Start-style CTA click sound for any activation (click / tap / keyboard)
 * on elements marked with `dashboard-start-glow`.
 */
export function DashboardStartGlowClickSound() {
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      const el = nearestGlow(event.target)
      if (!el || isDisabledOrInert(el)) return
      playDashboardStartButtonClickSound()
    }
    document.addEventListener("click", onClickCapture, true)
    return () => document.removeEventListener("click", onClickCapture, true)
  }, [])
  return null
}
