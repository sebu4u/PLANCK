export type ProblemDetailSubject = "physics" | "math"

export const PROBLEM_DETAIL_SUBJECT_CONFIG = {
  physics: {
    catalogBackHref: "/probleme",
    catalogHrefPrefix: "/probleme",
    problemHrefPrefix: "/probleme",
    problemsTable: "problems" as const,
    defaultCategoryIcon: "📘",
  },
  math: {
    catalogBackHref: "/matematica/probleme",
    catalogHrefPrefix: "/matematica/probleme",
    problemHrefPrefix: "/matematica/probleme",
    problemsTable: "math_problems" as const,
    defaultCategoryIcon: "🧮",
  },
} as const

export function getProblemDetailSubjectConfig(subject: ProblemDetailSubject = "physics") {
  return PROBLEM_DETAIL_SUBJECT_CONFIG[subject]
}
