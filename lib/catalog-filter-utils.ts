import type { Problem } from "@/data/problems"
import {
  CATALOG_CHAPTER_OPTIONS,
  CATALOG_CLASS_OPTIONS,
  type FilterState,
  type SidebarClassProgress,
} from "@/components/problems/problems-catalog-sidebar"

export const CLASS_MAP: Record<number, string> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a",
}

export function normalizeValue(value?: string | null) {
  return (value ?? "").trim().toLowerCase()
}

export function mapProblemClassLabel(problem: Pick<Problem, "class" | "classString">): string | null {
  const normalizedClassString = normalizeValue(problem.classString)
  if (normalizedClassString) {
    const match = CATALOG_CLASS_OPTIONS.find((opt) => normalizeValue(opt) === normalizedClassString)
    if (match) return match
  }
  if (typeof problem.class === "number") return CLASS_MAP[problem.class] ?? null
  return null
}

/** Mirrors filtering logic from `ProblemsCatalogClient`. */
export function filterCatalogProblems(
  problems: Problem[],
  filters: FilterState,
  solvedProblems: string[],
): Problem[] {
  const solvedSet = new Set(solvedProblems)
  const hasSearch = Boolean(filters.search?.trim())

  return problems.filter((problem) => {
    if (hasSearch) {
      const searchLower = filters.search!.toLowerCase().trim()
      const matchesSearch =
        problem.title.toLowerCase().includes(searchLower) ||
        problem.statement.toLowerCase().includes(searchLower) ||
        problem.id.toLowerCase().includes(searchLower) ||
        (problem.tags &&
          (Array.isArray(problem.tags)
            ? (problem.tags as string[]).some((tag) => tag.toLowerCase().includes(searchLower))
            : String(problem.tags).toLowerCase().includes(searchLower)))
      if (!matchesSearch) return false
      return true
    }

    if (
      filters.class !== "Toate" &&
      normalizeValue(mapProblemClassLabel(problem)) !== normalizeValue(filters.class)
    ) {
      return false
    }

    if (filters.chapter !== "Toate" && normalizeValue(problem.category) !== normalizeValue(filters.chapter)) {
      return false
    }

    if (filters.difficulty !== "Toate" && problem.difficulty !== filters.difficulty) {
      return false
    }

    if (filters.progress === "Rezolvate" && !solvedSet.has(problem.id)) return false
    if (filters.progress === "Nerezolvate" && solvedSet.has(problem.id)) return false

    return true
  })
}

export function buildProgressByClassForProblems(
  problems: Problem[],
  solvedProblems: string[],
): Record<string, SidebarClassProgress> {
  const solvedSet = new Set(solvedProblems)
  const result: Record<string, SidebarClassProgress> = {}
  const chapterLookup: Record<string, Record<string, string>> = {}

  CATALOG_CLASS_OPTIONS.forEach((cls) => {
    const chapterProgress = Object.fromEntries(
      CATALOG_CHAPTER_OPTIONS[cls].map((chapter) => [chapter, { total: 0, solved: 0 }]),
    )
    result[cls] = {
      total: 0,
      solved: 0,
      chapters: chapterProgress,
    }

    chapterLookup[cls] = Object.fromEntries(
      CATALOG_CHAPTER_OPTIONS[cls].map((chapter) => [normalizeValue(chapter), chapter]),
    )
  })

  for (const problem of problems) {
    const classLabel = mapProblemClassLabel(problem)
    if (!classLabel || !result[classLabel]) continue

    const classProgress = result[classLabel]
    const solved = solvedSet.has(problem.id)
    classProgress.total += 1
    if (solved) classProgress.solved += 1

    const chapterKey = chapterLookup[classLabel][normalizeValue(problem.category)]
    if (chapterKey && classProgress.chapters[chapterKey]) {
      classProgress.chapters[chapterKey].total += 1
      if (solved) classProgress.chapters[chapterKey].solved += 1
    }
  }

  return result
}
