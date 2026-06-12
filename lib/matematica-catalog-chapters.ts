import { CATALOG_CLASS_OPTIONS } from "@/lib/catalog-class-labels"
import { CLASS_LABEL_TO_NUM } from "@/lib/catalog-class-labels"

/** Capitole oficiale catalog matematică — sursă unică pentru UI și validare dev. */
export const MATEMATICA_CATALOG_CHAPTER_OPTIONS: Record<(typeof CATALOG_CLASS_OPTIONS)[number], string[]> = {
  "a 9-a": [],
  "a 10-a": [],
  "a 11-a": [],
  "a 12-a": [],
}

const matematicaChapterSet = new Set<string>()
for (const cls of CATALOG_CLASS_OPTIONS) {
  for (const chapter of MATEMATICA_CATALOG_CHAPTER_OPTIONS[cls]) {
    matematicaChapterSet.add(chapter)
  }
}

export function isMatematicaCatalogChapter(chapter: string): boolean {
  return matematicaChapterSet.has(chapter.trim())
}

export function isMatematicaCatalogChapterForClass(chapter: string, classLabel: string): boolean {
  const options = MATEMATICA_CATALOG_CHAPTER_OPTIONS[classLabel as (typeof CATALOG_CLASS_OPTIONS)[number]]
  if (!options?.length) return false
  return options.includes(chapter.trim())
}

export function mergeMatematicaChaptersForClass(classLabel: string, fromDb: string[] = []): string[] {
  const predefined = MATEMATICA_CATALOG_CHAPTER_OPTIONS[classLabel as (typeof CATALOG_CLASS_OPTIONS)[number]] ?? []
  if (predefined.length === 0) {
    return [...fromDb].sort((a, b) => a.localeCompare(b, "ro"))
  }

  const predefinedSet = new Set(predefined)
  const extras = fromDb.filter((chapter) => !predefinedSet.has(chapter)).sort((a, b) => a.localeCompare(b, "ro"))
  return [...predefined, ...extras]
}

export function mergeMatematicaChaptersByClass(fromDb: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const cls of CATALOG_CLASS_OPTIONS) {
    result[cls] = mergeMatematicaChaptersForClass(cls, fromDb[cls] ?? fromDb[String(CLASS_LABEL_TO_NUM[cls])] ?? [])
  }

  for (const [key, chapters] of Object.entries(fromDb)) {
    const classNum = Number.parseInt(key, 10)
    const classLabel =
      CATALOG_CLASS_OPTIONS.includes(key as (typeof CATALOG_CLASS_OPTIONS)[number])
        ? key
        : [9, 10, 11, 12].includes(classNum)
          ? (`a ${classNum}-a` as (typeof CATALOG_CLASS_OPTIONS)[number])
          : null
    if (classLabel && !result[classLabel]) {
      result[classLabel] = mergeMatematicaChaptersForClass(classLabel, chapters)
    }
  }

  return result
}
