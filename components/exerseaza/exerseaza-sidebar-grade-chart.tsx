"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { StudentGradeGoalCard } from "@/components/dashboard/free-mobile/student-grade-goal-card"
import { estimateGradeFromElo } from "@/lib/parent/grade-estimate"
import { supabase } from "@/lib/supabaseClient"

const DESKTOP_MQ = "(min-width: 1024px)"

/**
 * Grade chart for the /exerseaza desktop sidebar only.
 * Does not mount or fetch on viewports below `lg`.
 */
export function ExerseazaSidebarGradeChart() {
  const { user, userElo } = useAuth()
  const [isDesktop, setIsDesktop] = useState(false)
  const [targetGrade, setTargetGrade] = useState<number | null>(null)

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MQ)
    const sync = () => setIsDesktop(mql.matches)
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!isDesktop || !user?.id) {
      setTargetGrade(null)
      return
    }

    let cancelled = false

    void supabase
      .from("profiles")
      .select("onboarding_target_grade")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setTargetGrade(
          typeof data?.onboarding_target_grade === "number" ? data.onboarding_target_grade : null,
        )
      })

    return () => {
      cancelled = true
    }
  }, [isDesktop, user?.id])

  if (!isDesktop || !user) return null

  const elo = userElo ?? 500

  return (
    <div className="shrink-0 bg-white px-4 pb-4 pt-2">
      <StudentGradeGoalCard
        compact
        currentGrade={estimateGradeFromElo(elo)}
        targetGrade={targetGrade}
      />
    </div>
  )
}
