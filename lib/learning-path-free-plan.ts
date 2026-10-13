import type { SupabaseClient } from "@supabase/supabase-js"
import { ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG } from "@/lib/onboarding-custom-lesson"
import { learningPathHasArchiveTag } from "@/lib/learning-path-tags"

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
  "onboarding-personalizat",
] as const

export const FREE_LEARNING_PATH_CHAPTER_SLUG = "cinematica"
export const FREE_PLAN_LEARNING_PATH_ITEM_LIMIT = 10
/** Trasee personalizate generate de un user free (cont obligatoriu). */
export const FREE_PLAN_PERSONALIZED_LEARNING_PATH_LIMIT = 1

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
  slug?: string | null
  title?: string | null
  materie?: string | null
  problem_category?: string | null
  tags?: string[] | null
}

/**
 * Traseele cu tag-ul rezervat `arhiva` apar în arhivă pe /invata; restul rămân în listă.
 */
export function resolveLearningPathHubChapterSplit<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
): { visibleChapters: T[]; archivedChapters: T[] } {
  const visibleChapters: T[] = []
  const archivedChapters: T[] = []

  for (const chapter of chapters) {
    if (learningPathHasArchiveTag(chapter.tags)) {
      archivedChapters.push(chapter)
    } else {
      visibleChapters.push(chapter)
    }
  }

  return { visibleChapters, archivedChapters }
}

/**
 * Client-safe (no `unstable_cache`) counterpart of the onboarding-lesson-id lookup in
 * `lib/learning-path-hub-cache.ts`, for UI that needs the free-plan quota outside of a
 * server/RSC context (e.g. the free-plan mobile dashboard).
 */
async function getOnboardingCustomLessonIdsForClient(client: SupabaseClient): Promise<string[]> {
  const { data: chapter } = await client
    .from("learning_path_chapters")
    .select("id")
    .eq("slug", ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG)
    .maybeSingle()

  if (!chapter) return []

  const { data: lessons, error } = await client
    .from("learning_path_lessons")
    .select("id")
    .eq("chapter_id", chapter.id)

  if (error) {
    console.error("Error fetching onboarding custom lesson ids:", error)
    return []
  }

  return (lessons || []).map((lesson) => lesson.id)
}

/**
 * Remaining items out of the free-plan's global `FREE_PLAN_LEARNING_PATH_ITEM_LIMIT` quota
 * for `userId`, excluding onboarding-lesson completions (always-unlocked chapter, see
 * `lib/learning-path-access.ts`). Safe to call from client components.
 */
export async function getFreePlanItemsRemainingForUser(
  client: SupabaseClient,
  userId: string,
): Promise<number> {
  const onboardingLessonIds = await getOnboardingCustomLessonIdsForClient(client)

  let progressCountQuery = client
    .from("user_learning_path_item_progress")
    .select("item_id, learning_path_lesson_items!inner(lesson_id)", { count: "exact", head: true })
    .eq("user_id", userId)

  if (onboardingLessonIds.length > 0) {
    progressCountQuery = progressCountQuery.not(
      "learning_path_lesson_items.lesson_id",
      "in",
      `(${onboardingLessonIds.join(",")})`,
    )
  }

  const { count } = await progressCountQuery
  const itemsSolved = Number(count ?? 0)
  return Math.max(0, FREE_PLAN_LEARNING_PATH_ITEM_LIMIT - itemsSolved)
}
