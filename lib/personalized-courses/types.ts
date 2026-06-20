import type { SupabaseClient } from "@supabase/supabase-js"
import type { Problem } from "@/data/problems"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import type { QuizQuestion } from "@/lib/types/quiz-questions"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

export type PersonalizedCourseStatus = "creating" | "ready" | "failed"

export type PersonalizedCourseSourceType =
  | "generated"
  | "learning_path_item"
  | "problem"
  | "quiz_question"
  | "math_problem"
  | "coding_problem"
  | "lesson"

export interface PersonalizedCourse {
  id: string
  user_id: string
  original_prompt: string
  title: string
  description: string | null
  status: PersonalizedCourseStatus
  source_summary: Record<string, unknown>[]
  generation_metadata: Record<string, unknown>
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface PersonalizedCourseLesson {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface PersonalizedCourseItem {
  id: string
  lesson_id: string
  course_id: string
  item_type: LearningPathLessonType
  title: string | null
  source_type: PersonalizedCourseSourceType
  source_id: string | null
  source_table: string | null
  source_title: string | null
  content_json: Record<string, unknown>
  order_index: number
  created_at: string
  updated_at: string
}

export interface PersonalizedCourseItemProgress {
  id: string
  user_id: string
  item_id: string
  completed_at: string
}

export interface PersonalizedCourseLessonWithItems extends PersonalizedCourseLesson {
  items: PersonalizedCourseItem[]
}

export interface PersonalizedCourseWithStructure extends PersonalizedCourse {
  lessons: PersonalizedCourseLessonWithItems[]
  completedItemIds: string[]
}

export interface PersonalizedCourseCatalogCandidate {
  key: string
  source_type: Exclude<PersonalizedCourseSourceType, "generated">
  source_id: string
  source_table: string
  item_type: LearningPathLessonType
  title: string
  summary: string
  url?: string | null
  metadata?: Record<string, unknown>
}

export interface PersonalizedCourseGeneratedPlanItem {
  title: string
  item_type: LearningPathLessonType
  source_key?: string | null
  content_json?: Record<string, unknown> | null
}

export interface PersonalizedCourseGeneratedPlanLesson {
  title: string
  description?: string | null
  items: PersonalizedCourseGeneratedPlanItem[]
}

export interface PersonalizedCourseGeneratedPlan {
  title: string
  description: string
  lessons: PersonalizedCourseGeneratedPlanLesson[]
}

export interface PersonalizedItemSourceContent {
  sourceProblem: Problem | null
  sourceCodingProblem: CodingProblem | null
  sourceCodingExamples: CodingProblemExample[]
  sourceQuizQuestion: QuizQuestion | null
  sourceLearningPathItem: Record<string, unknown> | null
}

export interface PersonalizedCourseItemPayload extends PersonalizedItemSourceContent {
  course: PersonalizedCourse
  lesson: PersonalizedCourseLesson
  item: PersonalizedCourseItem
  items: PersonalizedCourseItem[]
  itemIndex: number
  lessonBaseHref: string
  nextItemHref: string
  prevItemHref: string | null
  completedItemIdsForLesson: string[]
  initialCurrentItemCompleted: boolean
  isLastItem: boolean
}

export type PersonalizedCourseItemLoadResult =
  | { status: "ok"; payload: PersonalizedCourseItemPayload }
  | { status: "not_found" }
  | { status: "unauthorized" }

export type SupabaseAnyClient = SupabaseClient<any, any, any>
