"use client"

import { useCallback } from "react"
import { useEngagement } from "@/components/engagement/notification-provider"
import { getProgressCopy } from "@/lib/engagement/copy"

export function useProgressTrigger() {
  const engagement = useEngagement()

  return useCallback(
    (completedCount?: number, dedupeSuffix = "item") => {
      const copy = getProgressCopy(completedCount)
      engagement.push({
        type: "progress_feedback",
        surface: "toast",
        priority: 40,
        dedupeKey: `progress:${new Date().toISOString().slice(0, 10)}:${dedupeSuffix}`,
        payload: {
          ...copy,
          icon: "progress",
        },
      })
    },
    [engagement]
  )
}

