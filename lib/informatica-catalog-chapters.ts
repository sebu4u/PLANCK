/** Capitole oficiale catalog informatică — sursă unică pentru UI și validare dev. */
export const INFORMATICA_CLASS_VALUES = [9, 10, 11, 12] as const
export type InformaticaClassValue = (typeof INFORMATICA_CLASS_VALUES)[number]

export const INFORMATICA_CATALOG_CHAPTER_OPTIONS: Record<InformaticaClassValue, string[]> = {
  9: [],
  10: [],
  11: [],
  12: [],
}

const informaticaChapterSet = new Set<string>()
for (const cls of INFORMATICA_CLASS_VALUES) {
  for (const chapter of INFORMATICA_CATALOG_CHAPTER_OPTIONS[cls]) {
    informaticaChapterSet.add(chapter)
  }
}

export function isInformaticaCatalogChapter(chapter: string): boolean {
  return informaticaChapterSet.has(chapter.trim())
}

export function isInformaticaCatalogChapterForClass(chapter: string, classNum: number): boolean {
  const options = INFORMATICA_CATALOG_CHAPTER_OPTIONS[classNum as InformaticaClassValue]
  if (!options?.length) return false
  return options.includes(chapter.trim())
}

/** Capitole pentru filtre: ordinea oficială + orice valori din DB care nu sunt în listă. */
export function mergeInformaticaChaptersForClass(classNum: number, fromDb: string[] = []): string[] {
  const predefined = INFORMATICA_CATALOG_CHAPTER_OPTIONS[classNum as InformaticaClassValue] ?? []
  if (predefined.length === 0) {
    return [...fromDb].sort((a, b) => a.localeCompare(b, "ro"))
  }

  const predefinedSet = new Set(predefined)
  const extras = fromDb.filter((chapter) => !predefinedSet.has(chapter)).sort((a, b) => a.localeCompare(b, "ro"))
  return [...predefined, ...extras]
}

export function mergeInformaticaChaptersByClass(
  fromDb: Record<string, string[]>
): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const cls of INFORMATICA_CLASS_VALUES) {
    const key = String(cls)
    result[key] = mergeInformaticaChaptersForClass(cls, fromDb[key] ?? [])
  }

  for (const [key, chapters] of Object.entries(fromDb)) {
    const classNum = Number.parseInt(key, 10)
    if (!INFORMATICA_CLASS_VALUES.includes(classNum as InformaticaClassValue)) {
      result[key] = [...chapters].sort((a, b) => a.localeCompare(b, "ro"))
    }
  }

  return result
}
