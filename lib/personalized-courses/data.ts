import "server-only"

import type { Problem } from "@/data/problems"
import { MATH_PROBLEMS_SOLVE_COLUMNS } from "@/data/math-problems"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import type { QuizQuestion } from "@/lib/types/quiz-questions"
import { mathProblemRowToProblem } from "@/lib/math-problem-to-learning-path-problem"
import type {
  PersonalizedCourse,
  PersonalizedCourseItem,
  PersonalizedCourseItemLoadResult,
  PersonalizedCourseLesson,
  PersonalizedCourseLessonWithItems,
  PersonalizedCourseWithStructure,
  PersonalizedItemSourceContent,
  SupabaseAnyClient,
} from "@/lib/personalized-courses/types"

function asCourse(row: any): PersonalizedCourse {
  return {
    ...row,
    source_summary: Array.isArray(row?.source_summary) ? row.source_summary : [],
    generation_metadata:
      row?.generation_metadata && typeof row.generation_metadata === "object" && !Array.isArray(row.generation_metadata)
        ? row.generation_metadata
        : {},
  } as PersonalizedCourse
}

function asItem(row: any): PersonalizedCourseItem {
  return {
    ...row,
    content_json:
      row?.content_json && typeof row.content_json === "object" && !Array.isArray(row.content_json)
        ? row.content_json
        : {},
  } as PersonalizedCourseItem
}

export function getPersonalizedCourseHref(courseId: string): string {
  return `/invata/personalizat/${courseId}`
}

export function getPersonalizedCourseLessonHref(courseId: string, lessonId: string): string {
  return `/invata/personalizat/${courseId}/${lessonId}`
}

export function getPersonalizedCourseItemHref(courseId: string, lessonId: string, itemIndex: number): string {
  return `${getPersonalizedCourseLessonHref(courseId, lessonId)}/${itemIndex}`
}

export async function getPersonalizedCoursesForUser(
  supabase: SupabaseAnyClient,
  userId: string,
  limit = 6,
): Promise<PersonalizedCourse[]> {
  const { data, error } = await supabase
    .from("personalized_courses")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 20)))

  if (error) {
    console.error("personalized courses fetch:", error)
    return []
  }

  return (data ?? []).map(asCourse)
}

export async function getPersonalizedCourseWithStructure(
  supabase: SupabaseAnyClient,
  userId: string,
  courseId: string,
): Promise<PersonalizedCourseWithStructure | null> {
  const { data: courseRow, error: courseError } = await supabase
    .from("personalized_courses")
    .select("*")
    .eq("id", courseId)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .eq("status", "ready")
    .maybeSingle()

  if (courseError || !courseRow) {
    if (courseError) console.error("personalized course fetch:", courseError)
    return null
  }

  const { data: lessonRows, error: lessonError } = await supabase
    .from("personalized_course_lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  if (lessonError) {
    console.error("personalized course lessons fetch:", lessonError)
    return null
  }

  const lessons = (lessonRows ?? []) as PersonalizedCourseLesson[]
  const lessonIds = lessons.map((lesson) => lesson.id)

  const { data: itemRows, error: itemError } = lessonIds.length
    ? await supabase
        .from("personalized_course_items")
        .select("*")
        .in("lesson_id", lessonIds)
        .order("order_index", { ascending: true })
    : { data: [], error: null }

  if (itemError) {
    console.error("personalized course items fetch:", itemError)
    return null
  }

  const items = (itemRows ?? []).map(asItem)
  const itemIds = items.map((item) => item.id)
  const { data: progressRows, error: progressError } = itemIds.length
    ? await supabase
        .from("personalized_course_item_progress")
        .select("item_id")
        .eq("user_id", userId)
        .in("item_id", itemIds)
    : { data: [], error: null }

  if (progressError) {
    console.error("personalized course progress fetch:", progressError)
  }

  const itemsByLessonId = new Map<string, PersonalizedCourseItem[]>()
  for (const item of items) {
    const bucket = itemsByLessonId.get(item.lesson_id) ?? []
    bucket.push(item)
    itemsByLessonId.set(item.lesson_id, bucket)
  }

  const lessonsWithItems: PersonalizedCourseLessonWithItems[] = lessons.map((lesson) => ({
    ...lesson,
    items: itemsByLessonId.get(lesson.id) ?? [],
  }))

  return {
    ...asCourse(courseRow),
    lessons: lessonsWithItems,
    completedItemIds: (progressRows ?? []).map((row: any) => String(row.item_id)),
  }
}

