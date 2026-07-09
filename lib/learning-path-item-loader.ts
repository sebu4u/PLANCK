import type { Problem } from "@/data/problems"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import type { Lesson as PhysicsLesson } from "@/lib/supabase-physics"
import type { QuizQuestion } from "@/lib/types/quiz-questions"
import type { SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { supabase } from "@/lib/supabaseClient"
import { fetchQuizQuestionById } from "@/lib/supabase-quiz"
import { getLearningPathAccess, type LearningPathAccess } from "@/lib/learning-path-access"
import { createClient } from "@/lib/supabase/server"
import {
  getLearningPathLessonHref,
  getLearningPathRouteSegments,
  getLearningPathChapterById,
  getLearningPathChapterBySlug,
  getLearningPathLessonById,
  getLearningPathLessonBySlug,
  getLearningPathLessonItems,
  getCompletedLearningPathItemIdsForUser,
  isUuid,
  type LearningPathChapter,
  type LearningPathLesson,
  type LearningPathLessonItem,
} from "@/lib/supabase-learning-paths"
import { MATH_PROBLEMS_SOLVE_COLUMNS } from "@/data/math-problems"
import { mathProblemRowToProblem } from "@/lib/math-problem-to-learning-path-problem"
import { getLessonBySlug } from "@/lib/supabase-physics"
import { cookies } from "next/headers"
import { FREE_PLAN_LEARNING_PATH_ITEM_LIMIT } from "@/lib/learning-path-free-plan"
import { getCachedOnboardingCustomLessonIds } from "@/lib/learning-path-hub-cache"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  countGuestCompletedLearningPathItems,
  getGuestCompletedItemIdsForLesson,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"
import type { FizicaMapItemContext } from "@/lib/fizica-map-item-navigation"
import {
  resolveFizicaMapItemNavigation,
  type FizicaMapAssignmentItemRoute,
} from "@/lib/supabase-fizica-learning-map"
import type { SubjectMapItemContext } from "@/lib/subject-map/navigation"
import { resolveSubjectMapItemNavigation } from "@/lib/subject-map/supabase-learning-map"
import type { SubjectMapAssignmentItemRoute } from "@/lib/subject-map/types"
import { getSubjectMapConfig } from "@/lib/subject-map/config"
import { ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG } from "@/lib/onboarding-custom-lesson"

export interface LearningPathItemPayload {
  chapterSlug: string
  lessonSlug: string
  itemIndex: number
  chapter: LearningPathChapter
  lesson: LearningPathLesson
  item: LearningPathLessonItem
  items: LearningPathLessonItem[]
  lessonId: string
  lessonBaseHref: string
  nextItemHref: string
  initialCurrentItemCompleted: boolean
  completedItemIdsForLesson: string[]
  isTextLesson: boolean
  hideBottomCta: boolean
  overflowHidden: boolean
  fullWidth: boolean
  sourceLesson: PhysicsLesson | null
  sourceProblem: Problem | null
  sourceCodingProblem: CodingProblem | null
  sourceCodingExamples: CodingProblemExample[]
  sourceQuizQuestion: QuizQuestion | null
  isLastItem: boolean
  prevItemHref?: string | null
  fizicaMapContext?: FizicaMapItemContext | null
  fizicaAssignmentItems?: FizicaMapAssignmentItemRoute[]
  fizicaAssignmentItemIds?: string[]
  completedItemIdsForFizicaAssignment?: string[]
  fizicaLessonTotalElo?: number
  subjectMapContext?: SubjectMapItemContext | null
  subjectMapAssignmentItems?: SubjectMapAssignmentItemRoute[]
  subjectMapAssignmentItemIds?: string[]
  completedItemIdsForSubjectMapAssignment?: string[]
  subjectMapLessonTotalElo?: number
  /** Hidden onboarding chapter (see `ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG`): plain single lesson, own completion+offer flow. */
  isOnboardingLesson?: boolean
}

export type LearningPathItemLoadResult =
  | { status: "not_found" }
  | { status: "invalid_index" }
  | { status: "locked"; chapter: LearningPathChapter; lesson: LearningPathLesson }
  | { status: "blocked"; lessonBaseHref: string }
  | { status: "ok"; payload: LearningPathItemPayload }

type StaticLearningPathItemPayload = Omit<
  LearningPathItemPayload,
  | "initialCurrentItemCompleted"
  | "completedItemIdsForLesson"
  | "completedItemIdsForFizicaAssignment"
  | "completedItemIdsForSubjectMapAssignment"
>

type StaticLearningPathItemLoadResult =
  | { status: "not_found" }
  | { status: "invalid_index" }
  | { status: "personalized" }
  | { status: "ok"; payload: StaticLearningPathItemPayload }

const LEARNING_PATH_ITEM_STATIC_CACHE_SECONDS = 60 * 60

export async function resolveLessonContext(chapterSlug: string, lessonSlug: string, client = supabase) {
  const chapter = isUuid(chapterSlug)
    ? await getLearningPathChapterById(chapterSlug, client)
    : await getLearningPathChapterBySlug(chapterSlug, client)

  if (!chapter) return { chapter: null, lesson: null }

  const lesson = isUuid(lessonSlug)
    ? await getLearningPathLessonById(lessonSlug, client)
    : await getLearningPathLessonBySlug(chapterSlug, lessonSlug, client)

  if (!lesson || lesson.chapter_id !== chapter.id) {
    return { chapter: null, lesson: null }
  }

  return { chapter, lesson }
}

function computeItemUiFlags(
  item: LearningPathLessonItem,
  sourceProblem: Problem | null,
  sourceCodingProblem: CodingProblem | null
) {
  const isLinkedTextItem = item.item_type === "text"
  const isCustomTextItem = item.item_type === "custom_text"
  const isPoll = item.item_type === "poll"
  const isProblem =
    (item.item_type === "problem" || item.item_type === "math_problem") && !!sourceProblem
  const isCodingProblem = item.item_type === "coding_problem" && !!sourceCodingProblem
  const isTest = item.item_type === "test"
  const isCardSort = item.item_type === "card_sort"
  const isFillSlot = item.item_type === "fill_slot"
  const isMatch = item.item_type === "match"
  const isBareInteractiveItem =
    isCardSort ||
    isFillSlot ||
    isMatch ||
    item.item_type === "graph_build" ||
    item.item_type === "code_trace" ||
    item.item_type === "swipe_classify" ||
    item.item_type === "slider_explore" ||
    item.item_type === "memory_flip" ||
    item.item_type === "reveal_steps"
  const problemHasAnswer =
    sourceProblem &&
    (sourceProblem.answer_type === "value" || sourceProblem.answer_type === "grila")

  return {
    isTextLesson: isLinkedTextItem || isCustomTextItem,
    hideBottomCta:
      isPoll ||
      isTest ||
      (isProblem && !!problemHasAnswer) ||
      isCodingProblem ||
      isBareInteractiveItem,
    overflowHidden: isProblem || isCodingProblem,
    fullWidth: isProblem || isCodingProblem,
  }
}

async function loadItemContent(item: LearningPathLessonItem) {
  const isLinkedTextItem = item.item_type === "text"
  const sourceLesson =
    isLinkedTextItem && item.cursuri_lesson_slug ? await getLessonBySlug(item.cursuri_lesson_slug) : null

  let sourceProblem: Problem | null = null
  if (item.item_type === "problem" && item.problem_id) {
    const { data } = await supabase.from("problems").select("*").eq("id", item.problem_id).single()
    sourceProblem = data as Problem | null
  } else if (item.item_type === "math_problem" && item.problem_id) {
    const { data } = await supabase
      .from("math_problems")
      .select(MATH_PROBLEMS_SOLVE_COLUMNS)
      .eq("id", item.problem_id)
      .eq("is_active", true)
      .maybeSingle()
    if (data) {
      sourceProblem = mathProblemRowToProblem(data)
    }
  }

  let sourceCodingProblem: CodingProblem | null = null
  let sourceCodingExamples: CodingProblemExample[] = []
  if (item.item_type === "coding_problem" && item.problem_id) {
    const { data: codingRow } = await supabase
      .from("coding_problems")
      .select("*")
      .eq("id", item.problem_id)
      .eq("is_active", true)
      .maybeSingle()
    if (codingRow) {
      sourceCodingProblem = {
        ...(codingRow as CodingProblem),
        tags: Array.isArray(codingRow.tags) ? codingRow.tags : [],
      }
      const { data: examples } = await supabase
        .from("coding_problem_examples")
        .select("*")
        .eq("problem_id", codingRow.id)
        .order("order_index", { ascending: true })
      sourceCodingExamples = (examples ?? []) as CodingProblemExample[]
    }
  }

  const sourceQuizQuestion =
    item.item_type === "grila" && item.quiz_question_id
      ? await fetchQuizQuestionById(item.quiz_question_id)
      : null

  return { sourceLesson, sourceProblem, sourceCodingProblem, sourceCodingExamples, sourceQuizQuestion }
}

async function getProgressState(
  access: LearningPathAccess,
  lessonId: string,
  items: LearningPathLessonItem[],
  currentItemId: string
) {
  const supabaseForProgress = await createClient()
  const {
    data: { user: progressUser },
  } = await supabaseForProgress.auth.getUser()

  let guestProgressMap = parseGuestLearningPathProgress(undefined)
  if (access.mode === "free-preview" && !progressUser) {
    const cookieStore = await cookies()
    guestProgressMap = parseGuestLearningPathProgress(
      cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value
    )
  }
  const onboardingLessonIdsForGuestQuota =
    access.mode === "free-preview" && !progressUser ? await getCachedOnboardingCustomLessonIds() : []
  const guestGlobalSolved =
    access.mode === "free-preview" && !progressUser
      ? countGuestCompletedLearningPathItems(guestProgressMap, onboardingLessonIdsForGuestQuota)
      : 0

  let completedItemIdsForLesson: string[] = []
  let initialCurrentItemCompleted = false
  if (progressUser) {
    completedItemIdsForLesson = await getCompletedLearningPathItemIdsForUser(
      supabaseForProgress,
      progressUser.id,
      items.map((i) => i.id)
    )
    initialCurrentItemCompleted = completedItemIdsForLesson.includes(currentItemId)
  } else if (access.mode === "free-preview") {
    completedItemIdsForLesson = getGuestCompletedItemIdsForLesson(guestProgressMap, lessonId)
    initialCurrentItemCompleted = completedItemIdsForLesson.includes(currentItemId)
  }

  const itemsRemainingForFreePreview =
    access.mode === "free-preview"
      ? progressUser
        ? access.itemsRemaining
        : Math.max(0, FREE_PLAN_LEARNING_PATH_ITEM_LIMIT - guestGlobalSolved)
      : 0

  return {
    completedItemIdsForLesson,
    initialCurrentItemCompleted,
    itemsRemainingForFreePreview,
    progressUser,
    guestProgressMap,
  }
}

function isBlockedByFreePlan(
  access: LearningPathAccess,
  items: LearningPathLessonItem[],
  item: LearningPathLessonItem,
  completedItemIdsForLesson: string[],
  initialCurrentItemCompleted: boolean,
  itemsRemainingForFreePreview: number
): boolean {
  if (access.mode !== "free-preview") return false

  const completedSet = new Set(completedItemIdsForLesson)
  const nextItemId = items.find((i) => !completedSet.has(i.id))?.id ?? items[0]?.id ?? null
  const isCurrentItemNext = item.id === nextItemId
  const isCurrentItemCompleted = initialCurrentItemCompleted

  if (isCurrentItemCompleted) return false

  const blockedBySkip = !isCurrentItemNext
  const blockedByLimit = isCurrentItemNext && itemsRemainingForFreePreview <= 0
  return blockedBySkip || blockedByLimit
}

function isPersonalizedLearningPathChapter(chapter: LearningPathChapter): boolean {
  return chapter.is_personalized === true || Boolean(chapter.generated_by_user_id)
}

async function loadStaticLearningPathItemPayloadWithClient(
  client: SupabaseClient,
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  fizicaRouteSlug: string,
  fizicaChapterSlug: string,
  fizicaLessonId: string,
  subjectMapContext: SubjectMapItemContext | null,
  options?: { allowPersonalized?: boolean },
): Promise<StaticLearningPathItemLoadResult> {
  if (!Number.isFinite(itemIndex) || itemIndex < 1) {
    return { status: "invalid_index" }
  }

  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug, client)
  if (!chapter || !lesson) {
    return { status: "not_found" }
  }

  if (!options?.allowPersonalized && isPersonalizedLearningPathChapter(chapter)) {
    return { status: "personalized" }
  }

  const items = await getLearningPathLessonItems(lesson.id, client)
  const item = items[itemIndex - 1]
  if (!item) {
    return { status: "not_found" }
  }

  const lessonBaseHref = getLearningPathLessonHref(chapter, lesson)
  const { chapterSegment, lessonSegment } = getLearningPathRouteSegments(chapter, lesson)

  const { sourceLesson, sourceProblem, sourceCodingProblem, sourceCodingExamples, sourceQuizQuestion } =
    await loadItemContent(item)

  const uiFlags = computeItemUiFlags(item, sourceProblem, sourceCodingProblem)
  let nextItemHref =
    itemIndex < items.length ? `${lessonBaseHref}/${itemIndex + 1}` : lessonBaseHref
  let prevItemHref: string | null = itemIndex > 1 ? `${lessonBaseHref}/${itemIndex - 1}` : null
  let isLastItem = itemIndex >= items.length
  const fizicaMapContext =
    fizicaRouteSlug && fizicaChapterSlug && fizicaLessonId
      ? {
          routeSlug: fizicaRouteSlug,
          chapterSlug: fizicaChapterSlug,
          fizicaLessonId,
        }
      : null

  let fizicaAssignmentItems: FizicaMapAssignmentItemRoute[] | undefined
  let fizicaAssignmentItemIds: string[] | undefined
  let fizicaLessonTotalElo: number | undefined

  if (fizicaMapContext) {
    const fizicaNavigation = await resolveFizicaMapItemNavigation(item.id, fizicaMapContext)
    if (fizicaNavigation) {
      nextItemHref = fizicaNavigation.nextItemHref
      prevItemHref = fizicaNavigation.prevItemHref
      isLastItem = fizicaNavigation.isLastItemInAssignment
      fizicaAssignmentItems = fizicaNavigation.assignmentItems
      fizicaAssignmentItemIds = fizicaNavigation.assignmentItemIds
      fizicaLessonTotalElo = fizicaNavigation.fizicaLessonTotalElo
    }
  }

  let subjectMapAssignmentItems: SubjectMapAssignmentItemRoute[] | undefined
  let subjectMapAssignmentItemIds: string[] | undefined
  let subjectMapLessonTotalElo: number | undefined

  if (subjectMapContext) {
    const subjectNavigation = await resolveSubjectMapItemNavigation(
      getSubjectMapConfig(subjectMapContext.subject),
      item.id,
      subjectMapContext,
    )
    if (subjectNavigation) {
      nextItemHref = subjectNavigation.nextItemHref
      prevItemHref = subjectNavigation.prevItemHref
      isLastItem = subjectNavigation.isLastItemInAssignment
      subjectMapAssignmentItems = subjectNavigation.assignmentItems
      subjectMapAssignmentItemIds = subjectNavigation.assignmentItemIds
      subjectMapLessonTotalElo = subjectNavigation.mapLessonTotalElo
    }
  }

  return {
    status: "ok",
    payload: {
      chapterSlug: chapterSegment,
      lessonSlug: lessonSegment,
      itemIndex,
      chapter,
      lesson,
      item,
      items,
      lessonId: lesson.id,
      lessonBaseHref,
      nextItemHref,
      prevItemHref,
      fizicaMapContext,
      fizicaAssignmentItems,
      fizicaAssignmentItemIds,
      fizicaLessonTotalElo,
      subjectMapContext,
      subjectMapAssignmentItems,
      subjectMapAssignmentItemIds,
      subjectMapLessonTotalElo,
      isOnboardingLesson: chapter.slug === ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG,
      sourceLesson,
      sourceProblem,
      sourceCodingProblem,
      sourceCodingExamples,
      sourceQuizQuestion,
      isLastItem,
      ...uiFlags,
    },
  }
}

