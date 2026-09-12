"use client"

import { useEffect } from "react"
import {
  PRESS_SHRINK_CLASS,
  PRESS_SHRINK_MEDIA,
  PRESS_SHRINK_PRESSED_CLASS,
} from "@/lib/press-shrink"

const PRESS_SELECTOR = `.${PRESS_SHRINK_CLASS}`
const LISTENER_OPTIONS: AddEventListenerOptions = { passive: true, capture: true }

function nearestPressTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  return target.closest(PRESS_SELECTOR)
}

function isDisabledOrInert(el: HTMLElement): boolean {
  if (el.matches(":disabled")) return true
  if (el.getAttribute("aria-disabled") === "true") return true
  if (el.closest("[inert]")) return true
  return false
}

function shouldIgnore(el: HTMLElement): boolean {
  if (el.classList.contains("dashboard-start-glow")) return true
  if (el.closest(".dashboard-start-glow")) return true
  return isDisabledOrInert(el)
}

function clearPressed(el: HTMLElement | null) {
  el?.classList.remove(PRESS_SHRINK_PRESSED_CLASS)
}

/**
 * Touch-only press feedback: while a finger is down on `.press-shrink`,
 * adds `.is-pressed` so CSS can scale the target. No-op on mouse / hover devices.
 */
export function MobilePressShrink() {
  useEffect(() => {
    const media = window.matchMedia(PRESS_SHRINK_MEDIA)
    let pressed: HTMLElement | null = null

    const release = () => {
      clearPressed(pressed)
      pressed = null
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!media.matches) return
      if (event.pointerType === "mouse") return
      if (!(event.target instanceof Element)) return
      if (event.target.closest(".dashboard-start-glow")) return

      const el = nearestPressTarget(event.target)
      if (!el || shouldIgnore(el)) return

      release()
      pressed = el
      el.classList.add(PRESS_SHRINK_PRESSED_CLASS)
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        // Some targets cannot capture; pointerup on document still releases.
      }
    }

    const onPointerUp = () => {
      release()
    }

    document.addEventListener("pointerdown", onPointerDown, LISTENER_OPTIONS)
    document.addEventListener("pointerup", onPointerUp, LISTENER_OPTIONS)
    document.addEventListener("pointercancel", onPointerUp, LISTENER_OPTIONS)
    document.addEventListener("lostpointercapture", onPointerUp, LISTENER_OPTIONS)
    window.addEventListener("blur", onPointerUp)

    return () => {
      release()
      document.removeEventListener("pointerdown", onPointerDown, LISTENER_OPTIONS)
      document.removeEventListener("pointerup", onPointerUp, LISTENER_OPTIONS)
      document.removeEventListener("pointercancel", onPointerUp, LISTENER_OPTIONS)
      document.removeEventListener("lostpointercapture", onPointerUp, LISTENER_OPTIONS)
      window.removeEventListener("blur", onPointerUp)
    }
  }, [])

  return null
}
