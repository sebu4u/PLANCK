/** Capitole accesibile în preview gratuit (plan free + vizitator neautentificat). */
export const FREE_PREVIEW_LEARNING_PATH_CHAPTER_SLUGS = [
  "cinematica",
  "cinematica-punctului-material",
  "dinamica",
  "optica-geometrica",
  "termodinamica",
  "circuite-electrice",
  "introducere-matematica",
  "introducere-python",
] as const

export const FREE_LEARNING_PATH_CHAPTER_SLUG = "cinematica"
export const FREE_PLAN_LEARNING_PATH_ITEM_LIMIT = 10
/** Trasee personalizate generate de un user free (cont obligatoriu). */
export const FREE_PLAN_PERSONALIZED_LEARNING_PATH_LIMIT = 1
/** Numărul de trasee afișate complet pe /invata pentru planul free; restul apar în arhivă. */
export const FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT = 7
/** Numărul de trasee oficiale afișate pe /invata pentru Plus/Premium; restul apar în arhivă. */
export const PAID_PLAN_VISIBLE_LEARNING_PATH_COUNT = 12

/** Aliasuri pentru slug-ul principal de cinematică (redirect / onboarding). */
export const FREE_PREVIEW_CHAPTER_SLUG_ALIASES = ["cinematica-punctului-material"] as const

export function isFreePreviewLearningPathChapterSlug(slug: string | null): boolean {
  if (!slug) return false
  const normalized = slug.toLowerCase()
  return (FREE_PREVIEW_LEARNING_PATH_CHAPTER_SLUGS as readonly string[]).some(
    (freeSlug) => freeSlug.toLowerCase() === normalized
  )
}

export interface FreePlanHubChapterSplitInput {
  is_personalized?: boolean | null
  order_index: number
}

/** Primele N trasee oficiale (order_index) + cursurile personalizate; restul în arhivă. */
export function splitLearningPathChaptersForHub<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
  visibleStandardCount: number,
): { visibleChapters: T[]; archivedChapters: T[] } {
  const personalized = chapters.filter((chapter) => chapter.is_personalized === true)
  const standard = chapters
    .filter((chapter) => chapter.is_personalized !== true)
    .sort((a, b) => a.order_index - b.order_index)

  const visibleStandard = standard.slice(0, visibleStandardCount)
  const archivedStandard = standard.slice(visibleStandardCount)

  return {
    visibleChapters: [...personalized, ...visibleStandard],
    archivedChapters: archivedStandard,
  }
}

/** Plan free: primele 7 trasee oficiale + cursurile personalizate; restul în arhivă. */
export function splitLearningPathChaptersForFreePlanHub<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
): { visibleChapters: T[]; archivedChapters: T[] } {
  return splitLearningPathChaptersForHub(chapters, FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT)
}

export function resolveLearningPathHubChapterSplit<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
  options: { isAdmin: boolean; isDev: boolean; hasFullAccess: boolean },
): { visibleChapters: T[]; archivedChapters: T[] } {
  if (options.isAdmin || options.isDev) {
    return { visibleChapters: chapters, archivedChapters: [] }
  }

  const visibleStandardCount = options.hasFullAccess
    ? PAID_PLAN_VISIBLE_LEARNING_PATH_COUNT
    : FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT

  return splitLearningPathChaptersForHub(chapters, visibleStandardCount)
}
