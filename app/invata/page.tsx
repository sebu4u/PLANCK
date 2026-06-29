import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { generateMetadata } from "@/lib/metadata"
import { learningPathsHubStructuredData } from "@/lib/structured-data"
import { StructuredData } from "@/components/structured-data"
import type { LearningPathHubChapter } from "@/lib/supabase-learning-paths"
import {
  getCachedPublicLearningPathHubCatalog,
  getCachedPublicLearningPathLessonItemCounts,
} from "@/lib/learning-path-hub-cache"
import { InvataChapterImageLoadProvider } from "@/components/invata/invata-chapter-image-load-context"
import { InvataHubNavProvider } from "@/components/invata/invata-hub-nav-context"
import { InvataHubTopGlow } from "@/components/invata/invata-hub-top-glow"
import { LearningPathsList } from "@/components/invata/learning-paths-list"
import { InvataSeoIntro } from "@/components/invata/invata-seo-intro"
import { InvataPersonalizedCourseEntry } from "@/components/invata/invata-personalized-course-entry"
import { InvataAdminLearningPathsLink } from "@/components/invata/invata-admin-learning-paths-link"
import {
  isFreePreviewLearningPathChapterSlug,
  splitLearningPathChaptersForFreePlanHub,
} from "@/lib/learning-path-free-plan"

export const metadata: Metadata = generateMetadata("learning-paths")
export const revalidate = 300

function sortLearningPathChaptersForHub(chapters: LearningPathHubChapter[]): LearningPathHubChapter[] {
  return [...chapters].sort((a, b) => {
    const aPersonalized = a.is_personalized === true
    const bPersonalized = b.is_personalized === true
    if (aPersonalized !== bPersonalized) return aPersonalized ? -1 : 1

    if (aPersonalized && bPersonalized) {
      return Date.parse(b.created_at) - Date.parse(a.created_at)
    }

    return a.order_index - b.order_index
  })
}

export default async function InvataPage() {
  const publicCatalog = await getCachedPublicLearningPathHubCatalog()
  const chapters = sortLearningPathChaptersForHub(publicCatalog.chapters)
  const lessonsByChapter = publicCatalog.lessonsByChapter

  const lockedChapterIds = chapters
    .filter((chapter) => !isFreePreviewLearningPathChapterSlug(chapter.slug))
    .map((chapter) => chapter.id)

  const { visibleChapters, archivedChapters } = splitLearningPathChaptersForFreePlanHub(chapters)

  const visiblePublicLessonIds = visibleChapters
    .flatMap((chapter) => (lessonsByChapter[chapter.id] ?? []).map((lesson) => lesson.id))

  const itemCountsByLessonId = await getCachedPublicLearningPathLessonItemCounts(visiblePublicLessonIds)

  const lessonProgressByLessonId: Record<string, { completed: number; total: number }> = {}
  for (const lessonId of visiblePublicLessonIds) {
    const total = itemCountsByLessonId[lessonId] ?? 0
    lessonProgressByLessonId[lessonId] = { completed: 0, total }
  }

  return (
    <InvataHubNavProvider chapters={visibleChapters}>
      <InvataChapterImageLoadProvider chapterCount={visibleChapters.length}>
        <StructuredData data={learningPathsHubStructuredData} id="learning-paths-hub" />
        <Navigation />
        {visibleChapters.length > 0 ? <InvataHubTopGlow /> : null}

        <main
          className={`relative min-h-screen max-sm:bg-transparent bg-[#ffffff] max-sm:pt-[calc(5.875rem+3rem)] pt-16 burger:pt-28 burger:pb-10 sm:pt-16 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
            <header className="mb-8 hidden flex-col gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Trasee de învățare
                </h1>
                <p className="mt-1.5 text-sm text-[#6d6d6d] sm:text-base">
                  Parcurge toată materia de la clasa a IX-a până la a XII-a, pas cu pas
                </p>
              </div>
              <div className="flex w-full max-w-[420px] flex-col items-start gap-3 sm:items-end">
                <InvataPersonalizedCourseEntry className="hidden w-full sm:block" />
                <InvataAdminLearningPathsLink />
              </div>
            </header>

            <InvataPersonalizedCourseEntry className="mb-6 sm:hidden" />

            <LearningPathsList
              chapters={visibleChapters}
              archivedChapters={archivedChapters}
              lessonsByChapter={lessonsByChapter}
              lockedChapterIds={lockedChapterIds}
              completedLessonIds={[]}
              lessonProgressByLessonId={lessonProgressByLessonId}
            />

            <InvataSeoIntro />
          </div>
        </main>
      </InvataChapterImageLoadProvider>
    </InvataHubNavProvider>
  )
}
