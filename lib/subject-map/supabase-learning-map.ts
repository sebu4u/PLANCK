import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { FizicaLessonStatus } from "@/lib/invata-fizica-config"
import type { GuestLearningPathProgressMap } from "@/lib/guest-learning-path-cookie"
import {
  buildFizicaMapLessonLayouts,
  type FizicaMapLessonLayoutInput,
} from "@/lib/fizica-map-layout"
import {
  appendSubjectMapItemQuery,
  buildSubjectMapReturnAfterLessonHref,
  type SubjectMapItemContext,
} from "@/lib/subject-map/navigation"
import type {
  SubjectMapChapter,
  SubjectMapItemNavigation,
  SubjectMapLesson,
  SubjectMapLessonItemAssignment,
  SubjectMapPageData,
  SubjectMapRoute,
  SubjectMapRouteConfig,
} from "@/lib/subject-map/types"
import { computeLearningPathLessonEloTotal } from "@/lib/learning-path-elo"
import {
  getCompletedLearningPathItemIdsForUser,
  getLearningPathItemHref,
  getLearningPathRouteSegments,
  type LearningPathChapter,
  type LearningPathLesson,
  type LearningPathLessonItem,
} from "@/lib/supabase-learning-paths"

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface LearningPathItemContext {
  item: LearningPathLessonItem
  lesson: LearningPathLesson
  chapter: LearningPathChapter
  itemIndex: number
}

function mapAssignmentRow(
  config: SubjectMapRouteConfig,
  row: Record<string, unknown>,
): SubjectMapLessonItemAssignment {
  return {
    id: row.id as string,
    mapLessonId: row[config.tables.lessonIdColumn] as string,
    learning_path_lesson_item_id: row.learning_path_lesson_item_id as string,
    order_index: row.order_index as number,
  }
}

async function fetchRoutes(config: SubjectMapRouteConfig): Promise<SubjectMapRoute[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from(config.tables.routes)
    .select("id, slug, title, order_index, is_active")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (error || !data) return []
  return data as SubjectMapRoute[]
}

async function fetchChaptersForRoute(
  config: SubjectMapRouteConfig,
  routeId: string,
): Promise<SubjectMapChapter[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from(config.tables.chapters)
    .select("id, route_id, slug, title, order_index, is_active")
    .eq("route_id", routeId)
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (error || !data) return []
  return data as SubjectMapChapter[]
}

async function fetchLessonsForChapter(
  config: SubjectMapRouteConfig,
  chapterId: string,
): Promise<SubjectMapLesson[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from(config.tables.lessons)
    .select("id, chapter_id, title, duration_minutes, lesson_type, order_index, is_active")
    .eq("chapter_id", chapterId)
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (error || !data) return []
  return data as SubjectMapLesson[]
}

async function fetchLessonItemAssignments(
  config: SubjectMapRouteConfig,
  lessonIds: string[],
): Promise<SubjectMapLessonItemAssignment[]> {
  if (lessonIds.length === 0) return []
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from(config.tables.lessonItems)
    .select("*")
    .in(config.tables.lessonIdColumn, lessonIds)
    .order("order_index", { ascending: true })

  if (error || !data) return []
  return data.map((row) => mapAssignmentRow(config, row as Record<string, unknown>))
}

async function fetchLearningPathItemContexts(
  itemIds: string[],
): Promise<Map<string, LearningPathItemContext>> {
  const result = new Map<string, LearningPathItemContext>()
  if (itemIds.length === 0) return result

  const supabase = getSupabaseClient()
  if (!supabase) return result

  const { data: items, error: itemsError } = await supabase
    .from("learning_path_lesson_items")
    .select("*")
    .in("id", itemIds)
    .eq("is_active", true)

  if (itemsError || !items?.length) return result

  const lessonIds = [...new Set(items.map((item) => item.lesson_id))]
  const { data: lessons, error: lessonsError } = await supabase
    .from("learning_path_lessons")
    .select("*")
    .in("id", lessonIds)
    .eq("is_active", true)

  if (lessonsError || !lessons?.length) return result

  const chapterIds = [...new Set(lessons.map((lesson) => lesson.chapter_id))]
  const { data: chapters, error: chaptersError } = await supabase
    .from("learning_path_chapters")
    .select("*")
    .in("id", chapterIds)
    .eq("is_active", true)

  if (chaptersError || !chapters?.length) return result

  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter as LearningPathChapter]))
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson as LearningPathLesson]))

  for (const lessonId of lessonIds) {
    const { data: lessonItems } = await supabase
      .from("learning_path_lesson_items")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (!lessonItems) continue
    const lesson = lessonById.get(lessonId)
    if (!lesson) continue
    const chapter = chapterById.get(lesson.chapter_id)
    if (!chapter) continue

    lessonItems.forEach((item, index) => {
      if (itemIds.includes(item.id)) {
        result.set(item.id, {
          item: item as LearningPathLessonItem,
          lesson,
          chapter,
          itemIndex: index,
        })
      }
    })
  }

  return result
}

