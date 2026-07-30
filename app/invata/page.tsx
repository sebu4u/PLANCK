import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { generateMetadata } from "@/lib/metadata"
import { learningPathsHubStructuredData } from "@/lib/structured-data"
import { StructuredData } from "@/components/structured-data"
import { getLearningPathLessonItemCountsByLessonIds } from "@/lib/supabase-learning-paths"
import {
  getCachedPublicLearningPathHubCatalog,
  getCachedPublicLearningPathLessonItemCounts,
} from "@/lib/learning-path-hub-cache"
import { loadSsrPersonalizedLearningPathHub, sortLearningPathChaptersForHub } from "@/lib/learning-path-hub-ssr"
import { createClient } from "@/lib/supabase/server"
import { InvataChapterImageLoadProvider } from "@/components/invata/invata-chapter-image-load-context"
import { InvataHubNavProvider } from "@/components/invata/invata-hub-nav-context"
import { InvataPremiumUpgradeBanner } from "@/components/invata/invata-premium-upgrade-banner"
import { InvataHubPageClient } from "@/components/invata/invata-hub-page-client"
import {
  getFreePlanLockedChapterIds,
  resolveLearningPathHubChapterSplit,
} from "@/lib/learning-path-free-plan"
import { getLearningPathAccessForUser } from "@/lib/learning-path-access"

export const metadata: Metadata = generateMetadata("learning-paths")
// The page renders user-specific personalized chapters when authenticated, so it cannot
// be statically cached. The public catalog + item counts are still cached via
// unstable_cache inside learning-path-hub-cache.ts.
export const dynamic = "force-dynamic"

export default async function InvataPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicCatalog = await getCachedPublicLearningPathHubCatalog()
  // Personalized chapters for the signed-in user are loaded in the same SSR pass so
  // they render together with the premade chapters, instead of popping in later.
  const personalizedHub = await loadSsrPersonalizedLearningPathHub(supabase, user)

  const allChapters = sortLearningPathChaptersForHub([
    ...personalizedHub.chapters,
    ...publicCatalog.chapters,
  ])
  const allLessonsByChapter = {
    ...publicCatalog.lessonsByChapter,
    ...personalizedHub.lessonsByChapter,
  }

  const access = await getLearningPathAccessForUser(supabase, user, null)
  const hasFullAccess = access.mode === "full"

  const lockedChapterIds = hasFullAccess ? [] : getFreePlanLockedChapterIds(allChapters)

  const { visibleChapters, archivedChapters } = resolveLearningPathHubChapterSplit(allChapters, {
    isAdmin: access.isAdmin,
    isDev: access.isDev,
    hasFullAccess,
  })

  const visiblePublicLessonIds = visibleChapters
    .filter((chapter) => chapter.is_personalized !== true)
    .flatMap((chapter) => (allLessonsByChapter[chapter.id] ?? []).map((lesson) => lesson.id))
  const visiblePersonalizedLessonIds = visibleChapters
    .filter((chapter) => chapter.is_personalized === true)
    .flatMap((chapter) => (allLessonsByChapter[chapter.id] ?? []).map((lesson) => lesson.id))

  const publicItemCounts = await getCachedPublicLearningPathLessonItemCounts(visiblePublicLessonIds)
  const personalizedItemCounts =
    visiblePersonalizedLessonIds.length > 0
      ? await getLearningPathLessonItemCountsByLessonIds(
          visiblePersonalizedLessonIds,
          supabase,
        )
      : {}
  const itemCountsByLessonId = { ...publicItemCounts, ...personalizedItemCounts }

  const lessonProgressByLessonId: Record<string, { completed: number; total: number }> = {}
  for (const lessonId of [...visiblePublicLessonIds, ...visiblePersonalizedLessonIds]) {
    const total = itemCountsByLessonId[lessonId] ?? 0
    lessonProgressByLessonId[lessonId] = { completed: 0, total }
  }

  return (
    <InvataHubNavProvider chapters={visibleChapters}>
      <InvataChapterImageLoadProvider chapterCount={visibleChapters.length}>
        <StructuredData data={learningPathsHubStructuredData} id="learning-paths-hub" />
        <div className="max-sm:bg-[#DCE6FA]">
          <Navigation />

          <InvataHubPageClient
            chapters={visibleChapters}
            archivedChapters={archivedChapters}
            lessonsByChapter={allLessonsByChapter}
            lockedChapterIds={lockedChapterIds}
            lessonProgressByLessonId={lessonProgressByLessonId}
          />

          <InvataPremiumUpgradeBanner />
        </div>
      </InvataChapterImageLoadProvider>
    </InvataHubNavProvider>
  )
}
