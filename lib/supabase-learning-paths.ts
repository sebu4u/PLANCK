import { supabase } from "@/lib/supabaseClient"
import type { Problem } from "@/data/problems"

export type LearningPathLessonType = "text" | "video" | "grila" | "problem" | "poll"

export interface LearningPathChapter {
  id: string
  slug: string | null
  title: string
  description: string | null
  icon_url: string | null
  problem_category: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LearningPathLesson {
  id: string
  chapter_id: string
  slug: string | null
  title: string
  description: string | null
  image_url: string | null
  lesson_type: LearningPathLessonType
  cursuri_lesson_slug: string | null
  youtube_url: string | null
  quiz_question_id: string | null
  problem_id: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LearningPathLessonItem {
  id: string
  lesson_id: string
  item_type: LearningPathLessonType
  title: string | null
  cursuri_lesson_slug: string | null
  youtube_url: string | null
  quiz_question_id: string | null
  problem_id: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
  content_json?: Record<string, unknown> | null
}

export async function getLearningPathChapters(): Promise<LearningPathChapter[]> {
  const { data, error } = await supabase
    .from("learning_path_chapters")
    .select("*")
    .eq("is_active", true)
    .order("order_index")

  if (error) {
    console.error("Error fetching learning path chapters:", error)
    return []
  }

  return data || []
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test((value || "").trim())
}

export async function getLearningPathChapterBySlug(slug: string): Promise<LearningPathChapter | null> {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const { data, error } = await supabase
    .from("learning_path_chapters")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching learning path chapter with slug ${normalizedSlug}:`, error)
    return null
  }

  return data || null
}

export async function getLearningPathChapterById(id: string): Promise<LearningPathChapter | null> {
  const normalizedId = id.trim()
  if (!normalizedId) return null

  const { data, error } = await supabase
    .from("learning_path_chapters")
    .select("*")
    .eq("id", normalizedId)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching learning path chapter with id ${normalizedId}:`, error)
    return null
  }

  return data || null
}

export async function getLearningPathLessonsByChapterId(chapterId: string): Promise<LearningPathLesson[]> {
  const { data, error } = await supabase
    .from("learning_path_lessons")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("is_active", true)
    .order("order_index")

  if (error) {
    console.error(`Error fetching lessons for chapter ${chapterId}:`, error)
    return []
  }

  return data || []
}

export async function getLearningPathLessonBySlug(
  chapterSlug: string,
  lessonSlug: string
): Promise<LearningPathLesson | null> {
  const chapter = await getLearningPathChapterBySlug(chapterSlug)
  const normalizedLessonSlug = lessonSlug.trim()

  if (!chapter || !normalizedLessonSlug) {
    return null
  }

  const { data, error } = await supabase
    .from("learning_path_lessons")
    .select("*")
    .eq("chapter_id", chapter.id)
    .eq("slug", normalizedLessonSlug)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    console.error(
      `Error fetching learning path lesson with slug ${normalizedLessonSlug} from chapter ${chapter.id}:`,
      error
    )
    return null
  }

  return data || null
}

export async function getLearningPathLessonById(lessonId: string): Promise<LearningPathLesson | null> {
  const normalizedId = lessonId.trim()
  if (!normalizedId) return null

  const { data, error } = await supabase
    .from("learning_path_lessons")
    .select("*")
    .eq("id", normalizedId)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching learning path lesson with id ${normalizedId}:`, error)
    return null
  }

  return data || null
}

export async function getLearningPathLessonItems(lessonId: string): Promise<LearningPathLessonItem[]> {
  const { data, error } = await supabase
    .from("learning_path_lesson_items")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("is_active", true)
    .order("order_index")

  if (error) {
    console.error(`Error fetching learning path lesson items for lesson ${lessonId}:`, error)
    return []
  }

  return data || []
}

export async function getRandomProblemsByCategory(category: string, limit = 3): Promise<Problem[]> {
  const normalizedCategory = category.trim()
  if (!normalizedCategory) return []

  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("category", normalizedCategory)
    .limit(30)

  if (error) {
    console.error(`Error fetching problems for category ${normalizedCategory}:`, error)
    return []
  }

  const problems = ((data || []) as Problem[]).slice()
  for (let i = problems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[problems[i], problems[j]] = [problems[j], problems[i]]
  }

  return problems.slice(0, Math.max(1, limit))
}

function toGradeNumber(grade: string | number | null | undefined): number | null {
  if (grade == null) return null
  if (typeof grade === "number") return Number.isFinite(grade) ? grade : null

  const raw = grade.trim()
  if (!raw) return null

  const parsed = Number(raw)
  if (Number.isFinite(parsed)) return parsed

  const digits = raw.match(/\d+/)
  if (!digits) return null

  const fromDigits = Number(digits[0])
  return Number.isFinite(fromDigits) ? fromDigits : null
}

function getProblemGrade(problem: Problem): number | null {
  const rawClass = (problem as { class?: unknown }).class

  if (typeof rawClass === "number" && Number.isFinite(rawClass)) return rawClass

  if (typeof rawClass === "string") {
    const digits = rawClass.match(/\d+/)
    if (digits) {
      const parsed = Number(digits[0])
      if (Number.isFinite(parsed)) return parsed
    }
  }

  if (typeof problem.classString === "string") {
    const digits = problem.classString.match(/\d+/)
    if (digits) {
      const parsed = Number(digits[0])
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

export async function getProblemsByClass(
  grade: string | number | null | undefined,
  limit = 6
): Promise<Problem[]> {
  const normalizedGrade = toGradeNumber(grade)
  const safeLimit = Math.max(1, limit)

  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120)

  if (error) {
    console.error("Error fetching problems for dashboard recommendations:", error)
    return []
  }

  const allProblems = ((data || []) as Problem[]).slice()
  const scopedProblems =
    normalizedGrade == null
      ? allProblems
      : allProblems.filter((problem) => getProblemGrade(problem) === normalizedGrade)

  for (let i = scopedProblems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[scopedProblems[i], scopedProblems[j]] = [scopedProblems[j], scopedProblems[i]]
  }

  return scopedProblems.slice(0, safeLimit)
}
