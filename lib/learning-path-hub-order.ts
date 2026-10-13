import {
  getInvataSubjectForChapter,
  type InvataSubjectId,
} from "@/lib/invata-config"
import type { LearningPathHubChapter } from "@/lib/supabase-learning-paths"

function preferredInvataSubjectRank(
  chapter: LearningPathHubChapter,
  preferredSubject: InvataSubjectId | null,
): number {
  if (!preferredSubject) return 0
  return getInvataSubjectForChapter(chapter) === preferredSubject ? 0 : 1
}

/**
 * Hub chapter order: started / in-progress paths first (most recent activity),
 * then the selected/preferred subject, then personalized chapters, then `order_index`.
 */
export function sortLearningPathChaptersForHub(
  chapters: LearningPathHubChapter[],
  preferredSubject: InvataSubjectId | null = null,
  startedLastActivityByChapterId: Record<string, number> = {},
): LearningPathHubChapter[] {
  return [...chapters].sort((a, b) => {
    const aStartedAt = startedLastActivityByChapterId[a.id] ?? 0
    const bStartedAt = startedLastActivityByChapterId[b.id] ?? 0
    const aStarted = aStartedAt > 0
    const bStarted = bStartedAt > 0
    if (aStarted !== bStarted) return aStarted ? -1 : 1
    if (aStarted && bStarted && aStartedAt !== bStartedAt) return bStartedAt - aStartedAt

    const subjectRank =
      preferredInvataSubjectRank(a, preferredSubject) -
      preferredInvataSubjectRank(b, preferredSubject)
    if (subjectRank !== 0) return subjectRank

    const aPersonalized = a.is_personalized === true
    const bPersonalized = b.is_personalized === true
    if (aPersonalized !== bPersonalized) return aPersonalized ? -1 : 1

    if (aPersonalized && bPersonalized) {
      return Date.parse(b.created_at) - Date.parse(a.created_at)
    }

    return a.order_index - b.order_index
  })
}
