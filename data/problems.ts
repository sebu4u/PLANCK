export interface Problem {
  id: string
  title: string
  description: string
  statement: string
  difficulty: string
  category: string
  tags: string
  youtube_url: string
  created_at: string
  class?: number
  classString?: string
  isFree?: boolean
  image_url?: string
  isFreeMonthly?: boolean
  canAccess?: boolean
  answer_type?: "value" | "grila" | null
  value_subpoints?: ProblemValueSubpoint[] | null
  grila_options?: string[] | null
  grila_correct_index?: number | null
  solve_percentage?: number | null
}

export interface ProblemValueSubpoint {
  label: string
  text_before: string
  text_after: string
  correct_value: number
}

// Problemele se preiau acum din Supabase, nu din acest fișier.
