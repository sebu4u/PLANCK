import { FREE_PLAN_PERSONALIZED_LEARNING_PATH_LIMIT } from "@/lib/learning-path-free-plan"
import type { SupabaseAnyClient } from "@/lib/personalized-courses/types"

const MAX_COURSES_PER_DAY = 3
const MAX_COURSES_TOTAL = 20

export async function countUserPersonalizedCourses(
  admin: SupabaseAnyClient,
  userId: string,
): Promise<number> {
  const { count } = await admin
    .from("learning_path_chapters")
    .select("id", { count: "exact", head: true })
    .eq("generated_by_user_id", userId)
    .eq("is_personalized", true)
    .neq("generation_status", "failed")

  return count ?? 0
}

export interface PersonalizedCourseGenerationAccessInput {
  isDev: boolean
  hasFullAccess: boolean
}

export async function checkPersonalizedCourseGenerationAccess(
  admin: SupabaseAnyClient,
  userId: string,
  input: PersonalizedCourseGenerationAccessInput,
): Promise<string | null> {
  if (input.isDev) return null

  const totalCourses = await countUserPersonalizedCourses(admin, userId)

  if (input.hasFullAccess) {
    if (totalCourses >= MAX_COURSES_TOTAL) {
      return `Ai atins limita de ${MAX_COURSES_TOTAL} cursuri personalizate. Șterge unul vechi pentru a genera unul nou.`
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: todayCount } = await admin
      .from("learning_path_chapters")
      .select("id", { count: "exact", head: true })
      .eq("generated_by_user_id", userId)
      .eq("is_personalized", true)
      .neq("generation_status", "failed")
      .gte("created_at", oneDayAgo)

    if ((todayCount ?? 0) >= MAX_COURSES_PER_DAY) {
      return `Poți genera maximum ${MAX_COURSES_PER_DAY} cursuri pe zi. Revino mâine.`
    }

    return null
  }

  if (totalCourses >= FREE_PLAN_PERSONALIZED_LEARNING_PATH_LIMIT) {
    return "Planul gratuit include un singur traseu personalizat. Treci la Plus pentru a genera mai multe."
  }

  return null
}

export function canGeneratePersonalizedPathForFreePlan(existingCount: number): boolean {
  return existingCount < FREE_PLAN_PERSONALIZED_LEARNING_PATH_LIMIT
}
