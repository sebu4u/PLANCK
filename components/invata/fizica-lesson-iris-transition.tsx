"use client"

import { cubicBezier } from "framer-motion"
import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"

const IRIS_DURATION_MS = 550
const IRIS_EASE = cubicBezier(0.22, 1, 0.36, 1)
/** Covers full viewBox (0–100) from center; corners need ~71, 100 is safe. */
const IRIS_MAX_RADIUS = 100

interface FizicaLessonIrisTransitionProps {
  active: boolean
  onComplete: () => void
}

export function FizicaLessonIrisTransition({
  active,
  onComplete,
}: FizicaLessonIrisTransitionProps) {
  const maskId = useId().replace(/:/g, "")
  const [mounted, setMounted] = useState(false)
  const [radius, setRadius] = useState(IRIS_MAX_RADIUS)
  const completedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!active) {
      completedRef.current = false
      setRadius(IRIS_MAX_RADIUS)
      return
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      onCompleteRef.current()
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / IRIS_DURATION_MS)
      const eased = IRIS_EASE(t)
      setRadius(IRIS_MAX_RADIUS * (1 - eased))

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (!completedRef.current) {
        completedRef.current = true
        onCompleteRef.current()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [active])

  if (!active || !mounted) return null

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-auto fixed inset-0 z-[800] bg-transparent"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            <rect width="100" height="100" fill="white" />
            <circle cx="50" cy="50" r={radius} fill="black" />
          </mask>
        </defs>
        <rect width="100" height="100" fill="#ffffff" mask={`url(#${maskId})`} />
      </svg>
    </div>,
    document.body,
  )
}
