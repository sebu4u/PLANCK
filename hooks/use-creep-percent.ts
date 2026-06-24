"use client"

import { useEffect, useRef, useState } from "react"

const CREEP_TICK_MS = 100
const CREEP_STEP_PERCENT = 0.1
const MAX_DISPLAYED_PERCENT = 100
const DEFAULT_ESTIMATED_TOTAL_MS = 150_000

export function creepCapForStage(stage: string | null | undefined): number {
  switch (stage) {
    case "searching":
      return 14
    case "planning":
      return 64
    case "saving":
    case "saving_lessons":
      return 95
    case "generating_images":
      return 99
    case "finalizing":
      return 99
    case "ready":
      return 100
    default:
      return 99
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  if (value > MAX_DISPLAYED_PERCENT) return MAX_DISPLAYED_PERCENT
  return value
}

export function useCreepPercent(
  stage: string | null | undefined,
  startedAt: number,
): number {
  const isReady = stage === "ready"
  const stageCap = creepCapForStage(stage)
  const startedAtRef = useRef(startedAt)
  startedAtRef.current = startedAt
  const stageCapRef = useRef(stageCap)
  stageCapRef.current = stageCap

  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (isReady) {
      setDisplayed(MAX_DISPLAYED_PERCENT)
      return
    }
    const interval = window.setInterval(() => {
      if (document.hidden) return
      const start = startedAtRef.current
      const elapsed = Date.now() - start
      if (elapsed <= 0) return
      const target = (elapsed / DEFAULT_ESTIMATED_TOTAL_MS) * 100
      setDisplayed((prev) => {
        if (target <= prev) return prev
        return Math.min(target, prev + CREEP_STEP_PERCENT)
      })
    }, CREEP_TICK_MS)
    return () => window.clearInterval(interval)
  }, [isReady])

  return Math.floor(clampPercent(displayed))
}
