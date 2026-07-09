"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { estimateGradeFromElo } from "@/lib/parent/grade-estimate"
import { getFreePlanItemsRemainingForUser } from "@/lib/learning-path-free-plan"
import type { LearningPathChapter } from "@/lib/supabase-learning-paths"
import { PROBLEMS_BG_AVATAR_SRC } from "@/lib/planck-catalog-avatar"
import { InvataPersonalizedCourseEntry } from "@/components/invata/invata-personalized-course-entry"
import { StudentGradeGoalCard } from "@/components/dashboard/free-mobile/student-grade-goal-card"
import { StudentCurrentPathCard } from "@/components/dashboard/free-mobile/student-current-path-card"
import { StudentLeaderboardCard } from "@/components/dashboard/free-mobile/student-leaderboard-card"

interface FreeMobileDashboardProps {
  primaryChapter: LearningPathChapter | null
  level: number
  hasStarted: boolean
  resumeHref: string
  lessonProgress?: { completed: number; total: number }
  currentLessonTitle?: string | null
  rank: string
}

export function FreeMobileDashboard({
  primaryChapter,
  level,
  hasStarted,
  resumeHref,
  lessonProgress,
  currentLessonTitle,
  rank,
}: FreeMobileDashboardProps) {
  const { user, profile, userElo } = useAuth()
  const [targetGrade, setTargetGrade] = useState<number | null>(null)
  const [freeItemsRemaining, setFreeItemsRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    supabase
      .from("profiles")
      .select("onboarding_target_grade")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return
        setTargetGrade(typeof data?.onboarding_target_grade === "number" ? data.onboarding_target_grade : null)
      })

    getFreePlanItemsRemainingForUser(supabase, user.id).then((remaining) => {
      if (isMounted) setFreeItemsRemaining(remaining)
    })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const elo = userElo ?? 500
  const studentName = profile?.nickname || profile?.name || "Tu"

  return (
    <div className="mobile-bottom-nav-pad flex flex-col gap-4 px-4 pt-7">
      <div className="mb-2">
        <InvataPersonalizedCourseEntry />
      </div>

      <StudentGradeGoalCard currentGrade={estimateGradeFromElo(elo)} targetGrade={targetGrade} />

      {primaryChapter ? (
        <StudentCurrentPathCard
          userId={user?.id ?? ""}
          chapter={primaryChapter}
          level={level}
          hasStarted={hasStarted}
          resumeHref={resumeHref}
          lessonProgress={lessonProgress}
          currentLessonTitle={currentLessonTitle}
          freeItemsRemaining={freeItemsRemaining}
        />
      ) : null}

      <StudentLeaderboardCard studentName={studentName} elo={elo} rank={rank} />

      <div className="relative mt-6 flex flex-col items-center pt-6 text-center">
        <h3 className="max-w-[280px] text-lg font-bold leading-snug text-[#111111]">
          Te ajut să îți măresti media!
        </h3>
        <p className="mt-1.5 max-w-[280px] text-sm text-[#6b7280]">
          Continuă să explorezi platforma pentru a crește în clasament
        </p>

        <img
          src={PROBLEMS_BG_AVATAR_SRC}
          alt=""
          aria-hidden
          className="pointer-events-none relative z-0 -mb-10 mt-4 h-auto w-40 select-none"
        />
      </div>
    </div>
  )
}
