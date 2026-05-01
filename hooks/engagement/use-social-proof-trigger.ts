"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useEngagement } from "@/components/engagement/notification-provider"
import { getSocialProofCopy } from "@/lib/engagement/copy"
import { supabase } from "@/lib/supabaseClient"

interface SocialProofOptions {
  enabled?: boolean
  problemId?: string
  solvedTotal?: number | null
}

function normalizeRpcCount(value: unknown): number {
  if (typeof value === "number") return value
  if (Array.isArray(value)) return normalizeRpcCount(value[0])
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return normalizeRpcCount(record.active_users ?? record.count ?? record.get_concurrent_active_users)
  }
  return 0
}

export function useSocialProofTrigger({
  enabled = true,
  problemId,
  solvedTotal,
}: SocialProofOptions = {}) {
  const { user } = useAuth()
  const engagement = useEngagement()

  useEffect(() => {
    if (!enabled || !user?.id) return
    let cancelled = false

    async function run() {
      const { data, error } = problemId
        ? await supabase.rpc("get_problem_solvers_today", { target_problem_id: problemId })
        : await supabase.rpc("get_concurrent_active_users")

      if (cancelled || error) return

      const count = Math.max(0, normalizeRpcCount(data))
      if (count < 3) return

      const copy = getSocialProofCopy(count, solvedTotal)
      engagement.push({
        type: "social_proof",
        surface: "toast",
        priority: 25,
        dedupeKey: `social:${new Date().toISOString().slice(0, 10)}:${problemId ?? "global"}`,
        payload: {
          ...copy,
          icon: "social",
        },
      })
    }

    const timer = window.setTimeout(() => void run(), 4000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, engagement, problemId, solvedTotal, user?.id])
}

