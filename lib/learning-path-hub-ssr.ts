import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import {
  compareOfficialHubChaptersByPreferredSubject,
  onboardingMaterieToInvataSubject,
  type InvataSubjectId,
} from "@/lib/invata-config"
import {
  getLearningPathHubLessonsByChapterIds,
  getUserPersonalizedLearningPathHubChapters,
  type LearningPathHubChapter,
  type LearningPathHubLesson,
} from "@/lib/supabase-learning-paths"

export interface SsrPersonalizedLearningPathHub {
  chapters: LearningPathHubChapter[]
  lessonsByChapter: Record<string, LearningPathHubLesson[]>
}

/**
 * Server-side fetch of the current user's personalized chapters and their lessons.
 * Returns an empty bundle for guests. Used to render personalized chapters in the same
 * SSR pass as the public catalog, instead of waiting for the client-side hub-session
 * fetch (which was causing personalized chapters to appear a moment after the premade
 * ones).
 */
export async function loadSsrPersonalizedLearningPathHub(
  supabase: SupabaseClient,
  user: User | null,
): Promise<SsrPersonalizedLearningPathHub> {
  if (!user) {
    return { chapters: [], lessonsByChapter: {} }
  }

  const chapters = await getUserPersonalizedLearningPathHubChapters(user.id, supabase)
  if (!chapters.length) {
    return { chapters: [], lessonsByChapter: {} }
  }

  const lessonsByChapter = await getLearningPathHubLessonsByChapterIds(
    chapters.map((chapter) => chapter.id),
    supabase,
  )

  return { chapters, lessonsByChapter }
}

export async function getInvataPreferredSubjectForUser(
  supabase: SupabaseClient,
  user: User | null,
): Promise<InvataSubjectId | null> {
  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("preferred_materie")
    .eq("user_id", user.id)
    .maybeSingle()

  return onboardingMaterieToInvataSubject(data?.preferred_materie)
}

/**
 * Hub chapter order: personalized chapters first (newest first by created_at), then
 * official chapters for the user's onboarding subject, then the rest by `order_index`.
 * Shared by the SSR pass and /api/invata/hub-session so both views agree.
 */
export function sortLearningPathChaptersForHub(
  chapters: LearningPathHubChapter[],
  preferredSubject: InvataSubjectId | null = null,
): LearningPathHubChapter[] {
  return [...chapters].sort((a, b) => {
    const aPersonalized = a.is_personalized === true
    const bPersonalized = b.is_personalized === true
    if (aPersonalized !== bPersonalized) return aPersonalized ? -1 : 1

    if (aPersonalized && bPersonalized) {
      return Date.parse(b.created_at) - Date.parse(a.created_at)
    }

    return compareOfficialHubChaptersByPreferredSubject(a, b, preferredSubject)
  })
}