function resolveLessonStatuses(
  config: SubjectMapRouteConfig,
  lessons: SubjectMapLesson[],
  assignmentsByLesson: Map<string, SubjectMapLessonItemAssignment[]>,
  itemContexts: Map<string, LearningPathItemContext>,
  completedItemIds: Set<string>,
  mapContext?: { routeSlug: string; chapterSlug: string } | null,
): { layouts: FizicaMapLessonLayoutInput[]; completedCount: number } {
  const layouts: FizicaMapLessonLayoutInput[] = []
  let completedCount = 0
  let activeAssigned = false

  for (const lesson of lessons) {
    const assignments = assignmentsByLesson.get(lesson.id) ?? []
    const assignedItemIds = assignments
      .map((assignment) => assignment.learning_path_lesson_item_id)
      .filter((itemId) => itemContexts.has(itemId))

    const allCompleted =
      assignedItemIds.length > 0 &&
      assignedItemIds.every((itemId) => completedItemIds.has(itemId))

    if (allCompleted) completedCount += 1

    const firstItemId = assignedItemIds[0] ?? null
    const firstUncompletedItemId =
      assignedItemIds.find((itemId) => !completedItemIds.has(itemId)) ?? null
    const entryItemId = allCompleted ? firstItemId : firstUncompletedItemId ?? firstItemId
    const context = entryItemId ? itemContexts.get(entryItemId) : undefined

    let status: FizicaLessonStatus = "locked"
    let href: string | null = null

    if (context) {
      const baseHref = getLearningPathItemHref(context.chapter, context.lesson, context.itemIndex)
      href =
        mapContext != null
          ? appendSubjectMapItemQuery(baseHref, {
              subject: config.id,
              routeSlug: mapContext.routeSlug,
              chapterSlug: mapContext.chapterSlug,
              mapLessonId: lesson.id,
            })
          : baseHref

      if (allCompleted) {
        status = "completed"
      } else if (!activeAssigned) {
        status = "active"
        activeAssigned = true
      } else {
        status = "available"
      }
    }

    layouts.push({
      id: lesson.id,
      title: lesson.title,
      type: lesson.lesson_type,
      durationMinutes: lesson.duration_minutes,
      status,
      href,
      orderIndex: lesson.order_index,
    })
  }

  return { layouts, completedCount }
}

function resolveCompletedItemIdsFromGuestProgress(
  itemIds: string[],
  guestProgressMap: GuestLearningPathProgressMap,
): Set<string> {
  const scopedIds = new Set(itemIds)
  const completed = new Set<string>()

  for (const ids of Object.values(guestProgressMap)) {
    if (!Array.isArray(ids)) continue
    for (const id of ids) {
      if (typeof id === "string" && scopedIds.has(id)) {
        completed.add(id)
      }
    }
  }

  return completed
}

function resolveNextChapter(
  chapters: SubjectMapChapter[],
  selectedChapter: SubjectMapChapter,
): SubjectMapChapter | null {
  const currentIndex = chapters.findIndex((chapter) => chapter.id === selectedChapter.id)
  if (currentIndex < 0 || currentIndex >= chapters.length - 1) return null
  return chapters[currentIndex + 1] ?? null
}

