import { CATALOG_CLASS_OPTIONS } from "@/lib/catalog-class-labels"
import { CLASS_LABEL_TO_NUM } from "@/lib/catalog-class-labels"
import { INFORMATICA_CATALOG_CHAPTER_OPTIONS } from "@/lib/informatica-catalog-chapters"

export const INFORMATICA_CLASS_CARD_COPY: Record<(typeof CATALOG_CLASS_OPTIONS)[number], { title: string; subtitle: string }> = {
  "a 9-a": { title: "Clasa a IX-a", subtitle: "Algoritmi elementari, vectori și matrice în Python" },
  "a 10-a": { title: "Clasa a X-a", subtitle: "Structuri de date și algoritmi avansați" },
  "a 11-a": { title: "Clasa a XI-a", subtitle: "Grafuri, programare dinamică și backtracking" },
  "a 12-a": { title: "Clasa a XII-a", subtitle: "Pregătire pentru BAC și olimpiadă" },
}

export const INFORMATICA_CATALOG_CHAPTER_OPTIONS_BY_LABEL: Record<(typeof CATALOG_CLASS_OPTIONS)[number], string[]> = {
  "a 9-a": INFORMATICA_CATALOG_CHAPTER_OPTIONS[9] ?? [],
  "a 10-a": INFORMATICA_CATALOG_CHAPTER_OPTIONS[10] ?? [],
  "a 11-a": INFORMATICA_CATALOG_CHAPTER_OPTIONS[11] ?? [],
  "a 12-a": INFORMATICA_CATALOG_CHAPTER_OPTIONS[12] ?? [],
}

export function mergeInformaticaChaptersForClassLabel(classLabel: string, fromDb: string[] = []): string[] {
  const classNum = CLASS_LABEL_TO_NUM[classLabel as (typeof CATALOG_CLASS_OPTIONS)[number]]
  if (!classNum) return [...fromDb].sort((a, b) => a.localeCompare(b, "ro"))

  const predefined = INFORMATICA_CATALOG_CHAPTER_OPTIONS[classNum as 9 | 10 | 11 | 12] ?? []
  if (predefined.length === 0) {
    return [...fromDb].sort((a, b) => a.localeCompare(b, "ro"))
  }

  const predefinedSet = new Set(predefined)
  const extras = fromDb.filter((chapter) => !predefinedSet.has(chapter)).sort((a, b) => a.localeCompare(b, "ro"))
  return [...predefined, ...extras]
}

export function mergeInformaticaChaptersByClassLabel(fromDb: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const cls of CATALOG_CLASS_OPTIONS) {
    result[cls] = mergeInformaticaChaptersForClassLabel(cls, fromDb[cls] ?? fromDb[String(CLASS_LABEL_TO_NUM[cls])] ?? [])
  }

  return result
}
