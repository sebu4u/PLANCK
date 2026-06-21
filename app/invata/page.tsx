import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { Layers } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { generateMetadata } from "@/lib/metadata"
import { learningPathsHubStructuredData } from "@/lib/structured-data"
import { StructuredData } from "@/components/structured-data"
import {
  getCompletedLearningPathItemIdsForUser,
  getCompletedLearningPathLessonIdsForUser,
  getLearningPathChapters,
  getLearningPathLessonItemAggregates,
  getLearningPathLessonsByChapterId,
  getInProgressPersonalizedChapters,
  type LearningPathChapter,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  getGuestCompletedItemIdsForLesson,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"
import { createClient } from "@/lib/supabase/server"
import { InvataChapterImageLoadProvider } from "@/components/invata/invata-chapter-image-load-context"
import { InvataHubNavProvider } from "@/components/invata/invata-hub-nav-context"
import { InvataHubTopGlow } from "@/components/invata/invata-hub-top-glow"
import { LearningPathsList } from "@/components/invata/learning-paths-list"
import { InvataSeoIntro } from "@/components/invata/invata-seo-intro"
import { PersonalizedCourseGenerator } from "@/components/invata/personalized-course-generator"
import { PersonalizedCourseGenerationProvider } from "@/components/invata/personalized-course-generation-context"
import { InvataAdminLearningPathsLink } from "@/components/invata/invata-admin-learning-paths-link"
import { isFreePreviewLearningPathChapterSlug, FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT } from "@/lib/learning-path-free-plan"
import { getLearningPathAccess } from "@/lib/learning-path-access"

export const metadata: Metadata = generateMetadata("learning-paths")
export const revalidate = 21600

function sortLearningPathChaptersForHub(chapters: LearningPathChapter[]): LearningPathChapter[] {
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
  const access = await getLearningPathAccess(null)
  const hasFullAccess = access.mode === "full"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const chapters = sortLearningPathChaptersForHub(await getLearningPathChapters(supabase))

  // Merge in personalized chapters that are still generating (is_active=false, status creating/failed).
  // These appear at the top of the list with a progress card.
  if (user) {
    const inProgress = await getInProgressPersonalizedChapters(user.id, supabase)
    if (inProgress.length > 0) {
      chapters.unshift(...inProgress)
    }
  }
  const lessonsByChapter: Record<string, LearningPathLesson[]> = {}

  await Promise.all(
    chapters.map(async (chapter) => {
      lessonsByChapter[chapter.id] = await getLearningPathLessonsByChapterId(chapter.id, supabase)
    })
  )
  const allLessonIds = Object.values(lessonsByChapter).flatMap((lessons) => lessons.map((l) => l.id))

  const completedLessonIds = user
    ? await getCompletedLearningPathLessonIdsForUser(supabase, user.id, allLessonIds)
    : []

  const { counts: itemCountsByLessonId, itemIdsByLessonId } =
    await getLearningPathLessonItemAggregates(allLessonIds, supabase)
  const allItemIds = Object.values(itemIdsByLessonId).flat()

  let completedItemIdSet = new Set<string>()
  if (user && allItemIds.length > 0) {
    const completedItemIds = await getCompletedLearningPathItemIdsForUser(
      supabase,
      user.id,
      allItemIds
    )
    completedItemIdSet = new Set(completedItemIds)
  } else if (!user) {
    const cookieStore = await cookies()
    const guestMap = parseGuestLearningPathProgress(
      cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value
    )
    for (const lessonId of allLessonIds) {
      for (const itemId of getGuestCompletedItemIdsForLesson(guestMap, lessonId)) {
        completedItemIdSet.add(itemId)
      }
    }
  }

  const completedLessonIdSet = new Set(completedLessonIds)
  const lessonProgressByLessonId: Record<string, { completed: number; total: number }> = {}
  for (const lessonId of allLessonIds) {
    const total = itemCountsByLessonId[lessonId] ?? 0
    if (total === 0) {
      lessonProgressByLessonId[lessonId] = {
        completed: completedLessonIdSet.has(lessonId) ? 1 : 0,
        total: 0,
      }
      continue
    }
    const lessonItemIds = itemIdsByLessonId[lessonId] ?? []
    const completed = lessonItemIds.filter((id) => completedItemIdSet.has(id)).length
    lessonProgressByLessonId[lessonId] = { completed, total }
  }

  const lockedChapterIds = hasFullAccess
    ? []
    : chapters
        .filter((chapter) => !isFreePreviewLearningPathChapterSlug(chapter.slug))
        .map((chapter) => chapter.id)

  const visibleChapters = hasFullAccess
    ? chapters
    : chapters.slice(0, FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT)
  const archivedChapters = hasFullAccess
    ? []
    : chapters.slice(FREE_PLAN_VISIBLE_LEARNING_PATH_COUNT)

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
              <div className="flex flex-col items-start gap-3 sm:items-end">
                {user ? (
                  <Link
                    href="/invata/flashcard-uri"
                    className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                  >
                    <Layers className="h-4 w-4" />
                    Flashcard-urile mele
                  </Link>
                ) : null}
                <InvataAdminLearningPathsLink />
              </div>
            </header>

            <PersonalizedCourseGenerationProvider>
              <div className="mb-10 sm:mb-12">
                <PersonalizedCourseGenerator isAuthenticated={Boolean(user)} />
              </div>

              <LearningPathsList
                chapters={visibleChapters}
                archivedChapters={archivedChapters}
                lessonsByChapter={lessonsByChapter}
                lockedChapterIds={lockedChapterIds}
                completedLessonIds={completedLessonIds}
                lessonProgressByLessonId={lessonProgressByLessonId}
              />
            </PersonalizedCourseGenerationProvider>

            <InvataSeoIntro />
          </div>
        </main>
      </InvataChapterImageLoadProvider>
    </InvataHubNavProvider>
  )
}