async function loadQuizQuestion(
  supabase: SupabaseAnyClient,
  questionId: string | null | undefined,
): Promise<QuizQuestion | null> {
  if (!questionId?.trim()) return null
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("id", questionId.trim())
    .maybeSingle()
  if (error) return null
  return (data as QuizQuestion | null) ?? null
}

async function loadProblem(
  supabase: SupabaseAnyClient,
  problemId: string | null | undefined,
): Promise<Problem | null> {
  if (!problemId?.trim()) return null
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("id", problemId.trim())
    .maybeSingle()
  if (error) return null
  return (data as Problem | null) ?? null
}

async function loadMathProblem(
  supabase: SupabaseAnyClient,
  problemId: string | null | undefined,
): Promise<Problem | null> {
  if (!problemId?.trim()) return null
  const { data, error } = await supabase
    .from("math_problems")
    .select(MATH_PROBLEMS_SOLVE_COLUMNS)
    .eq("id", problemId.trim())
    .eq("is_active", true)
    .maybeSingle()
  if (error || !data) return null
  return mathProblemRowToProblem(data)
}

async function loadCodingProblem(
  supabase: SupabaseAnyClient,
  problemId: string | null | undefined,
): Promise<{ problem: CodingProblem | null; examples: CodingProblemExample[] }> {
  if (!problemId?.trim()) return { problem: null, examples: [] }
  const { data: codingRow, error } = await supabase
    .from("coding_problems")
    .select("*")
    .eq("id", problemId.trim())
    .eq("is_active", true)
    .maybeSingle()

  if (error || !codingRow) return { problem: null, examples: [] }

  const { data: examples } = await supabase
    .from("coding_problem_examples")
    .select("*")
    .eq("problem_id", codingRow.id)
    .order("order_index", { ascending: true })

  return {
    problem: {
      ...(codingRow as CodingProblem),
      tags: Array.isArray(codingRow.tags) ? codingRow.tags : [],
    },
    examples: (examples ?? []) as CodingProblemExample[],
  }
}

async function loadLearningPathItemSource(
  supabase: SupabaseAnyClient,
  itemId: string,
): Promise<PersonalizedItemSourceContent> {
  const { data: row } = await supabase
    .from("learning_path_lesson_items")
    .select("*")
    .eq("id", itemId)
    .eq("is_active", true)
    .maybeSingle()

  if (!row) {
    return {
      sourceProblem: null,
      sourceCodingProblem: null,
      sourceCodingExamples: [],
      sourceQuizQuestion: null,
      sourceLearningPathItem: null,
    }
  }

  const rowType = String(row.item_type ?? "")
  const problemId = typeof row.problem_id === "string" ? row.problem_id : null
  const quizQuestionId = typeof row.quiz_question_id === "string" ? row.quiz_question_id : null
  const sourceProblem =
    rowType === "problem"
      ? await loadProblem(supabase, problemId)
      : rowType === "math_problem"
        ? await loadMathProblem(supabase, problemId)
        : null
  const coding = rowType === "coding_problem" ? await loadCodingProblem(supabase, problemId) : { problem: null, examples: [] }
  const sourceQuizQuestion = rowType === "grila" ? await loadQuizQuestion(supabase, quizQuestionId) : null

  return {
    sourceProblem,
    sourceCodingProblem: coding.problem,
    sourceCodingExamples: coding.examples,
    sourceQuizQuestion,
    sourceLearningPathItem: row,
  }
}

