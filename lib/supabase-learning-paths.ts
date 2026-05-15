import type { SupabaseClient } from "@supabase/supabase-js"
import {
  FREE_LEARNING_PATH_CHAPTER_SLUG,
  FREE_PREVIEW_CHAPTER_SLUG_ALIASES,
} from "@/lib/learning-path-free-plan"
import { supabase } from "@/lib/supabaseClient"
import type { Problem } from "@/data/problems"

export type LearningPathLessonType =
  | "text"
  | "video"
  | "grila"
  | "problem"
  | "poll"
  | "custom_text"
  | "simulation"
  | "test"

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

export function getLearningPathLessonHref(chapter: LearningPathChapter, lesson: LearningPathLesson): string {
  return chapter.slug && lesson.slug
    ? `/invata/${chapter.slug}/${lesson.slug}`
    : `/invata/${chapter.id}/${lesson.id}`
}

export function getLearningPathItemHref(
  chapter: LearningPathChapter,
  lesson: LearningPathLesson,
  itemIndex: number
): string {
  return `${getLearningPathLessonHref(chapter, lesson)}/${itemIndex + 1}`
}

export function getNextIncompleteLearningPathItem(
  items: LearningPathLessonItem[],
  completedItemIds: Iterable<string>
): LearningPathLessonItem | null {
  const completed = new Set(completedItemIds)
  return items.find((item) => !completed.has(item.id)) ?? null
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

function trimProblemId(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim()
  return t.length ? t : null
}

/**
 * Probleme din `learning_path_lesson_items` (tip problem) pentru capitol, în ordinea lecțiilor/itemilor.
 * Folosit pe /invata pentru admini; ceilalți rămân pe getRandomProblemsByCategory.
 */
export async function getProblemsFromLearningPathChapterItems(
  chapterId: string,
  limit = 3
): Promise<Problem[]> {
  const safeLimit = Math.max(1, limit)
  const lessons = await getLearningPathLessonsByChapterId(chapterId)
  if (!lessons.length) return []

  const lessonIds = lessons.map((l) => l.id)
  const lessonOrder = new Map(lessons.map((l) => [l.id, l.order_index]))

  const { data: items, error } = await supabase
    .from("learning_path_lesson_items")
    .select("lesson_id, problem_id, order_index")
    .in("lesson_id", lessonIds)
    .eq("item_type", "problem")
    .eq("is_active", true)

  if (error) {
    console.error(`Error fetching lesson problem items for chapter ${chapterId}:`, error)
    return []
  }

  const rows: { lesson_id: string; problem_id: string; order_index: number }[] = []
  for (const row of items || []) {
    const pid = trimProblemId((row as { problem_id?: string | null }).problem_id)
    if (!pid) continue
    rows.push({
      lesson_id: (row as { lesson_id: string }).lesson_id,
      problem_id: pid,
      order_index: (row as { order_index: number }).order_index,
    })
  }

  if (!rows.length) return []

  rows.sort((a, b) => {
    const lo = (lessonOrder.get(a.lesson_id) ?? 0) - (lessonOrder.get(b.lesson_id) ?? 0)
    if (lo !== 0) return lo
    return a.order_index - b.order_index
  })

  const seen = new Set<string>()
  const problemIds: string[] = []
  for (const row of rows) {
    if (seen.has(row.problem_id)) continue
    seen.add(row.problem_id)
    problemIds.push(row.problem_id)
    if (problemIds.length >= safeLimit) break
  }

  if (!problemIds.length) return []

  const { data: problems, error: problemsError } = await supabase
    .from("problems")
    .select("*")
    .in("id", problemIds)

  if (problemsError) {
    console.error(`Error fetching problems for learning path chapter ${chapterId}:`, problemsError)
    return []
  }

  const byId = new Map(((problems || []) as Problem[]).map((p) => [p.id, p]))
  return problemIds.map((id) => byId.get(id)).filter(Boolean) as Problem[]
}

export function toGradeNumber(grade: string | number | null | undefined): number | null {
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

export async function getCompletedLearningPathLessonIdsForUser(
  client: SupabaseClient,
  userId: string,
  lessonIds: string[]
): Promise<string[]> {
  if (!lessonIds.length) return []

  const { data, error } = await client
    .from("user_learning_path_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)

  if (error) {
    console.error("Error fetching learning path lesson progress:", error)
    return []
  }

  return (data ?? []).map((row) => row.lesson_id as string)
}

export async function getCompletedLearningPathItemIdsForUser(
  client: SupabaseClient,
  userId: string,
  itemIds: string[]
): Promise<string[]> {
  if (!itemIds.length) return []

  const { data, error } = await client
    .from("user_learning_path_item_progress")
    .select("item_id")
    .eq("user_id", userId)
    .in("item_id", itemIds)

  if (error) {
    console.error("Error fetching learning path item progress:", error)
    return []
  }

  return (data ?? []).map((row) => row.item_id as string)
}

/** Primul item (după order_index) din prima lecție cu itemi, din primul capitol activ (după order_index). */
export async function getFirstLearningPathItemHref(): Promise<string | null> {
  const chapters = await getLearningPathChapters()
  const firstChapter = chapters[0]
  if (!firstChapter) return null

  const lessons = await getLearningPathLessonsByChapterId(firstChapter.id)
  for (const lesson of lessons) {
    const items = await getLearningPathLessonItems(lesson.id)
    if (items.length > 0) {
      return getLearningPathItemHref(firstChapter, lesson, 0)
    }
  }

  return null
}

/** Primul item din capitolul identificat prin slug (ex. `cinematica`). */
export async function getFirstLearningPathItemHrefForChapterSlug(
  chapterSlug: string
): Promise<string | null> {
  const chapter = await getLearningPathChapterBySlug(chapterSlug.trim())
  if (!chapter) return null

  const lessons = await getLearningPathLessonsByChapterId(chapter.id)
  for (const lesson of lessons) {
    const items = await getLearningPathLessonItems(lesson.id)
    if (items.length > 0) {
      return getLearningPathItemHref(chapter, lesson, 0)
    }
  }

  return null
}

/** Primul item din parcursul de Cinematică (slug principal + aliasuri din planul free). */
export async function getCinematicaFirstLearningPathItemHref(): Promise<string | null> {
  const slugsToTry = [FREE_LEARNING_PATH_CHAPTER_SLUG, ...FREE_PREVIEW_CHAPTER_SLUG_ALIASES]
  for (const slug of slugsToTry) {
    const href = await getFirstLearningPathItemHrefForChapterSlug(slug)
    if (href) return href
  }
  return null
}