function isChapterComplete(
  lessons: SubjectMapLesson[],
  assignmentsByLesson: Map<string, SubjectMapLessonItemAssignment[]>,
  completedItemIds: Set<string>,
): boolean {
  const lessonsWithItems = lessons.filter(
    (lesson) => (assignmentsByLesson.get(lesson.id) ?? []).length > 0,
  )
  if (lessonsWithItems.length === 0) return false

  return lessonsWithItems.every((lesson) => {
    const assignedItemIds = (assignmentsByLesson.get(lesson.id) ?? []).map(
      (assignment) => assignment.learning_path_lesson_item_id,
    )
    return assignedItemIds.every((itemId) => completedItemIds.has(itemId))
  })
}

export async function fetchSubjectMapPageData(
  config: SubjectMapRouteConfig,
  options: {
    routeSlug?: string | null
    chapterSlug?: string | null
    userId?: string | null
    progressClient?: SupabaseClient | null
    guestProgressMap?: GuestLearningPathProgressMap
  },
): Promise<SubjectMapPageData> {
  const routes = await fetchRoutes(config)
  const selectedRoute =
    routes.find((route) => route.slug === options.routeSlug) ?? routes[0] ?? null

  const chapters = selectedRoute ? await fetchChaptersForRoute(config, selectedRoute.id) : []
  const selectedChapter =
    chapters.find((chapter) => chapter.slug === options.chapterSlug) ?? chapters[0] ?? null

  if (!selectedChapter) {
    return {
      routes,
      chapters,
      selectedRoute,
      selectedChapter: null,
      nextChapter: null,
      lessons: [],
      completedLessonCount: 0,
      isCurrentChapterComplete: false,
    }
  }

  const nextChapter = resolveNextChapter(chapters, selectedChapter)
  const mapLessons = await fetchLessonsForChapter(config, selectedChapter.id)
  const lessonIds = mapLessons.map((lesson) => lesson.id)
  const assignments = await fetchLessonItemAssignments(config, lessonIds)

  const assignmentsByLesson = new Map<string, SubjectMapLessonItemAssignment[]>()
  for (const assignment of assignments) {
    const list = assignmentsByLesson.get(assignment.mapLessonId) ?? []
    list.push(assignment)
    assignmentsByLesson.set(assignment.mapLessonId, list)
  }

  const itemIds = assignments.map((assignment) => assignment.learning_path_lesson_item_id)
  const itemContexts = await fetchLearningPathItemContexts(itemIds)

  let completedItemIds = new Set<string>()
  if (options.userId && options.progressClient && itemIds.length > 0) {
    completedItemIds = new Set(
      await getCompletedLearningPathItemIdsForUser(
        options.progressClient,
        options.userId,
        itemIds,
      ),
    )
  } else if (options.guestProgressMap && itemIds.length > 0) {
    completedItemIds = resolveCompletedItemIdsFromGuestProgress(itemIds, options.guestProgressMap)
  }

  const { layouts, completedCount } = resolveLessonStatuses(
    config,
    mapLessons,
    assignmentsByLesson,
    itemContexts,
    completedItemIds,
    selectedRoute && selectedChapter
      ? { routeSlug: selectedRoute.slug, chapterSlug: selectedChapter.slug }
      : null,
  )

  const lessons = buildFizicaMapLessonLayouts(layouts).map((layout) => ({
    ...layout,
    mapLessonId: layout.id,
  }))

  return {
    routes,
    chapters,
    selectedRoute,
    selectedChapter,
    nextChapter,
    lessons,
    completedLessonCount: completedCount,
    isCurrentChapterComplete: isChapterComplete(mapLessons, assignmentsByLesson, completedItemIds),
  }
}