export async function loadPersonalizedItemSourceContent(
  supabase: SupabaseAnyClient,
  item: PersonalizedCourseItem,
): Promise<PersonalizedItemSourceContent> {
  if (item.source_type === "learning_path_item" && item.source_id) {
    return loadLearningPathItemSource(supabase, item.source_id)
  }

  if (item.source_type === "lesson" && item.source_id) {
    // Load official learning_path_lessons row and its items
    const sourceTable = item.source_table ?? "learning_path_lessons"
    if (sourceTable === "learning_path_lessons") {
      const { data: lessonRow } = await supabase
        .from("learning_path_lessons")
        .select("*")
        .eq("id", item.source_id)
        .eq("is_active", true)
        .maybeSingle()

      if (lessonRow) {
        // Load the lesson's items to expose any embedded problem/quiz/video
        const { data: lessonItems } = await supabase
          .from("learning_path_lesson_items")
          .select("*")
          .eq("lesson_id", lessonRow.id)
          .eq("is_active", true)
          .order("order_index", { ascending: true })

        const firstItem = (lessonItems ?? [])[0]
        if (firstItem) {
          // Delegate to the learning_path_item loader for the first item
          const itemSource = await loadLearningPathItemSource(supabase, String(firstItem.id))
          return {
            ...itemSource,
            sourceLearningPathItem: {
              ...firstItem,
              lesson_title: lessonRow.title,
              lesson_description: lessonRow.description,
            } as Record<string, unknown>,
          }
        }

        // No items — use lesson-level content
        return {
          sourceProblem: null,
          sourceCodingProblem: null,
          sourceCodingExamples: [],
          sourceQuizQuestion: null,
          sourceLearningPathItem: {
            ...lessonRow,
            content: lessonRow.description ?? "",
          } as Record<string, unknown>,
        }
      }
    } else if (sourceTable === "learning_path_chapters") {
      // Chapter-level: load chapter description as text
      const { data: chapterRow } = await supabase
        .from("learning_path_chapters")
        .select("*")
        .eq("id", item.source_id)
        .eq("is_active", true)
        .maybeSingle()

      if (chapterRow) {
        return {
          sourceProblem: null,
          sourceCodingProblem: null,
          sourceCodingExamples: [],
          sourceQuizQuestion: null,
          sourceLearningPathItem: {
            ...chapterRow,
            content: chapterRow.description ?? "",
          } as Record<string, unknown>,
        }
      }
    }
    return {
      sourceProblem: null,
      sourceCodingProblem: null,
      sourceCodingExamples: [],
      sourceQuizQuestion: null,
      sourceLearningPathItem: null,
    }
  }

  if (item.source_type === "problem") {
    return {
      sourceProblem: await loadProblem(supabase, item.source_id),
      sourceCodingProblem: null,
      sourceCodingExamples: [],
      sourceQuizQuestion: null,
      sourceLearningPathItem: null,
    }
  }

  if (item.source_type === "math_problem") {
    return {
      sourceProblem: await loadMathProblem(supabase, item.source_id),
      sourceCodingProblem: null,
      sourceCodingExamples: [],
      sourceQuizQuestion: null,
      sourceLearningPathItem: null,
    }
  }

  if (item.source_type === "coding_problem") {
    const coding = await loadCodingProblem(supabase, item.source_id)
    return {
      sourceProblem: null,
      sourceCodingProblem: coding.problem,
      sourceCodingExamples: coding.examples,
      sourceQuizQuestion: null,
      sourceLearningPathItem: null,
    }
  }

  if (item.source_type === "quiz_question") {
    return {
      sourceProblem: null,
      sourceCodingProblem: null,
      sourceCodingExamples: [],
      sourceQuizQuestion: await loadQuizQuestion(supabase, item.source_id),
      sourceLearningPathItem: null,
    }
  }

  return {
    sourceProblem: null,
    sourceCodingProblem: null,
    sourceCodingExamples: [],
    sourceQuizQuestion: null,
    sourceLearningPathItem: null,
  }
}

export async function loadPersonalizedCourseItemPayload(
  supabase: SupabaseAnyClient,
  userId: string,
  courseId: string,
  lessonId: string,
  itemIndex: number,
): Promise<PersonalizedCourseItemLoadResult> {
  if (!Number.isFinite(itemIndex) || itemIndex < 1) return { status: "not_found" }

  const course = await getPersonalizedCourseWithStructure(supabase, userId, courseId)
  if (!course) return { status: "not_found" }

  const lesson = course.lessons.find((entry) => entry.id === lessonId)
  if (!lesson) return { status: "not_found" }

  const item = lesson.items[itemIndex - 1]
  if (!item) return { status: "not_found" }

  const completedItemIdsForLesson = lesson.items
    .map((lessonItem) => lessonItem.id)
    .filter((id) => course.completedItemIds.includes(id))
  const sourceContent = await loadPersonalizedItemSourceContent(supabase, item)
  const lessonBaseHref = getPersonalizedCourseLessonHref(course.id, lesson.id)

  return {
    status: "ok",
    payload: {
      course,
      lesson,
      item,
      items: lesson.items,
      itemIndex,
      lessonBaseHref,
      nextItemHref: itemIndex < lesson.items.length ? getPersonalizedCourseItemHref(course.id, lesson.id, itemIndex + 1) : lessonBaseHref,
      prevItemHref: itemIndex > 1 ? getPersonalizedCourseItemHref(course.id, lesson.id, itemIndex - 1) : null,
      completedItemIdsForLesson,
      initialCurrentItemCompleted: completedItemIdsForLesson.includes(item.id),
      isLastItem: itemIndex >= lesson.items.length,
      ...sourceContent,
    },
  }
}
