import type { SupabaseClient } from "@supabase/supabase-js"
import {
  compareOfficialHubChaptersByPreferredSubject,
  type InvataSubjectId,
} from "@/lib/invata-config"
import { ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG } from "@/lib/onboarding-custom-lesson"

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
  slug?: string | null
  title?: string | null
  materie?: string | null
  problem_category?: string | null
}

function sortOfficialHubChaptersForDisplay<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
  preferredSubject: InvataSubjectId | null,
): T[] {
  return [...chapters].sort((a, b) =>
    compareOfficialHubChaptersByPreferredSubject(a, b, preferredSubject),
  )
}

/** Primele N trasee oficiale (materia de onboarding, apoi order_index) + cursurile personalizate; restul în arhivă. */
export function splitLearningPathChaptersForHub<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
  visibleStandardCount: number,
  preferredSubject: InvataSubjectId | null = null,
): { visibleChapters: T[]; archivedChapters: T[] } {
  const personalized = chapters.filter((chapter) => chapter.is_personalized === true)
  const standard = sortOfficialHubChaptersForDisplay(
    chapters.filter((chapter) => chapter.is_personalized !== true),
    preferredSubject,
  )

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
  preferredSubject: InvataSubjectId | null = null,
): { visibleChapters: T[]; archivedChapters: T[] } {
  return splitLearningPathChaptersForHub(
    chapters,
    FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT,
    preferredSubject,
  )
}

/**
 * Free și Plus/Premium văd exact aceleași trasee pe /invata (doar cele mai vechi/în
 * exces, după materia de onboarding, intră în arhivă). Planul free poate începe orice
 * traseu oficial; diferența e cota globală de itemi, nu blocarea traseelor.
 */
export function resolveLearningPathHubChapterSplit<T extends FreePlanHubChapterSplitInput>(
  chapters: T[],
  options: {
    isAdmin: boolean
    isDev: boolean
    hasFullAccess: boolean
    preferredSubject?: InvataSubjectId | null
  },
): { visibleChapters: T[]; archivedChapters: T[] } {
  if (options.isAdmin || options.isDev) {
    return { visibleChapters: chapters, archivedChapters: [] }
  }

  return splitLearningPathChaptersForHub(
    chapters,
    PAID_PLAN_VISIBLE_LEARNING_PATH_COUNT,
    options.preferredSubject ?? null,
  )
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
