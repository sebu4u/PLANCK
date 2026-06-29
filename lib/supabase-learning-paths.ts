import type { SupabaseClient } from "@supabase/supabase-js"
import {
  FREE_LEARNING_PATH_CHAPTER_SLUG,
  FREE_PREVIEW_CHAPTER_SLUG_ALIASES,
} from "@/lib/learning-path-free-plan"
import {
  getLearningPathItemHref,
  getLearningPathLessonHref,
} from "@/lib/learning-path-routes"
import type { LearningPathInteractiveItemType } from "@/lib/learning-path-interactive-items"
import { supabase } from "@/lib/supabaseClient"
import type { Problem } from "@/data/problems"

export {
  getCanonicalLearningPathLessonPath,
  getLearningPathChapterNavTitle,
  getLearningPathItemHref,
  getLearningPathLessonHref,
  getLearningPathRouteSegments,
  learningPathLessonShowsHubNouBadge,
  learningPathUrlNeedsCanonicalRedirect,
} from "@/lib/learning-path-routes"

/** Row-level `learning_path_lessons.lesson_type` (subset). */
export type LearningPathLessonKind = "text" | "video" | "grila" | "problem"

/** `learning_path_lesson_items.item_type` — includes interactive practice kinds. */
export type LearningPathLessonType =
  | LearningPathLessonKind
  | "math_problem"
  | "coding_problem"
  | "poll"
  | "custom_text"
  | "simulation"
  | "test"
  | LearningPathInteractiveItemType

export interface LearningPathChapter {
  id: string
  slug: string | null
  title: string
  /** Optional short label for the /invata mobile top bar; falls back to `title`. */
  nav_title: string | null
  description: string | null
  icon_url: string | null
  /** Hex accent for dashboard cards (e.g. #7c3aed); null uses default purple. */
  accent_color: string | null
  problem_category: string | null
  /** Dev user IDs explicitly allowed to edit this chapter; null/empty = only super-dev/admin. */
  allowed_dev_user_ids: string[] | null
  order_index: number
  is_active: boolean
  generated_by_user_id?: string | null
  is_personalized?: boolean
  original_prompt?: string | null
  generation_status?: "creating" | "ready" | "failed" | null
  source_summary?: unknown
  generation_metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type LearningPathHubChapter = Pick<
  LearningPathChapter,
  | "id"
  | "slug"
  | "title"
  | "nav_title"
  | "description"
  | "icon_url"
  | "order_index"
  | "is_personalized"
  | "generation_status"
  | "created_at"
>

export interface LearningPathLesson {
  id: string
  chapter_id: string
  slug: string | null
  title: string
  description: string | null
  image_url: string | null
  lesson_type: LearningPathLessonKind
  cursuri_lesson_slug: string | null
  youtube_url: string | null
  quiz_question_id: string | null
  problem_id: string | null
  order_index: number
  is_active: boolean
  /** Green „nou” pill on /invata mobile hub cards. */
  hub_show_nou_badge: boolean
  created_at: string
  updated_at: string
}

export type LearningPathHubLesson = Pick<
  LearningPathLesson,
  | "id"
  | "chapter_id"
  | "slug"
  | "title"
  | "image_url"
  | "order_index"
  | "hub_show_nou_badge"
>

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

export function getNextIncompleteLearningPathItem(
  items: LearningPathLessonItem[],
  completedItemIds: Iterable<string>
): LearningPathLessonItem | null {
  const completed = new Set(completedItemIds)
  return items.find((item) => !completed.has(item.id)) ?? null
}

/** Matches level grouping on the lesson page (`learning-path-lesson-page.tsx`). */
export const LEARNING_PATH_ITEMS_PER_LEVEL = 6

export interface LearningPathChapterDashboardSnapshot {
  currentLevel: number
  previewLessons: LearningPathLesson[]
  hasStarted: boolean
  resumeHref: string
}

export async function getLearningPathChapterDashboardSnapshot(
  client: SupabaseClient,
  userId: string,
  chapter: LearningPathChapter,
  lessons: LearningPathLesson[]
): Promise<LearningPathChapterDashboardSnapshot> {
  const firstLesson = lessons[0]
  if (!firstLesson) {
    return {
      currentLevel: 1,
      previewLessons: [],
      hasStarted: false,
      resumeHref: "/invata",
    }
  }

  const lessonIds = lessons.map((lesson) => lesson.id)
  const completedLessonIds = new Set(
    await getCompletedLearningPathLessonIdsForUser(client, userId, lessonIds)
  )

  let hasStarted = completedLessonIds.size > 0
  let currentLevel = 1
  let currentLessonIndex = 0
  let resumeHref = getLearningPathLessonHref(chapter, firstLesson)
  let foundIncomplete = false

  for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
    const lesson = lessons[lessonIndex]
    const items = await getLearningPathLessonItems(lesson.id)
    const lessonHref = getLearningPathLessonHref(chapter, lesson)

    if (!items.length) {
      if (!completedLessonIds.has(lesson.id)) {
        foundIncomplete = true
        currentLessonIndex = lessonIndex
        resumeHref = lessonHref
        break
      }
      continue
    }

    const completedItemIds = await getCompletedLearningPathItemIdsForUser(
      client,
      userId,
      items.map((item) => item.id)
    )

    if (completedItemIds.length > 0) {
      hasStarted = true
    }

    const nextItem = getNextIncompleteLearningPathItem(items, completedItemIds)
    if (nextItem) {
      foundIncomplete = true
      currentLessonIndex = lessonIndex
      const nextItemIndex = items.findIndex((item) => item.id === nextItem.id)
      currentLevel =
        Math.floor(Math.max(nextItemIndex, 0) / LEARNING_PATH_ITEMS_PER_LEVEL) + 1
      resumeHref = getLearningPathItemHref(chapter, lesson, Math.max(nextItemIndex, 0))
      break
    }
  }