export async function fetchSubjectMapAdminTree(config: SubjectMapRouteConfig): Promise<{
  routes: SubjectMapRoute[]
  chapters: SubjectMapChapter[]
  lessons: SubjectMapLesson[]
  assignments: SubjectMapLessonItemAssignment[]
}> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { routes: [], chapters: [], lessons: [], assignments: [] }
  }

  const { data: routes } = await supabase
    .from(config.tables.routes)
    .select("id, slug, title, order_index, is_active")
    .order("order_index", { ascending: true })

  const { data: chapters } = await supabase
    .from(config.tables.chapters)
    .select("id, route_id, slug, title, order_index, is_active")
    .order("order_index", { ascending: true })

  const { data: lessons } = await supabase
    .from(config.tables.lessons)
    .select("id, chapter_id, title, duration_minutes, lesson_type, order_index, is_active")
    .order("order_index", { ascending: true })

  const { data: assignments } = await supabase
    .from(config.tables.lessonItems)
    .select("*")
    .order("order_index", { ascending: true })

  return {
    routes: (routes ?? []) as SubjectMapRoute[],
    chapters: (chapters ?? []) as SubjectMapChapter[],
    lessons: (lessons ?? []) as SubjectMapLesson[],
    assignments: (assignments ?? []).map((row) =>
      mapAssignmentRow(config, row as Record<string, unknown>),
    ),
  }
}

async function resolveSubjectMapAssignmentData(
  config: SubjectMapRouteConfig,
  context: SubjectMapItemContext,
): Promise<{
  assignmentItems: SubjectMapItemNavigation["assignmentItems"]
  orderedContexts: LearningPathItemContext[]
} | null> {
  const assignments = await fetchLessonItemAssignments(config, [context.mapLessonId])
  if (assignments.length === 0) return null

  const itemIds = assignments.map((assignment) => assignment.learning_path_lesson_item_id)
  const itemContexts = await fetchLearningPathItemContexts(itemIds)
  const orderedContexts = assignments
    .map((assignment) => itemContexts.get(assignment.learning_path_lesson_item_id))
    .filter((entry): entry is LearningPathItemContext => entry != null)

  if (orderedContexts.length === 0) return null

  const assignmentItems = orderedContexts.map((entry) => {
    const { chapterSegment, lessonSegment } = getLearningPathRouteSegments(entry.chapter, entry.lesson)
    return {
      chapterSlug: chapterSegment,
      lessonSlug: lessonSegment,
      itemIndex: entry.itemIndex + 1,
    }
  })

  return { assignmentItems, orderedContexts }
}

export async function resolveSubjectMapItemNavigation(
  config: SubjectMapRouteConfig,
  currentLearningPathItemId: string,
  context: SubjectMapItemContext,
): Promise<SubjectMapItemNavigation | null> {
  const assignmentData = await resolveSubjectMapAssignmentData(config, context)
  if (!assignmentData) return null

  const { assignmentItems, orderedContexts } = assignmentData
  const currentIndex = orderedContexts.findIndex(
    (entry) => entry.item.id === currentLearningPathItemId,
  )
  if (currentIndex < 0) return null

  const isLastItemInAssignment = currentIndex >= orderedContexts.length - 1
  const nextItemHref = isLastItemInAssignment
    ? buildSubjectMapReturnAfterLessonHref(context, context.mapLessonId)
    : appendSubjectMapItemQuery(
        getLearningPathItemHref(
          orderedContexts[currentIndex + 1].chapter,
          orderedContexts[currentIndex + 1].lesson,
          orderedContexts[currentIndex + 1].itemIndex,
        ),
        context,
      )

  const prevItemHref =
    currentIndex > 0
      ? appendSubjectMapItemQuery(
          getLearningPathItemHref(
            orderedContexts[currentIndex - 1].chapter,
            orderedContexts[currentIndex - 1].lesson,
            orderedContexts[currentIndex - 1].itemIndex,
          ),
          context,
        )
      : null

  return {
    nextItemHref,
    prevItemHref,
    isLastItemInAssignment,
    assignmentItems,
    assignmentItemIds: orderedContexts.map((entry) => entry.item.id),
    mapLessonTotalElo: computeLearningPathLessonEloTotal(
      orderedContexts.map((entry) => entry.item),
    ),
  }
}

export function getLearningPathItemLabel(
  item: LearningPathLessonItem,
  lesson?: LearningPathLesson | null,
  chapter?: LearningPathChapter | null,
): string {
  if (item.title?.trim()) return item.title.trim()
  if (lesson?.title?.trim()) return `${lesson.title} · ${item.item_type}`
  if (chapter?.title?.trim()) return `${chapter.title} · ${item.item_type}`
  return `${item.item_type} (${item.id.slice(0, 8)})`
}
