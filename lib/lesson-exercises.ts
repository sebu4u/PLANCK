import type { CursuriSubjectId } from "@/lib/cursuri-subjects"
import { difficultyLabels } from "@/lib/types/quiz-questions"

export const LESSON_EXERCISE_CONTENT_TYPES = [
  "problem",
  "math_problem",
  "coding_problem",
  "grila",
] as const

export type LessonExerciseContentType = (typeof LESSON_EXERCISE_CONTENT_TYPES)[number]

export type LessonExerciseStatementFormat = "latex" | "markdown"

export type LessonExerciseKindLabel = "Problemă" | "Grilă"

export interface LessonExerciseAnswer {
  key: string
  text: string
}

export interface LessonExercisePublic {
  id: string
  contentType: LessonExerciseContentType
  contentId: string
  title: string
  statement: string
  statementFormat: LessonExerciseStatementFormat
  imageUrl?: string | null
  difficulty?: string | null
  href: string
  kindLabel: LessonExerciseKindLabel
  answers?: LessonExerciseAnswer[]
}

export interface LessonExerciseAdminItem {
  id: string
  content_type: LessonExerciseContentType
  content_id: string
  order_index: number
  title: string
  difficulty?: string | null
}

export interface LessonExerciseCatalogOption {
  type: LessonExerciseContentType
  label: string
  language?: "cpp" | "python"
  materie?: "fizica" | "biologie"
}

export function isLessonExerciseContentType(
  value: string,
): value is LessonExerciseContentType {
  return (LESSON_EXERCISE_CONTENT_TYPES as readonly string[]).includes(value)
}

export function getLessonExerciseKindLabel(
  type: LessonExerciseContentType,
): LessonExerciseKindLabel {
  return type === "grila" ? "Grilă" : "Problemă"
}

export function getLessonExerciseHref(opts: {
  contentType: LessonExerciseContentType
  contentId: string
  slug?: string | null
  materie?: string | null
}): string | null {
  switch (opts.contentType) {
    case "problem":
      return `/probleme/${encodeURIComponent(opts.contentId)}`
    case "math_problem":
      return `/matematica/probleme/${encodeURIComponent(opts.contentId)}`
    case "coding_problem":
      return opts.slug ? `/informatica/probleme/${encodeURIComponent(opts.slug)}` : null
    case "grila":
      return opts.materie === "biologie"
        ? `/biologie/grile?question=${encodeURIComponent(opts.contentId)}`
        : `/grile?question=${encodeURIComponent(opts.contentId)}`
  }
}

export function getLessonExerciseCatalogsForSubject(
  subject: CursuriSubjectId,
): LessonExerciseCatalogOption[] {
  switch (subject) {
    case "fizica":
      return [
        { type: "problem", label: "Problemă" },
        { type: "grila", label: "Grilă", materie: "fizica" },
      ]
    case "mate":
      return [
        { type: "math_problem", label: "Problemă" },
        { type: "grila", label: "Grilă", materie: "fizica" },
      ]
    case "info-cpp":
      return [{ type: "coding_problem", label: "Problemă", language: "cpp" }]
    case "info-py":
      return [{ type: "coding_problem", label: "Problemă", language: "python" }]
    case "biologie":
      return [{ type: "grila", label: "Grilă", materie: "biologie" }]
    case "chimie":
      return []
  }
}

export function formatLessonExerciseDifficulty(
  type: LessonExerciseContentType,
  raw: unknown,
): string | null {
  if (type === "grila") {
    const numeric = typeof raw === "number" ? raw : Number(raw)
    if (numeric === 1 || numeric === 2 || numeric === 3) {
      return difficultyLabels[numeric]
    }
    return null
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim()
  return null
}
