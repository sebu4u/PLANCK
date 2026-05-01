"use client"

import { useCallback, useEffect, useRef } from "react"
import { useEngagement } from "@/components/engagement/notification-provider"
import { getHintCopy } from "@/lib/engagement/copy"

type HintSurface = "invata" | "ide" | "poll"

interface StuckTriggerOptions {
  surface?: HintSurface
  enabled?: boolean
  threshold?: number
  idleMs?: number
  activityKey?: string | number | null
  dedupeKey?: string
  onHintCta?: () => void
}

export function useStuckTrigger({
  surface = "invata",
  enabled = true,
  threshold,
  idleMs,
  activityKey,
  dedupeKey,
  onHintCta,
}: StuckTriggerOptions = {}) {
  const engagement = useEngagement()
  const failureCountRef = useRef(0)

  const pushHint = useCallback(
    (reason: "manual" | "failure" | "idle" = "manual") => {
      const copy = getHintCopy(surface)
      engagement.push({
        type: "hint",
        surface: "card",
        priority: reason === "manual" ? 80 : 70,
        dedupeKey: dedupeKey ?? `hint:${surface}:${reason}:${new Date().toISOString().slice(0, 10)}`,
        payload: {
          ...copy,
          icon: "hint",
          cta: {
            label: surface === "ide" ? "Deschide Insight" : "Am înțeles",
            onClick: onHintCta,
          },
          secondaryCta: {
            label: "Continui singur",
          },
        },
      })
    },
    [dedupeKey, engagement, onHintCta, surface]
  )

  const registerFailure = useCallback(() => {
    failureCountRef.current += 1
    const triggerAt = threshold ?? (surface === "ide" ? 3 : 2)
    if (failureCountRef.current >= triggerAt) {
      pushHint("failure")
    }
  }, [pushHint, surface, threshold])

  const resetFailures = useCallback(() => {
    failureCountRef.current = 0
  }, [])

  useEffect(() => {
    if (!enabled || !idleMs) return
    const timer = window.setTimeout(() => pushHint("idle"), idleMs)
    return () => window.clearTimeout(timer)
  }, [activityKey, enabled, idleMs, pushHint])

  return { pushHint, registerFailure, resetFailures }
}

