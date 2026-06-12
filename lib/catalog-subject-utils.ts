import {
  CATALOG_CLASS_OPTIONS,
  type FilterState,
  type SidebarClassProgress,
} from "@/components/problems/problems-catalog-sidebar"
import { normalizeCatalogValue, mapNumericClassToLabel } from "@/lib/catalog-class-labels"

export function buildProgressByClass<T>({
  problems,
  solvedIds,
  chapterOptions,
  getClassLabel,
  getChapter,
  getId,
}: {
  problems: T[]
  solvedIds: string[]
  chapterOptions: Record<string, string[]>
  getClassLabel: (problem: T) => string | null
  getChapter: (problem: T) => string | null
  getId: (problem: T) => string
}): Record<string, SidebarClassProgress> {
  const solvedSet = new Set(solvedIds)
  const result: Record<string, SidebarClassProgress> = {}
  const chapterLookup: Record<string, Record<string, string>> = {}

  CATALOG_CLASS_OPTIONS.forEach((cls) => {
    const chapters = chapterOptions[cls] ?? []
    const chapterProgress = Object.fromEntries(chapters.map((chapter) => [chapter, { total: 0, solved: 0 }]))
    result[cls] = {
      total: 0,
      solved: 0,
      chapters: chapterProgress,
    }
    chapterLookup[cls] = Object.fromEntries(chapters.map((chapter) => [normalizeCatalogValue(chapter), chapter]))
  })

  for (const problem of problems) {
    const classLabel = getClassLabel(problem)
    if (!classLabel || !result[classLabel]) continue

    const classProgress = result[classLabel]
    const solved = solvedSet.has(getId(problem))
    classProgress.total += 1
    if (solved) classProgress.solved += 1

    const chapter = getChapter(problem)
    if (!chapter) continue
    const chapterKey = chapterLookup[classLabel][normalizeCatalogValue(chapter)]
    if (chapterKey && classProgress.chapters[chapterKey]) {
      classProgress.chapters[chapterKey].total += 1
      if (solved) classProgress.chapters[chapterKey].solved += 1
    }
  }

  return result
}

export function filterSubjectCatalogProblems<T>({
  problems,
  filters,
  solvedIds,
  getClassLabel,
  getChapter,
  getId,
  getSearchText,
}: {
  problems: T[]
  filters: FilterState
  solvedIds: string[]
  getClassLabel: (problem: T) => string | null
  getChapter: (problem: T) => string | null
  getId: (problem: T) => string
  getSearchText: (problem: T) => string[]
}): T[] {
  const solvedSet = new Set(solvedIds)
  const hasSearch = Boolean(filters.search?.trim())

  return problems.filter((problem) => {
    if (hasSearch) {
      const searchLower = filters.search!.toLowerCase().trim()
      const haystack = getSearchText(problem)
      return haystack.some((part) => part.toLowerCase().includes(searchLower))
    }

    if (
      filters.class !== "Toate" &&
      normalizeCatalogValue(getClassLabel(problem)) !== normalizeCatalogValue(filters.class)
    ) {
      return false
    }

    if (
      filters.chapter !== "Toate" &&
      normalizeCatalogValue(getChapter(problem)) !== normalizeCatalogValue(filters.chapter)
    ) {
      return false
    }

    if (filters.difficulty !== "Toate" && (problem as { difficulty?: string }).difficulty !== filters.difficulty) {
      return false
    }

    if (filters.progress === "Rezolvate" && !solvedSet.has(getId(problem))) return false
    if (filters.progress === "Nerezolvate" && solvedSet.has(getId(problem))) return false

    return true
  })
}

export function mapNumericProblemClass(classNum: number | null | undefined) {
  return mapNumericClassToLabel(classNum)
}

export const DIFFICULTY_ORDER: Record<string, number> = {
  "Inițiere": 0,
  "Ușor": 1,
  "Mediu": 2,
  "Avansat": 3,
  "Concurs": 4,
}

export const PROBLEMS_PER_PAGE = 15

export function getCurrentMonthKey() {
  const now = new Date()
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0")
  return `${now.getUTCFullYear()}-${month}`
}

export function scoreProblemForMonth(problemId: string, monthKey: string) {
  const input = `${monthKey}:${problemId}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return (hash >>> 0) / 0xffffffff
}
