import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { ITEM_TYPE_LABEL } from "@/components/invata/learning-path-item-body"
import { appendFizicaMapItemQuery } from "@/lib/fizica-map-item-navigation"
import type { GuestLearningPathProgressMap } from "@/lib/guest-learning-path-cookie"
import {
  isInteractiveLessonItemType,
  parseInteractiveItemContent,
} from "@/lib/learning-path-interactive-items"
import { getSubjectMapConfig } from "@/lib/subject-map/config"
import { appendSubjectMapItemQuery } from "@/lib/subject-map/navigation"
import {
  getCompletedLearningPathItemIdsForUser,
  getLearningPathItemHref,
  type LearningPathChapter,
  type LearningPathLesson,
  type LearningPathLessonItem,
  type LearningPathLessonType,
} from "@/lib/supabase-learning-paths"

export type MapLessonItemsSubject = "fizica" | "mate" | "info"

export interface MapLessonItemPreview {
  summary: string | null
  imageUrl: string | null
}

export interface MapLessonItemEntry {
  id: string
  index: number
  title: string
  itemType: LearningPathLessonType
  href: string
  isCompleted: boolean
  preview: MapLessonItemPreview
}

export interface MapLessonItemsResult {
  lessonTitle: string
  items: MapLessonItemEntry[]
}

interface LearningPathItemContext {
  item: LearningPathLessonItem
  lesson: LearningPathLesson
  chapter: LearningPathChapter
  itemIndex: number
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

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

function truncatePlainText(value: string, maxLength = 220): string {
  const stripped = value
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (stripped.length <= maxLength) return stripped
  return `${stripped.slice(0, maxLength - 1).trimEnd()}…`
}

function extractYoutubeVideoId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.replace(/^www\./, "")
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim()
      return id || null
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v")
      if (id) return id
      const pathParts = url.pathname.split("/").filter(Boolean)
      if (pathParts[0] === "embed" && pathParts[1]) return pathParts[1]
      if (pathParts[0] === "shorts" && pathParts[1]) return pathParts[1]
    }
  } catch {
    return null
  }
  return null
}

export function buildMapLessonItemPreview(item: LearningPathLessonItem): MapLessonItemPreview {
  const content = item.content_json

  if (item.item_type === "custom_text" && content && typeof content.body === "string") {
    return { summary: truncatePlainText(content.body), imageUrl: null }
  }

  if (item.item_type === "poll" && content && typeof content === "object") {
    const question = typeof content.question === "string" ? content.question : null
    const imageUrl = typeof content.imageSrc === "string" && content.imageSrc.trim()
      ? content.imageSrc.trim()
      : null
    return { summary: question ? truncatePlainText(question) : null, imageUrl }
  }

  if (item.item_type === "test" && content && typeof content === "object") {
    const title = typeof content.title === "string" ? content.title : null
    const description = typeof content.description === "string" ? content.description : null
    return {
      summary: title ? truncatePlainText(title) : description ? truncatePlainText(description) : null,
      imageUrl: null,
    }
  }

  if (isInteractiveLessonItemType(item.item_type)) {
    const parsed = parseInteractiveItemContent(item.item_type, content ?? null)
    if (parsed.ok) {
      const data = parsed.value.data as Record<string, unknown>
      const text =
        (typeof data.instructions === "string" && data.instructions) ||
        (typeof data.prompt === "string" && data.prompt) ||
        (parsed.value.itemType === "code_trace" &&
          Array.isArray(data.steps) &&
          typeof (data.steps[0] as { prompt?: unknown } | undefined)?.prompt === "string" &&
          ((data.steps[0] as { prompt: string }).prompt)) ||
        null
      if (text) return { summary: truncatePlainText(text), imageUrl: null }
    }
  }

  if (item.item_type === "video") {
    const videoId = extractYoutubeVideoId(item.youtube_url)
    return {
      summary: null,
      imageUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    }
  }

  if (item.item_type === "simulation" && content && typeof content.embedUrl === "string") {
    return { summary: "Simulare interactivă", imageUrl: null }
  }

  return { summary: null, imageUrl: null }
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

    lessonItems.forEach((row, index) => {
      if (itemIds.includes(row.id)) {
        result.set(row.id, {
          item: row as LearningPathLessonItem,
          lesson,
          chapter,
          itemIndex: index,
        })
      }
    })
  }

  return result
}

