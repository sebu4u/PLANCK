export interface CodingProblem {
  id: string;
  numeric_id?: number;
  slug: string;
  title: string;
  statement_markdown: string;
  requirement_markdown?: string | null;
  input_format?: string | null;
  output_format?: string | null;
  constraints_markdown?: string | null;
  difficulty: "Ușor" | "Mediu" | "Avansat" | "Concurs" | string;
  class: number;
  chapter: string;
  points: number;
  time_limit_ms: number;
  memory_limit_kb: number;
  tags: string[];
  sample_input?: string | null;
  sample_output?: string | null;
  explanation_markdown?: string | null;
  boilerplate_cpp?: string | null;
  created_at: string;
  updated_at?: string;
  isFreeMonthly?: boolean;
  canAccess?: boolean;
}

export interface CodingProblemExample {
  id: string;
  problem_id: string;
  sample_input: string | null;
  sample_output: string | null;
  explanation: string | null;
  order_index: number;
  created_at: string;
}

export interface CodingProblemFacets {
  classes: Array<{ value: number; count: number }>;
  difficulties: Array<{ value: string; count: number }>;
  chaptersByClass: Record<string, string[]>;
}

export interface CodingProblemsApiResponse {
  data: CodingProblem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  facets: CodingProblemFacets | null;
}

export type ClassFilterValue = "Toate" | 9 | 10 | 11 | 12;
export type DifficultyFilterValue =
  | "Toate"
  | "Ușor"
  | "Mediu"
  | "Avansat"
  | "Concurs";

export interface CodingProblemFiltersState {
  search: string;
  class: ClassFilterValue;
  difficulty: DifficultyFilterValue;
  chapter: string | "Toate";
}