  if (!foundIncomplete && hasStarted) {
    const lastLesson = lessons[lessons.length - 1] ?? firstLesson
    const lastItems = await getLearningPathLessonItems(lastLesson.id)
    currentLessonIndex = Math.max(lessons.length - 2, 0)
    currentLevel =
      lastItems.length > 0
        ? Math.ceil(lastItems.length / LEARNING_PATH_ITEMS_PER_LEVEL)
        : 1
    resumeHref = getLearningPathLessonHref(chapter, lastLesson)
  }

  const previewLessons = lessons.slice(currentLessonIndex, currentLessonIndex + 2)

  return {
    currentLevel,
    previewLessons,
    hasStarted,
    resumeHref,
  }
}

export async function getLearningPathChapters(client: SupabaseClient = supabase): Promise<LearningPathChapter[]> {
  const { data, error } = await client
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

export async function getUserPersonalizedLearningPathHubChapters(
  userId: string,
  client: SupabaseClient = supabase
): Promise<LearningPathHubChapter[]> {
  if (!userId) return []

  const { data, error } = await client
    .from("learning_path_chapters")
    .select(
      "id, slug, title, nav_title, description, icon_url, order_index, is_personalized, generation_status, created_at"
    )
    .eq("generated_by_user_id", userId)
    .eq("is_personalized", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching personalized learning path hub chapters:", error)
    return []
  }

  return (data || []) as LearningPathHubChapter[]
}

/**
 * Fetch the current user's personalized chapters that are still being generated
 * (generation_status creating/failed, is_active=false). These are shown on /invata
 * as in-progress cards so the user sees real-time progress without navigating away.
 */
export async function getInProgressPersonalizedChapters(
  userId: string,
  client: SupabaseClient = supabase,
): Promise<LearningPathChapter[]> {
  if (!userId) return []
  const { data, error } = await client
    .from("learning_path_chapters")
    .select("*")
    .eq("generated_by_user_id", userId)
    .eq("is_personalized", true)
    .eq("is_active", false)
    .in("generation_status", ["creating", "failed"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching in-progress personalized chapters:", error)
    return []
  }

  return data || []
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test((value || "").trim())
}

export async function getLearningPathChapterBySlug(
  slug: string,
  client: SupabaseClient = supabase
): Promise<LearningPathChapter | null> {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const { data, error } = await client
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

export async function getLearningPathChapterById(
  id: string,
  client: SupabaseClient = supabase
): Promise<LearningPathChapter | null> {
  const normalizedId = id.trim()
  if (!normalizedId) return null

  const { data, error } = await client
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

export async function getLearningPathLessonsByChapterId(
  chapterId: string,
  client: SupabaseClient = supabase
): Promise<LearningPathLesson[]> {
  const { data, error } = await client
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

export async function getLearningPathLessonsByChapterIds(
  chapterIds: string[],
  client: SupabaseClient = supabase
): Promise<Record<string, LearningPathLesson[]>> {
  if (!chapterIds.length) return {}
  const { data, error } = await client
    .from("learning_path_lessons")
    .select("*")
    .in("chapter_id", chapterIds)
    .eq("is_active", true)
    .order("order_index")

  if (error) {
    console.error("Error fetching lessons for chapters:", error)
    return {}
  }

  const map: Record<string, LearningPathLesson[]> = {}
  for (const row of data ?? []) {
    (map[row.chapter_id] ??= []).push(row)
  }
  return map
}

export async function getLearningPathHubLessonsByChapterIds(
  chapterIds: string[],
  client: SupabaseClient = supabase
): Promise<Record<string, LearningPathHubLesson[]>> {
  if (!chapterIds.length) return {}
  const { data, error } = await client
    .from("learning_path_lessons")
    .select("id, chapter_id, slug, title, image_url, order_index, hub_show_nou_badge")
    .in("chapter_id", chapterIds)
    .eq("is_active", true)
    .order("order_index")

  if (error) {
    console.error("Error fetching hub lessons for chapters:", error)
    return {}
  }

  const map: Record<string, LearningPathHubLesson[]> = {}
  for (const row of (data ?? []) as LearningPathHubLesson[]) {
    const chapterLessons = map[row.chapter_id] ?? []
    chapterLessons.push(row)
    map[row.chapter_id] = chapterLessons
  }
  return map
}

export async function getLearningPathLessonBySlug(
  chapterSlug: string,
  lessonSlug: string,
  client: SupabaseClient = supabase
): Promise<LearningPathLesson | null> {
  const chapter = isUuid(chapterSlug)
    ? await getLearningPathChapterById(chapterSlug, client)
    : await getLearningPathChapterBySlug(chapterSlug, client)
  const normalizedLessonSlug = lessonSlug.trim()

  if (!chapter || !normalizedLessonSlug) {
    return null
  }

  const { data, error } = await client
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

export async function getLearningPathLessonById(
  lessonId: string,
  client: SupabaseClient = supabase
): Promise<LearningPathLesson | null> {
  const normalizedId = lessonId.trim()
  if (!normalizedId) return null

  const { data, error } = await client
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

export async function getLearningPathLessonItems(
  lessonId: string,
  client: SupabaseClient = supabase
): Promise<LearningPathLessonItem[]> {
  const { data, error } = await client
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

export type LearningPathLessonItemAggregates = {
  counts: Record<string, number>
  itemIdsByLessonId: Record<string, string[]>
}

const LEARNING_PATH_LESSON_ITEMS_IN_CHUNK_SIZE = 80

/** Active item counts per lesson (batched queries for hub totals). */
export async function getLearningPathLessonItemCountsByLessonIds(
  lessonIds: string[],
  client: SupabaseClient = supabase
): Promise<Record<string, number>> {
  if (!lessonIds.length) return {}

  const counts: Record<string, number> = {}

  for (let i = 0; i < lessonIds.length; i += LEARNING_PATH_LESSON_ITEMS_IN_CHUNK_SIZE) {
    const chunk = lessonIds.slice(i, i + LEARNING_PATH_LESSON_ITEMS_IN_CHUNK_SIZE)
    const { data, error } = await client
      .from("learning_path_lesson_items")
      .select("lesson_id")
      .in("lesson_id", chunk)
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching learning path lesson item counts:", error)
      continue
    }

    for (const row of data ?? []) {
      const lessonId = row.lesson_id as string
      counts[lessonId] = (counts[lessonId] ?? 0) + 1
    }
  }

  return counts
}

/** Active item counts and IDs per lesson (batched queries for hub progress). */
export async function getLearningPathLessonItemAggregates(
  lessonIds: string[],
  client: SupabaseClient = supabase
): Promise<LearningPathLessonItemAggregates> {
  if (!lessonIds.length) {
    return { counts: {}, itemIdsByLessonId: {} }
  }

  const counts: Record<string, number> = {}
  const itemIdsByLessonId: Record<string, string[]> = {}

  for (let i = 0; i < lessonIds.length; i += LEARNING_PATH_LESSON_ITEMS_IN_CHUNK_SIZE) {
    const chunk = lessonIds.slice(i, i + LEARNING_PATH_LESSON_ITEMS_IN_CHUNK_SIZE)
    const { data, error } = await client
      .from("learning_path_lesson_items")
      .select("id, lesson_id")
      .in("lesson_id", chunk)
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching learning path lesson item aggregates:", error)
      continue
    }

    for (const row of data ?? []) {
      const lessonId = row.lesson_id as string
      const itemId = row.id as string
      counts[lessonId] = (counts[lessonId] ?? 0) + 1
      if (!itemIdsByLessonId[lessonId]) itemIdsByLessonId[lessonId] = []
      itemIdsByLessonId[lessonId].push(itemId)
    }
  }

  return { counts, itemIdsByLessonId }
}

export async function getLearningPathItemCountsByLessonIds(
  lessonIds: string[]
): Promise<Record<string, number>> {
  return getLearningPathLessonItemCountsByLessonIds(lessonIds)
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

/** PostgREST rejects very large `.in()` lists (URL / filter limits). */
const LEARNING_PATH_ITEM_PROGRESS_IN_CHUNK_SIZE = 80

function logLearningPathItemProgressError(error: {
  message?: string
  code?: string
  details?: string
  hint?: string
}) {
  console.error(
    "Error fetching learning path item progress:",
    error.message || error.code || error,
    error.details ?? "",
    error.hint ?? ""
  )
}

export async function getCompletedLearningPathItemIdsForUser(
  client: SupabaseClient,
  userId: string,
  itemIds: string[]
): Promise<string[]> {
  if (!itemIds.length) return []

  const scopedIds = new Set(itemIds)
  const completed = new Set<string>()

  const collectMatching = (rows: { item_id: string }[] | null) => {
    for (const row of rows ?? []) {
      const id = row.item_id as string
      if (scopedIds.has(id)) completed.add(id)
    }
  }

  // Hub loads every item id at once; fetch by user and filter in memory.
  if (itemIds.length > LEARNING_PATH_ITEM_PROGRESS_IN_CHUNK_SIZE) {
    const { data, error } = await client
      .from("user_learning_path_item_progress")
      .select("item_id")
      .eq("user_id", userId)

    if (error) {
      logLearningPathItemProgressError(error)
      return []
    }

    collectMatching(data)
    return Array.from(completed)
  }

  for (let i = 0; i < itemIds.length; i += LEARNING_PATH_ITEM_PROGRESS_IN_CHUNK_SIZE) {
    const chunk = itemIds.slice(i, i + LEARNING_PATH_ITEM_PROGRESS_IN_CHUNK_SIZE)
    const { data, error } = await client
      .from("user_learning_path_item_progress")
      .select("item_id")
      .eq("user_id", userId)
      .in("item_id", chunk)

    if (error) {
      logLearningPathItemProgressError(error)
      return Array.from(completed)
    }

    collectMatching(data)
  }

  return Array.from(completed)
}

/** Capitolul din ultimul item de learning path completat de user (după completed_at). */
export async function getLastWorkedLearningPathChapterIdForUser(
  client: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: progressRow, error: progressError } = await client
    .from("user_learning_path_item_progress")
    .select("item_id")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (progressError) {
    console.error("Error fetching last worked learning path item:", progressError)
    return null
  }

  const itemId = progressRow?.item_id
  if (!itemId) return null

  const { data: itemRow, error: itemError } = await client
    .from("learning_path_lesson_items")
    .select("learning_path_lessons(chapter_id)")
    .eq("id", itemId)
    .maybeSingle()

  if (itemError) {
    console.error("Error resolving chapter for last worked learning path item:", itemError)
    return null
  }

  const lesson = itemRow?.learning_path_lessons as { chapter_id?: string } | { chapter_id?: string }[] | null
  const chapterId = Array.isArray(lesson) ? lesson[0]?.chapter_id : lesson?.chapter_id
  return chapterId ?? null
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

/** Unde continuă userul într-un capitol: primul item necompletat, sau ultima lecție dacă totul e parcurs. */
export async function getLearningPathResumeHrefForChapter(
  client: SupabaseClient,
  userId: string,
  chapter: LearningPathChapter,
  lessons: LearningPathLesson[]
): Promise<string> {
  const firstLesson = lessons[0]
  if (!firstLesson) return "/invata"

  const lessonIds = lessons.map((lesson) => lesson.id)
  const completedLessonIds = new Set(
    await getCompletedLearningPathLessonIdsForUser(client, userId, lessonIds)
  )

  for (const lesson of lessons) {
    const items = await getLearningPathLessonItems(lesson.id)
    const lessonHref = getLearningPathLessonHref(chapter, lesson)

    if (!items.length) {
      if (!completedLessonIds.has(lesson.id)) return lessonHref
      continue
    }

    const completedItemIds = await getCompletedLearningPathItemIdsForUser(
      client,
      userId,
      items.map((item) => item.id)
    )
    const nextItem = getNextIncompleteLearningPathItem(items, completedItemIds)

    if (nextItem) {
      const nextItemIndex = items.findIndex((item) => item.id === nextItem.id)
      return getLearningPathItemHref(chapter, lesson, Math.max(nextItemIndex, 0))
    }
  }

  const lastLesson = lessons[lessons.length - 1] ?? firstLesson
  return getLearningPathLessonHref(chapter, lastLesson)
}

/** Unde continuă userul în parcurs: primul capitol cu itemi necompletați, altfel Cinematică. */
export async function getLearningPathResumeHrefForUser(
  userId: string,
  client: SupabaseClient = supabase
): Promise<string> {
  const chapters = await getLearningPathChapters()

  for (const chapter of chapters) {
    const lessons = await getLearningPathLessonsByChapterId(chapter.id)
    if (!lessons.length) continue

    for (const lesson of lessons) {
      const items = await getLearningPathLessonItems(lesson.id)
      if (!items.length) continue

      const completedItemIds = await getCompletedLearningPathItemIdsForUser(
        client,
        userId,
        items.map((item) => item.id)
      )
      const nextItem = getNextIncompleteLearningPathItem(items, completedItemIds)
      if (nextItem) {
        return getLearningPathResumeHrefForChapter(client, userId, chapter, lessons)
      }
    }
  }

  const lastChapter = chapters[chapters.length - 1]
  if (lastChapter) {
    const lessons = await getLearningPathLessonsByChapterId(lastChapter.id)
    if (lessons.length) {
      return getLearningPathResumeHrefForChapter(client, userId, lastChapter, lessons)
    }
  }

  const cinematicaHref = await getCinematicaFirstLearningPathItemHref()
  if (cinematicaHref) return cinematicaHref

  const fallback = await getFirstLearningPathItemHref()
  return fallback ?? "/invata"
}
