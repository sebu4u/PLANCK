import type { PlanckIdeFloatingSource } from "@/lib/planckcode-floating-session"

export type FloatingAnimationRect = {
  top: number
  left: number
  width: number
  height: number
  borderRadius: number
}

const NAV_HEIGHT = 64
const SIDEBAR_WIDTH = 64
const MINI_CARD_HEIGHT = 220
const MINI_CARD_MAX_WIDTH = 320

function getMiniCardRect(): FloatingAnimationRect {
  if (typeof window === "undefined") {
    return { top: 0, left: 0, width: MINI_CARD_MAX_WIDTH, height: MINI_CARD_HEIGHT, borderRadius: 12 }
  }

  const width = Math.min(MINI_CARD_MAX_WIDTH, window.innerWidth - 32)
  const height = MINI_CARD_HEIGHT
  const isMobile = window.innerWidth < 768
  const bottomOffset = isMobile ? 72 : 16
  const rightOffset = isMobile ? 12 : 16

  return {
    top: window.innerHeight - bottomOffset - height,
    left: window.innerWidth - rightOffset - width,
    width,
    height,
    borderRadius: 12,
  }
}

function getProblemIdeRect(): FloatingAnimationRect {
  if (typeof window === "undefined") {
    return getMiniCardRect()
  }

  const isMobile = window.innerWidth < 768
  if (isMobile) {
    const top = NAV_HEIGHT + (window.innerHeight - NAV_HEIGHT) * 0.5
    return {
      top,
      left: 0,
      width: window.innerWidth,
      height: (window.innerHeight - NAV_HEIGHT) * 0.5,
      borderRadius: 0,
    }
  }

  const mainWidth = window.innerWidth - SIDEBAR_WIDTH
  return {
    top: NAV_HEIGHT,
    left: SIDEBAR_WIDTH + mainWidth / 2,
    width: mainWidth / 2,
    height: window.innerHeight - NAV_HEIGHT,
    borderRadius: 0,
  }
}

function getStandaloneIdeRect(): FloatingAnimationRect {
  if (typeof window === "undefined") {
    return getMiniCardRect()
  }

  const sidebar = window.innerWidth >= 768 ? SIDEBAR_WIDTH : 0
  return {
    top: NAV_HEIGHT,
    left: sidebar,
    width: window.innerWidth - sidebar,
    height: window.innerHeight - NAV_HEIGHT,
    borderRadius: 0,
  }
}

export function getFloatingEntryAnimationRects(source: PlanckIdeFloatingSource): {
  from: FloatingAnimationRect
  to: FloatingAnimationRect
} {
  const from =
    source === "problem" ? getProblemIdeRect() : getStandaloneIdeRect()
  return { from, to: getMiniCardRect() }
}

export function prefersReducedFloatingMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
