import { isAdminFromDB } from "@/lib/admin-check"
import {
  FREE_LEARNING_PATH_CHAPTER_SLUG,
  FREE_PLAN_LEARNING_PATH_ITEM_LIMIT,
} from "@/lib/learning-path-free-plan"
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
}

interface ChapterLike {
  slug: string | null
}

/**
 * Determina nivelul de acces al userului curent pentru un capitol learning-path.
 *
 * - `full`: admini, planuri platite (plus/premium), useri cu `plus_months_remaining > 0`.
 * - `free-preview`: useri free, doar pentru capitolul cinematica; pot vedea graful si pot
 *   intra secvential pe primele 10 itemi rezolvate global.
 * - `locked`: orice alt scenariu (afiseaza preview-ul placeholder).
 */
export async function getLearningPathAccess(chapter?: ChapterLike | null): Promise<LearningPathAccess> {
  const supabase = await createClient()

  if (await isAdminFromDB(supabase)) {
    return { mode: "full", itemsSolved: 0, itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT, userId: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { mode: "locked", itemsSolved: 0, itemsRemaining: 0, userId: null }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plus_months_remaining")
    .eq("user_id", user.id)
    .maybeSingle()

  const appMetadata = (user.app_metadata as Record<string, unknown>) ?? {}
  const candidates: unknown[] = [profile?.plan]

  PLAN_PROPERTY_PRIORITY.forEach((prop) => {
    candidates.push(appMetadata[prop])
  })

  const resolvedPlan = resolvePlanFromCandidates(candidates)
  const plusMonthsRemaining = Number(profile?.plus_months_remaining ?? 0)

  if (isPaidPlan(resolvedPlan) || plusMonthsRemaining > 0) {
    return { mode: "full", itemsSolved: 0, itemsRemaining: FREE_PLAN_LEARNING_PATH_ITEM_LIMIT, userId: user.id }
  }

  const isFreeChapter = (chapter?.slug ?? null) === FREE_LEARNING_PATH_CHAPTER_SLUG
  if (!isFreeChapter) {
    return { mode: "locked", itemsSolved: 0, itemsRemaining: 0, userId: user.id }
  }

  const { count } = await supabase
    .from("user_learning_path_item_progress")
    .select("item_id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const itemsSolved = Number(count ?? 0)
  const itemsRemaining = Math.max(0, FREE_PLAN_LEARNING_PATH_ITEM_LIMIT - itemsSolved)

  return { mode: "free-preview", itemsSolved, itemsRemaining, userId: user.id }
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
