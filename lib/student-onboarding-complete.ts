import type { SupabaseClient } from "@supabase/supabase-js"
import { initialEloFromSelfGrade } from "@/lib/parent/grade-estimate"
import type { OnboardingSubjectId } from "@/lib/onboarding"
import type { StudentDailyTimeOption } from "@/lib/student-onboarding-plan"

const DEFAULT_ELO_CEILING = 600

export type FinalizeStudentOnboardingParams = {
  userId: string
  name: string
  subject: OnboardingSubjectId | null
  schoolGrade: string | null
  selfGrade: number | null
  targetGrade: number | null
  dailyTime: StudentDailyTimeOption | null
}

export async function finalizeStudentOnboarding(
  supabase: SupabaseClient,
  params: FinalizeStudentOnboardingParams,
): Promise<{ error: Error | null }> {
  const payload: Record<string, unknown> = {
    name: params.name,
    onboarding_completed_at: new Date().toISOString(),
  }

  if (params.schoolGrade) payload.grade = params.schoolGrade
  if (params.subject) payload.preferred_materie = params.subject
  if (params.selfGrade != null) payload.onboarding_self_grade = params.selfGrade
  if (params.targetGrade != null) payload.onboarding_target_grade = params.targetGrade
  if (params.dailyTime) payload.onboarding_daily_minutes = params.dailyTime

  const { error: profileError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("user_id", params.userId)

  if (profileError) {
    console.error("[finalizeStudentOnboarding] profiles update failed:", profileError)
    return { error: profileError }
  }

  if (params.selfGrade != null) {
    const { data: stats } = await supabase
      .from("user_stats")
      .select("elo, problems_solved_total")
      .eq("user_id", params.userId)
      .maybeSingle()

    const solvedTotal =
      typeof stats?.problems_solved_total === "number" ? stats.problems_solved_total : 0
    const currentElo = typeof stats?.elo === "number" ? stats.elo : 0
    const shouldInitElo = solvedTotal === 0 && currentElo < DEFAULT_ELO_CEILING

    if (shouldInitElo) {
      const initialElo = initialEloFromSelfGrade(params.selfGrade)
      const { error: statsError } = await supabase.from("user_stats").upsert(
        {
          user_id: params.userId,
          elo: initialElo,
        },
        { onConflict: "user_id" },
      )

      if (statsError) {
        console.error("[finalizeStudentOnboarding] user_stats upsert failed:", statsError)
        return { error: statsError }
      }
    }
  }

  if (params.targetGrade != null) {
    const { error: targetError } = await supabase
      .from("parent_child_relationships")
      .update({ target_grade: params.targetGrade })
      .eq("child_id", params.userId)
      .eq("status", "active")

    if (targetError) {
      console.error("[finalizeStudentOnboarding] parent_child_relationships update failed:", targetError)
      return { error: targetError }
    }
  }

  return { error: null }
}