async function loadCacheableStaticLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  fizicaRouteSlug: string,
  fizicaChapterSlug: string,
  fizicaLessonId: string,
  subjectMapCacheKey: string,
): Promise<StaticLearningPathItemLoadResult> {
  const subjectMapContext = parseSubjectMapCacheKey(subjectMapCacheKey)
  return loadStaticLearningPathItemPayloadWithClient(
    supabase,
    chapterSlug,
    lessonSlug,
    itemIndex,
    fizicaRouteSlug,
    fizicaChapterSlug,
    fizicaLessonId,
    subjectMapContext,
  )
}

function serializeSubjectMapCacheKey(context: SubjectMapItemContext | null | undefined): string {
  if (!context) return ""
  return `${context.subject}:${context.routeSlug}:${context.chapterSlug}:${context.mapLessonId}`
}

function parseSubjectMapCacheKey(value: string): SubjectMapItemContext | null {
  if (!value) return null
  const [subject, routeSlug, chapterSlug, mapLessonId] = value.split(":")
  if (
    (subject !== "mate" && subject !== "info") ||
    !routeSlug ||
    !chapterSlug ||
    !mapLessonId
  ) {
    return null
  }
  return { subject, routeSlug, chapterSlug, mapLessonId }
}

const loadCachedStaticLearningPathItemPayload = unstable_cache(
  loadCacheableStaticLearningPathItemPayload,
  ["learning-path-item-static-payload-v3"],
  { revalidate: LEARNING_PATH_ITEM_STATIC_CACHE_SECONDS },
)

