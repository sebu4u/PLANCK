"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { supabase } from "@/lib/supabaseClient"
import { estimateGradeFromElo } from "@/lib/parent/grade-estimate"
import { getFreePlanItemsRemainingForUser } from "@/lib/learning-path-free-plan"
import type { LearningPathChapter } from "@/lib/supabase-learning-paths"
import { PROBLEMS_BG_AVATAR_SRC } from "@/lib/planck-catalog-avatar"
import { cn } from "@/lib/utils"
import { ExerseazaRecommendedProblems } from "@/components/exerseaza/exerseaza-recommended-problems"
import { InvataPersonalizedCourseEntry } from "@/components/invata/invata-personalized-course-entry"
import { StudentGradeGoalCard } from "@/components/dashboard/free-mobile/student-grade-goal-card"
import { StudentCurrentPathCard } from "@/components/dashboard/free-mobile/student-current-path-card"
import { StudentLeaderboardCard } from "@/components/dashboard/free-mobile/student-leaderboard-card"
import { normalizePracticeSubject } from "@/lib/practice-subject"

interface FreeMobileDashboardProps {
  primaryChapter: LearningPathChapter | null
  level: number
  hasStarted: boolean
  resumeHref: string
  lessonProgress?: { completed: number; total: number }
  currentLessonTitle?: string | null
  rank: string
  problemsSolvedTotal: number
}

export function FreeMobileDashboard({
  primaryChapter,
  level,
  hasStarted,
  resumeHref,
  lessonProgress,
  currentLessonTitle,
  rank,
  problemsSolvedTotal,
}: FreeMobileDashboardProps) {
  const { user, profile, userElo } = useAuth()
  const { isFree } = useSubscriptionPlan()
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

    if (isFree) {
      getFreePlanItemsRemainingForUser(supabase, user.id).then((remaining) => {
        if (isMounted) setFreeItemsRemaining(remaining)
      })
    } else {
      setFreeItemsRemaining(null)
    }

    return () => {
      isMounted = false
    }
  }, [user?.id, isFree])

  const elo = userElo ?? 500
  const studentName = profile?.nickname || profile?.name || "Tu"
  const hasActivity = hasStarted || problemsSolvedTotal > 0

  return (
    <div
      className={cn(
        isFree ? "mobile-bottom-nav-upgrade-banner-pad" : "mobile-bottom-nav-pad",
        "flex flex-col gap-4 px-4 pt-3",
      )}
    >
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

      <ExerseazaRecommendedProblems subject={normalizePracticeSubject(profile?.preferred_materie)} />

      {hasActivity ? (
        <>
          <StudentGradeGoalCard currentGrade={estimateGradeFromElo(elo)} targetGrade={targetGrade} />
          <StudentLeaderboardCard studentName={studentName} elo={elo} rank={rank} />
          <InvataPersonalizedCourseEntry />
        </>
      ) : null}

      <div className="relative mt-6 flex flex-col items-center pt-6 text-center">
        <h3 className="max-w-[280px] text-lg font-bold leading-snug text-[#111111]">
          {hasActivity ? "Continuă ca să crești" : "Începe cu traseul"}
        </h3>
        <p className="mt-1.5 max-w-[280px] text-sm text-[#6b7280]">
          {hasActivity
            ? "Fiecare pas îți ridică nota și locul în clasament"
            : "Rezolvă primul pas din traseu, apoi problemele recomandate"}
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
