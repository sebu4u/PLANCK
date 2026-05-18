import type { ProblemValueSubpoint } from "@/data/problems"

/** Coloane permise pentru API public / SSR (fără răspunsuri). */
export const MATH_PROBLEMS_PUBLIC_COLUMNS =
  "id, title, description, statement, tags, class, difficulty, image_url, youtube_url, created_at, updated_at"

/** Coloane pentru rezolvare în learning path (include răspunsul, doar server-side). */
export const MATH_PROBLEMS_SOLVE_COLUMNS =
  `${MATH_PROBLEMS_PUBLIC_COLUMNS}, answer_type, value_subpoints`

/** Rând complet (ex. dev / service role) */
export interface MathProblemRow extends MathProblemPublic {
  answer_type: "value" | null
  value_subpoints: ProblemValueSubpoint[] | null
}

/** Varianta expusă în catalog public (fără răspunsuri) */
export interface MathProblemPublic {
  id: string
  title: string
  description: string
  statement: string
  tags: string[]
  class: number
  difficulty: string
  image_url: string | null
  youtube_url: string | null
  created_at: string
  updated_at: string
}