async function fetchFizicaAssignments(mapLessonId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("fizica_lesson_items")
    .select("id, fizica_lesson_id, learning_path_lesson_item_id, order_index")
    .eq("fizica_lesson_id", mapLessonId)
    .order("order_index", { ascending: true })

  if (error || !data) return []
  return data as { learning_path_lesson_item_id: string; order_index: number }[]
}

async function fetchSubjectMapAssignments(subject: "mate" | "info", mapLessonId: string) {
  const config = getSubjectMapConfig(subject)
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from(config.tables.lessonItems)
    .select("*")
    .eq(config.tables.lessonIdColumn, mapLessonId)
    .order("order_index", { ascending: true })

  if (error || !data) return []
  return data.map((row) => ({
    learning_path_lesson_item_id: row.learning_path_lesson_item_id as string,
    order_index: row.order_index as number,
  }))
}

async function fetchMapLessonTitle(
  subject: MapLessonItemsSubject,
  mapLessonId: string,
): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const table =
    subject === "fizica" ? "fizica_lessons" : getSubjectMapConfig(subject).tables.lessons

  const { data, error } = await supabase
    .from(table)
    .select("title")
    .eq("id", mapLessonId)
    .maybeSingle()

  if (error || !data) return null
  return typeof data.title === "string" ? data.title : null
}

function appendMapContextToHref(
  subject: MapLessonItemsSubject,
  href: string,
  routeSlug: string,
  chapterSlug: string,
  mapLessonId: string,
): string {
  if (subject === "fizica") {
    return appendFizicaMapItemQuery(href, {
      routeSlug,
      chapterSlug,
      fizicaLessonId: mapLessonId,
    })
  }

  return appendSubjectMapItemQuery(href, {
    subject,
    routeSlug,
    chapterSlug,
    mapLessonId,
  })
}

function resolveItemTitle(item: LearningPathLessonItem): string {
  if (item.title?.trim()) return item.title.trim()
  return ITEM_TYPE_LABEL[item.item_type]
}

export async function fetchMapLessonItems(options: {
  subject: MapLessonItemsSubject
  mapLessonId: string
  routeSlug: string
  chapterSlug: string
  userId?: string | null
  progressClient?: SupabaseClient | null
  guestProgressMap?: GuestLearningPathProgressMap
}): Promise<MapLessonItemsResult | null> {
  const assignments =
    options.subject === "fizica"
      ? await fetchFizicaAssignments(options.mapLessonId)
      : await fetchSubjectMapAssignments(options.subject, options.mapLessonId)

  if (assignments.length === 0) {
    const lessonTitle = (await fetchMapLessonTitle(options.subject, options.mapLessonId)) ?? ""
    return { lessonTitle, items: [] }
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
    completedItemIds = resolveCompletedItemIdsFromGuestProgress(
      itemIds,
      options.guestProgressMap,
    )
  }

  const items: MapLessonItemEntry[] = []
  let lessonTitle: string | null = null

  for (const assignment of assignments) {
    const context = itemContexts.get(assignment.learning_path_lesson_item_id)
    if (!context) continue

    if (!lessonTitle) lessonTitle = context.lesson.title

    const baseHref = getLearningPathItemHref(
      context.chapter,
      context.lesson,
      context.itemIndex,
    )
    const href = appendMapContextToHref(
      options.subject,
      baseHref,
      options.routeSlug,
      options.chapterSlug,
      options.mapLessonId,
    )

    items.push({
      id: context.item.id,
      index: items.length + 1,
      title: resolveItemTitle(context.item),
      itemType: context.item.item_type,
      href,
      isCompleted: completedItemIds.has(context.item.id),
      preview: buildMapLessonItemPreview(context.item),
    })
  }

  if (!lessonTitle) {
    lessonTitle = await fetchMapLessonTitle(options.subject, options.mapLessonId)
  }

  return {
    lessonTitle: lessonTitle ?? "",
    items,
  }
}
