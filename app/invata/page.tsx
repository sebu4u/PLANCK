import type { Metadata } from "next"
import Link from "next/link"
import { Layers } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { generateMetadata } from "@/lib/metadata"
import { learningPathsHubStructuredData } from "@/lib/structured-data"
import { StructuredData } from "@/components/structured-data"
import {
  getCompletedLearningPathLessonIdsForUser,
  getLearningPathChapters,
  getLearningPathLessonsByChapterId,
  getProblemsFromLearningPathChapterItems,
  getRandomProblemsByCategory,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"
import { createClient } from "@/lib/supabase/server"
import { LearningPathsList } from "@/components/invata/learning-paths-list"
import { InvataSeoIntro } from "@/components/invata/invata-seo-intro"
import { InvataAdminLearningPathsLink } from "@/components/invata/invata-admin-learning-paths-link"
import type { Problem } from "@/data/problems"
import { isFreePreviewLearningPathChapterSlug } from "@/lib/learning-path-free-plan"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import { BIOLOGIE_LEARNING_PATH_MARKER } from "@/lib/learning-path-biologie"
import { INFORMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-informatica"
import { MATEMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-matematica"

export const metadata: Metadata = generateMetadata("learning-paths")
export const revalidate = 21600

export default async function InvataPage() {
  const access = await getLearningPathAccess(null)
  const hasFullAccess = access.mode === "full"
  const chapters = await getLearningPathChapters()
  const lessonsByChapter: Record<string, LearningPathLesson[]> = {}
  const problemsByChapterId: Record<string, Problem[]> = {}

  await Promise.all(
    chapters.map(async (chapter) => {
      const lessons = await getLearningPathLessonsByChapterId(chapter.id)
      lessonsByChapter[chapter.id] = lessons

      const isFreeAccessibleChapter = isFreePreviewLearningPathChapterSlug(chapter.slug)
      const canShowRealItems = hasFullAccess || isFreeAccessibleChapter

      if (canShowRealItems) {
        const fromItems = await getProblemsFromLearningPathChapterItems(chapter.id, 3)
        if (fromItems.length) {
          problemsByChapterId[chapter.id] = fromItems
          return
        }
      }

      problemsByChapterId[chapter.id] =
        chapter.problem_category === INFORMATICA_LEARNING_PATH_MARKER ||
        chapter.problem_category === MATEMATICA_LEARNING_PATH_MARKER ||
        chapter.problem_category === BIOLOGIE_LEARNING_PATH_MARKER
          ? []
          : chapter.problem_category
            ? await getRandomProblemsByCategory(chapter.problem_category, 3)
            : []
    })
  )

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const allLessonIds = Object.values(lessonsByChapter).flatMap((lessons) => lessons.map((l) => l.id))
  const completedLessonIds = user
    ? await getCompletedLearningPathLessonIdsForUser(supabase, user.id, allLessonIds)
    : []

  const lockedChapterIds = hasFullAccess
    ? []
    : chapters
        .filter((chapter) => !isFreePreviewLearningPathChapterSlug(chapter.slug))
        .map((chapter) => chapter.id)

  return (
    <>
      <StructuredData data={learningPathsHubStructuredData} id="learning-paths-hub" />
      <Navigation />

      <main className={`min-h-screen bg-[#ffffff] pt-16 burger:pt-28 burger:pb-10 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}>
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

          <LearningPathsList
            chapters={chapters}
            lessonsByChapter={lessonsByChapter}
            problemsByChapterId={problemsByChapterId}
            lockedChapterIds={lockedChapterIds}
            completedLessonIds={completedLessonIds}
          />

          <InvataSeoIntro />
        </div>
      </main>
    </>
  )
}
