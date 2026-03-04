import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { generateMetadata } from "@/lib/metadata"
import {
  getLearningPathChapters,
  getLearningPathLessonsByChapterId,
  getRandomProblemsByCategory,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"
import { LearningPathsList } from "@/components/invata/learning-paths-list"
import type { Problem } from "@/data/problems"

export const metadata: Metadata = generateMetadata("learning-paths")
export const revalidate = 21600

export default async function InvataPage() {
  const chapters = await getLearningPathChapters()
  const lessonsByChapter: Record<string, LearningPathLesson[]> = {}
  const problemsByChapterId: Record<string, Problem[]> = {}

  await Promise.all(
    chapters.map(async (chapter) => {
      const [lessons, chapterProblems] = await Promise.all([
        getLearningPathLessonsByChapterId(chapter.id),
        chapter.problem_category
          ? getRandomProblemsByCategory(chapter.problem_category, 3)
          : Promise.resolve([]),
      ])

      lessonsByChapter[chapter.id] = lessons
      problemsByChapterId[chapter.id] = chapterProblems
    })
  )

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-[#ffffff] pb-10 pt-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">Learning Paths</h1>
            <p className="mt-1.5 text-sm text-[#6d6d6d] sm:text-base">Step-by-step paths to mastery</p>
          </header>

          <LearningPathsList
            chapters={chapters}
            lessonsByChapter={lessonsByChapter}
            problemsByChapterId={problemsByChapterId}
          />
        </div>
      </main>
    </>
  )
}
