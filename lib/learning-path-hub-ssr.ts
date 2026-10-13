import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import {
  onboardingMaterieToInvataSubject,
  type InvataSubjectId,
} from "@/lib/invata-config"
import {
  getLearningPathHubLessonsByChapterIds,
  getUserPersonalizedLearningPathHubChapters,
  type LearningPathHubChapter,
  type LearningPathHubLesson,
} from "@/lib/supabase-learning-paths"

export { sortLearningPathChaptersForHub } from "@/lib/learning-path-hub-order"

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
