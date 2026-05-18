/** Coloane permise pentru API public / SSR (fără răspunsuri). */
export const MATH_PROBLEMS_PUBLIC_COLUMNS =
  "id, title, description, statement, tags, class, difficulty, image_url, youtube_url, created_at, updated_at"

export interface MathProblemAnswerSubpoint {
  label: string
  content: string
}

/** Rând complet (ex. dev / service role) */
export interface MathProblemRow extends MathProblemPublic {
  answer_subpoints: MathProblemAnswerSubpoint[]
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
