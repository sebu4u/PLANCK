"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useEngagement } from "@/components/engagement/notification-provider"
import { getStreakCopy } from "@/lib/engagement/copy"
import { supabase } from "@/lib/supabaseClient"

interface StreakTriggerOptions {
  enabled?: boolean
}

function hoursSince(dateValue: string | null | undefined) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY
  return (Date.now() - date.getTime()) / 36e5
}

export function useStreakTrigger({ enabled = true }: StreakTriggerOptions = {}) {
  const { user } = useAuth()
  const engagement = useEngagement()

  useEffect(() => {
    if (!enabled || !user?.id) return

    let cancelled = false

    async function run() {
      const { data, error } = await supabase
        .from("user_stats")
        .select("current_streak,last_activity_date,problems_solved_today")
        .eq("user_id", user!.id)
        .maybeSingle()

      if (cancelled || error || !data) return

      const streak = Number(data.current_streak ?? 0)
      const problemsToday = Number(data.problems_solved_today ?? 0)
      const inactiveHours = hoursSince(data.last_activity_date)

      if (streak < 2 || problemsToday > 0 || inactiveHours < 18) return

      const copy = getStreakCopy({ streak })
      engagement.push({
        type: "streak_reminder",
        surface: "card",
        priority: 90,
        dedupeKey: `streak:${new Date().toISOString().slice(0, 10)}`,
        payload: {
          ...copy,
          icon: "streak",
          cta: {
            label: "Păstrează seria",
            href: "/dashboard",
          },
          secondaryCta: {
            label: "Mai târziu",
          },
        },
      })
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [enabled, engagement, user?.id])
}

