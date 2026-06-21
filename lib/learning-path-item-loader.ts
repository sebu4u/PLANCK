import type { Problem } from "@/data/problems"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import type { Lesson as PhysicsLesson } from "@/lib/supabase-physics"
import type { QuizQuestion } from "@/lib/types/quiz-questions"
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
}

export type LearningPathItemLoadResult =
  | { status: "not_found" }
  | { status: "invalid_index" }
  | { status: "locked"; chapter: LearningPathChapter; lesson: LearningPathLesson }
  | { status: "blocked"; lessonBaseHref: string }
  | { status: "ok"; payload: LearningPathItemPayload }

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
  const guestGlobalSolved =
    access.mode === "free-preview" && !progressUser
      ? countGuestCompletedLearningPathItems(guestProgressMap)
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

export async function loadLearningPathItemPayload(
  chapterSlug: string,
  lessonSlug: string,
  itemIndex: number,
  options?: { fizicaMapContext?: FizicaMapItemContext | null },
): Promise<LearningPathItemLoadResult> {
  if (!Number.isFinite(itemIndex) || itemIndex < 1) {
    return { status: "invalid_index" }
  }

  const requestClient = await createClient()
  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug, requestClient)
  if (!chapter || !lesson) {
    return { status: "not_found" }
  }

  const access = await getLearningPathAccess(chapter)
  if (access.mode === "locked") {
    return { status: "locked", chapter, lesson }
  }

  const items = await getLearningPathLessonItems(lesson.id, requestClient)
  const item = items[itemIndex - 1]
  if (!item) {
    return { status: "not_found" }
  }

  const lessonBaseHref = getLearningPathLessonHref(chapter, lesson)
  const { chapterSegment, lessonSegment } = getLearningPathRouteSegments(chapter, lesson)
  const {
    completedItemIdsForLesson,
    initialCurrentItemCompleted,
    itemsRemainingForFreePreview,
    progressUser,
    guestProgressMap,
  } = await getProgressState(access, lesson.id, items, item.id)

  if (
    isBlockedByFreePlan(
      access,
      items,
      item,
      completedItemIdsForLesson,
      initialCurrentItemCompleted,
      itemsRemainingForFreePreview
    )
  ) {
    return { status: "blocked", lessonBaseHref }
  }

  const { sourceLesson, sourceProblem, sourceCodingProblem, sourceCodingExamples, sourceQuizQuestion } =
    await loadItemContent(item)

  const uiFlags = computeItemUiFlags(item, sourceProblem, sourceCodingProblem)
  let nextItemHref =
    itemIndex < items.length ? `${lessonBaseHref}/${itemIndex + 1}` : lessonBaseHref
  let prevItemHref: string | null = itemIndex > 1 ? `${lessonBaseHref}/${itemIndex - 1}` : null
  let isLastItem = itemIndex >= items.length
  const fizicaMapContext = options?.fizicaMapContext ?? null
  let fizicaAssignmentItems: FizicaMapAssignmentItemRoute[] | undefined
  let fizicaAssignmentItemIds: string[] | undefined
  let completedItemIdsForFizicaAssignment: string[] | undefined
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

      if (fizicaAssignmentItemIds.length > 0) {
        if (progressUser) {
          const supabaseForProgress = await createClient()
          completedItemIdsForFizicaAssignment = await getCompletedLearningPathItemIdsForUser(
            supabaseForProgress,
            progressUser.id,
            fizicaAssignmentItemIds,
          )
        } else if (access.mode === "free-preview") {
          const scopedIds = new Set(fizicaAssignmentItemIds)
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
      completedItemIdsForFizicaAssignment,
      fizicaLessonTotalElo,
      initialCurrentItemCompleted,
      completedItemIdsForLesson,
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
