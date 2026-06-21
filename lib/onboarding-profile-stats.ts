import type { SupabaseClient } from "@supabase/supabase-js"
import type { OnboardingSubjectId } from "@/lib/onboarding"
import { supabase } from "@/lib/supabaseClient"

export type OnboardingProfileStats = {
  lessons: number
  problems: number
  tests: number
  teachers: number
}

const FALLBACK_BY_SUBJECT: Record<OnboardingSubjectId, Omit<OnboardingProfileStats, "teachers">> = {
  matematica: { lessons: 64, problems: 1180, tests: 240 },
  fizica: { lessons: 72, problems: 1320, tests: 260 },
  informatica: { lessons: 58, problems: 1024, tests: 210 },
  biologie: { lessons: 52, problems: 880, tests: 220 },
}

const MIN_STATS_BY_SUBJECT: Record<OnboardingSubjectId, Omit<OnboardingProfileStats, "teachers">> = {
  matematica: { lessons: 58, problems: 1024, tests: 230 },
  fizica: { lessons: 60, problems: 1100, tests: 240 },
  informatica: { lessons: 52, problems: 960, tests: 200 },
  biologie: { lessons: 48, problems: 820, tests: 210 },
}

function teachersForGrade(grade: string): number {
  const gradeNum = Number.parseInt(grade, 10)
  if (!Number.isFinite(gradeNum)) return 4
  return 4 + (gradeNum % 4)
}

function withFallback(
  subject: OnboardingSubjectId,
  grade: string,
  partial: Partial<OnboardingProfileStats>,
): OnboardingProfileStats {
  const fallback = FALLBACK_BY_SUBJECT[subject]
  const min = MIN_STATS_BY_SUBJECT[subject]
  const teachers =
    partial.teachers && partial.teachers > 0 ? partial.teachers : teachersForGrade(grade)

  return {
    lessons: Math.max(min.lessons, partial.lessons && partial.lessons > 0 ? partial.lessons : fallback.lessons),
    problems: Math.max(min.problems, partial.problems && partial.problems > 0 ? partial.problems : fallback.problems),
    tests: Math.max(min.tests, partial.tests && partial.tests > 0 ? partial.tests : fallback.tests),
    teachers: Math.min(9, teachers),
  }
}

async function countLessons(client: SupabaseClient, subject: OnboardingSubjectId): Promise<number> {
  let chapterQuery = client.from("learning_path_chapters").select("id").eq("is_active", true)

  if (subject === "fizica") {
    chapterQuery = chapterQuery.or("materie.eq.fizica,materie.is.null")
  } else {
    chapterQuery = chapterQuery.eq("materie", subject)
  }

  const { data: chapters, error } = await chapterQuery
  if (error || !chapters?.length) return 0

  const chapterIds = chapters.map((chapter) => chapter.id as string)
  const { count, error: lessonsError } = await client
    .from("learning_path_lessons")
    .select("id", { count: "exact", head: true })
    .in("chapter_id", chapterIds)
    .eq("is_active", true)

  if (lessonsError) return 0
  return count ?? 0
}

async function countProblems(
  client: SupabaseClient,
  subject: OnboardingSubjectId,
  grade: string,
): Promise<number> {
  const gradeNum = Number.parseInt(grade, 10)

  if (subject === "fizica" && Number.isFinite(gradeNum)) {
    const { count } = await client
      .from("problems")
      .select("id", { count: "exact", head: true })
      .eq("class", gradeNum)
    return count ?? 0
  }

  if (subject === "matematica") {
    const { count } = await client
      .from("math_problems")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("class", grade)
    if ((count ?? 0) > 0) return count ?? 0

    if (Number.isFinite(gradeNum)) {
      const retry = await client
        .from("math_problems")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("class", gradeNum)
      return retry.count ?? 0
    }
    return 0
  }

  if (subject === "informatica") {
    let query = client
      .from("coding_problems")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)

    if (Number.isFinite(gradeNum)) {
      query = query.eq("class", gradeNum)
    }

    const { count } = await query
    return count ?? 0
  }

  return 0
}

async function countTests(
  client: SupabaseClient,
  subject: OnboardingSubjectId,
  grade: string,
): Promise<number> {
  const gradeNum = Number.parseInt(grade, 10)

  if (subject === "fizica" || subject === "biologie") {
    let query = client
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("materie", subject)

    if (Number.isFinite(gradeNum)) {
      query = query.eq("class", gradeNum)
    }

    const { count } = await query
    return count ?? 0
  }

  let chapterQuery = client.from("learning_path_chapters").select("id").eq("is_active", true)
  if (subject === "fizica") {
    chapterQuery = chapterQuery.or("materie.eq.fizica,materie.is.null")
  } else {
    chapterQuery = chapterQuery.eq("materie", subject)
  }

  const { data: chapters } = await chapterQuery
  if (!chapters?.length) return 0

  const chapterIds = chapters.map((chapter) => chapter.id as string)
  const { data: lessons } = await client
    .from("learning_path_lessons")
    .select("id")
    .in("chapter_id", chapterIds)
    .eq("is_active", true)

  const lessonIds = (lessons ?? []).map((lesson) => lesson.id as string)
  if (!lessonIds.length) return 0

  const { count } = await client
    .from("learning_path_lesson_items")
    .select("id", { count: "exact", head: true })
    .in("lesson_id", lessonIds)
    .eq("is_active", true)
    .in("item_type", ["test", "grila"])

  return count ?? 0
}

export async function fetchOnboardingProfileStats(
  subject: OnboardingSubjectId | null,
  grade: string | null,
): Promise<OnboardingProfileStats> {
  const resolvedSubject = subject ?? "fizica"
  const resolvedGrade = grade ?? "9"

  try {
    const [lessons, problems, tests] = await Promise.all([
      countLessons(supabase, resolvedSubject),
      countProblems(supabase, resolvedSubject, resolvedGrade),
      countTests(supabase, resolvedSubject, resolvedGrade),
    ])

    return withFallback(resolvedSubject, resolvedGrade, {
      lessons,
      problems,
      tests,
      teachers: teachersForGrade(resolvedGrade),
    })
  } catch {
    return withFallback(resolvedSubject, resolvedGrade, {
      teachers: teachersForGrade(resolvedGrade),
    })
  }
}

export function buildOnboardingRevealLines(stats: OnboardingProfileStats) {
  return [
    `Am găsit ${stats.lessons} lecții special pentru profilul tău`,
    `${stats.problems} probleme`,
    `${stats.tests} teste`,
    `${stats.teachers} profesori cu care vei lucra`,
  ]
}
