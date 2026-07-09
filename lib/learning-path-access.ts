import type { SupabaseClient, User } from "@supabase/supabase-js"
import { isAdmin } from "@/lib/admin-check"
import {
  FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
  FREE_PLAN_UNLOCKED_LEARNING_PATH_COUNT,
} from "@/lib/learning-path-free-plan"
import { getCachedOnboardingCustomLessonIds } from "@/lib/learning-path-hub-cache"
import { ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG } from "@/lib/onboarding-custom-lesson"
import { createClient } from "@/lib/supabase/server"
import {
  PLAN_PROPERTY_PRIORITY,
  isPaidPlan,
  resolvePlanFromCandidates,
} from "@/lib/subscription-plan"

export type LearningPathAccessMode = "full" | "free-preview" | "locked"

export interface LearningPathAccess {
  mode: LearningPathAccessMode
  itemsSolved: number
  itemsRemaining: number
  userId: string | null
  isAdmin: boolean
  isDev: boolean
}

interface ChapterLike {
  slug: string | null
  generated_by_user_id?: string | null
  is_personalized?: boolean | null
  order_index?: number | null
}

/**
 * Un traseu oficial (nu personalizat) e considerat "free preview" doar dacă se
 * numără printre primele `FREE_PLAN_UNLOCKED_LEARNING_PATH_COUNT` trasee după
 * order_index — aceleași trasee care apar deblocate (nu grayed out) pe /invata.
 */
async function isFreePlanUnlockedChapter(
  supabase: SupabaseClient,
  chapter: ChapterLike | null | undefined,
): Promise<boolean> {
  if (!chapter || chapter.is_personalized === true) return false
  if (chapter.order_index === null || chapter.order_index === undefined) return false

  const { count, error } = await supabase
    .from("learning_path_chapters")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("is_personalized", "is", true)
    .lt("order_index", chapter.order_index)

  if (error) return false

  return (count ?? 0) < FREE_PLAN_UNLOCKED_LEARNING_PATH_COUNT
}

/**
 * Determina nivelul de acces al userului curent pentru un capitol learning-path.
 *
 * - `full`: admini, dev (`profiles.is_dev`), planuri platite (plus/premium), useri cu `plus_months_remaining > 0`.
 * - `free-preview`: utilizatori fără cont sau cu plan free, doar pentru primele
 *   `FREE_PLAN_UNLOCKED_LEARNING_PATH_COUNT` trasee oficiale (după order_index); pot
 *   parcurge secvențial până la limita globală de itemi.
 * - `locked`: orice alt scenariu (afiseaza preview-ul placeholder).
 */
export async function getLearningPathAccess(chapter?: ChapterLike | null): Promise<LearningPathAccess> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return getLearningPathAccessForUser(supabase, user, chapter)
}

export async function getLearningPathAccessForUser(
  supabase: SupabaseClient,
  user: User | null,
  chapter?: ChapterLike | null,
): Promise<LearningPathAccess> {
  // Hidden onboarding chapter (see `ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG`): always fully
  // unlocked, for guests and account holders alike, and never subject to the free-plan
  // 10-item quota — it must never show the free-plan paywall mid-lesson.
  if (chapter?.slug === ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG) {
    return {
      mode: "full",
      itemsSolved: 0,
      itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
      userId: user?.id ?? null,
      isAdmin: false,
      isDev: false,
    }
  }

  if (!user) {
    if (await isFreePlanUnlockedChapter(supabase, chapter)) {
      return {
        mode: "free-preview",
        itemsSolved: 0,
        itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
        userId: null,
        isAdmin: false,
        isDev: false,
      }
    }
    return {
      mode: "locked",
      itemsSolved: 0,
      itemsRemaining: 0,
      userId: null,
      isAdmin: false,
      isDev: false,
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_dev, plan, plus_months_remaining")
    .eq("user_id", user.id)
    .maybeSingle()

  const userIsAdmin = profile?.is_admin === true || isAdmin(user)
  const userIsDev = profile?.is_dev === true

  if (userIsAdmin) {
    return {
      mode: "full",
      itemsSolved: 0,
      itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
      userId: user.id,
      isAdmin: true,
      isDev: userIsDev,
    }
  }

  if (userIsDev) {
    return {
      mode: "full",
      itemsSolved: 0,
      itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
      userId: user.id,
      isAdmin: false,
      isDev: true,
    }
  }

  if (chapter?.is_personalized === true && chapter.generated_by_user_id === user.id) {
    return {
      mode: "full",
      itemsSolved: 0,
      itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
      userId: user.id,
      isAdmin: false,
      isDev: false,
    }
  }

  const appMetadata = (user.app_metadata as Record<string, unknown>) ?? {}
  const candidates: unknown[] = [profile?.plan]

  PLAN_PROPERTY_PRIORITY.forEach((prop) => {
    candidates.push(appMetadata[prop])
  })

  const resolvedPlan = resolvePlanFromCandidates(candidates)
  const plusMonthsRemaining = Number(profile?.plus_months_remaining ?? 0)

  if (isPaidPlan(resolvedPlan) || plusMonthsRemaining > 0) {
    return {
      mode: "full",
      itemsSolved: 0,
      itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
      userId: user.id,
      isAdmin: false,
      isDev: false,
    }
  }

  const isFreeChapter = await isFreePlanUnlockedChapter(supabase, chapter)
  if (!isFreeChapter) {
    return {
      mode: "locked",
      itemsSolved: 0,
      itemsRemaining: 0,
      userId: user.id,
      isAdmin: false,
      isDev: false,
    }
  }

  // Onboarding-lesson item completions must never eat into the free-plan quota available
  // for the rest of the catalog (that chapter is always "full" access, see above).
  const onboardingLessonIds = await getCachedOnboardingCustomLessonIds()
  let progressCountQuery = supabase
    .from("user_learning_path_item_progress")
    .select("item_id, learning_path_lesson_items!inner(lesson_id)", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (onboardingLessonIds.length > 0) {
    progressCountQuery = progressCountQuery.not(
      "learning_path_lesson_items.lesson_id",
      "in",
      `(${onboardingLessonIds.join(",")})`
    )
  }

  const { count } = await progressCountQuery

  const itemsSolved = Number(count ?? 0)
  const itemsRemaining = Math.max(0, FREE_PLAN_LEARNING_PATH_ITEM_LIMIT - itemsSolved)

  return {
    mode: "free-preview",
    itemsSolved,
    itemsRemaining,
    userId: user.id,
    isAdmin: false,
    isDev: false,
  }
}

/**
 * Adminii și utilizatorii cu plan Plus/Premium văd itemii reali din
 * `learning_path_lesson_items` și preview-ul complet; ceilalți văd itemi placeholder.
 *
 * Wrapper backwards-compatible peste `getLearningPathAccess`.
 */
export async function canViewLearningPathContent(): Promise<boolean> {
  const access = await getLearningPathAccess(null)
  return access.mode === "full"
}
