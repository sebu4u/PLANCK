import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { generateMetadata } from "@/lib/metadata"
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
import { InvataAdminLearningPathsLink } from "@/components/invata/invata-admin-learning-paths-link"
import type { Problem } from "@/data/problems"
import { isFreePreviewLearningPathChapterSlug } from "@/lib/learning-path-free-plan"
import { getLearningPathAccess } from "@/lib/learning-path-access"

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
        chapter.problem_category
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
      <Navigation />

      <main className="min-h-screen bg-[#ffffff] pb-10 pt-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">Learning Paths</h1>
              <p className="mt-1.5 text-sm text-[#6d6d6d] sm:text-base">Step-by-step paths to mastery</p>
            </div>
            <InvataAdminLearningPathsLink />
          </header>

          <LearningPathsList
            chapters={chapters}
            lessonsByChapter={lessonsByChapter}
            problemsByChapterId={problemsByChapterId}
            lockedChapterIds={lockedChapterIds}
            completedLessonIds={completedLessonIds}
          />
        </div>
      </main>
    </>
  )
}
