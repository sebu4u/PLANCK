export type LearningMistakeSurface =
  | "catalog_problem"
  | "learning_path_problem"
  | "learning_path_grila"
  | "learning_path_test"
  | "learning_path_interactive"

export interface LearningMistakeRecordInput {
  surface: LearningMistakeSurface
  itemId?: string | null
  lessonId?: string | null
  chapterId?: string | null
  problemId?: string | null
  quizQuestionId?: string | null
  itemType?: string | null
  subject?: string | null
  conceptTags?: string[]
  mistakeKind?: string
  submittedAnswer?: unknown
  correctAnswer?: unknown
  promptContext?: Record<string, unknown> | null
  attemptNumber?: number
  severity?: number
}

export interface LearningMistakeApiResponse {
  eventId?: string
  skipped?: boolean
  error?: string
}
