export const FREE_LEARNING_PATH_CHAPTER_SLUG = "cinematica"
export const FREE_PLAN_LEARNING_PATH_ITEM_LIMIT = 10

export const FREE_PREVIEW_CHAPTER_SLUG_ALIASES = ["cinematica-punctului-material"] as const

/** Capitolul cu preview gratuit (plan free + vizitator neautentificat). */
export function isFreePreviewLearningPathChapterSlug(slug: string | null): boolean {
  if (!slug) return false
  if (slug === FREE_LEARNING_PATH_CHAPTER_SLUG) return true
  return (FREE_PREVIEW_CHAPTER_SLUG_ALIASES as readonly string[]).includes(slug)
}