export async function loadLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  options?: {
    fizicaMapContext?: FizicaMapItemContext | null
    subjectMapContext?: SubjectMapItemContext | null
  },
): Promise<LearningPathItemLoadResult> {
  if (!Number.isFinite(itemIndex) || itemIndex < 1) {
    return { status: "invalid_index" }
  }

  const fizicaMapContext = options?.fizicaMapContext ?? null
  const subjectMapContext = options?.subjectMapContext ?? null
  const cachedStaticResult = await loadCachedStaticLearningPathItemPayload(
    chapterSlug,
    lessonSlug,
    itemIndex,
    fizicaMapContext?.routeSlug ?? "",
    fizicaMapContext?.chapterSlug ?? "",
    fizicaMapContext?.fizicaLessonId ?? "",
    serializeSubjectMapCacheKey(subjectMapContext),
  )

  const staticResult =
    cachedStaticResult.status === "personalized" || cachedStaticResult.status === "not_found"
      ? await loadStaticLearningPathItemPayloadWithClient(
          await createClient(),
          chapterSlug,
          lessonSlug,
          itemIndex,
          fizicaMapContext?.routeSlug ?? "",
          fizicaMapContext?.chapterSlug ?? "",
          fizicaMapContext?.fizicaLessonId ?? "",
          subjectMapContext,
          { allowPersonalized: true },
        )
      : cachedStaticResult

  if (staticResult.status === "personalized") {
    return { status: "not_found" }
  }

  if (staticResult.status !== "ok") {
    return staticResult
  }

  const staticPayload = staticResult.payload
  const access = await getLearningPathAccess(staticPayload.chapter)
  if (access.mode === "locked") {
    return {
      status: "locked",
      chapter: staticPayload.chapter,
      lesson: staticPayload.lesson,
    }
  }

  const {
    completedItemIdsForLesson,
    initialCurrentItemCompleted,
    itemsRemainingForFreePreview,
    progressUser,
    guestProgressMap,
  } = await getProgressState(
    access,
    staticPayload.lesson.id,
    staticPayload.items,
    staticPayload.item.id,
  )

  if (
    isBlockedByFreePlan(
      access,
      staticPayload.items,
      staticPayload.item,
      completedItemIdsForLesson,
      initialCurrentItemCompleted,
      itemsRemainingForFreePreview,
    )
  ) {
    return { status: "blocked", lessonBaseHref: staticPayload.lessonBaseHref }
  }

  let completedItemIdsForFizicaAssignment: string[] | undefined
  const mapAssignmentItemIds =
    staticPayload.fizicaAssignmentItemIds ?? staticPayload.subjectMapAssignmentItemIds
  if (mapAssignmentItemIds?.length) {
    if (progressUser) {
      const supabaseForProgress = await createClient()
      completedItemIdsForFizicaAssignment = await getCompletedLearningPathItemIdsForUser(
        supabaseForProgress,
        progressUser.id,
        mapAssignmentItemIds,
      )
    } else if (access.mode === "free-preview") {
      const scopedIds = new Set(mapAssignmentItemIds)
      const completed = new Set<string>()
      for (const ids of Object.values(guestProgressMap)) {
        if (!Array.isArray(ids)) continue
        for (const id of ids) {
          if (typeof id === "string" && scopedIds.has(id)) completed.add(id)
        }
      }
      completedItemIdsForFizicaAssignment = Array.from(completed)
    } else {
      completedItemIdsForFizicaAssignment = []
    }
  }

  return {
    status: "ok",
    payload: {
      ...staticPayload,
      initialCurrentItemCompleted,
      completedItemIdsForLesson,
      completedItemIdsForFizicaAssignment,
      completedItemIdsForSubjectMapAssignment: completedItemIdsForFizicaAssignment,
    },
  }
}
