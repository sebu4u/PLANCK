export type MathClassFilterValue = "Toate" | 9 | 10 | 11 | 12

export type MathDifficultyFilterValue = "Toate" | "Ușor" | "Mediu" | "Avansat"

export interface MathProblemFiltersState {
  search: string
  class: MathClassFilterValue
  difficulty: MathDifficultyFilterValue
}

export interface MathProblemFacets {
  classes: Array<{ value: number; count: number }>
  difficulties: Array<{ value: string; count: number }>
}

export interface MathProblem {
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

export interface MathProblemsApiResponse {
  data: MathProblem[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  facets: MathProblemFacets | null
}
