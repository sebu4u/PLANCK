import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ChapterPageClient } from "@/components/invata/chapter-page-client"
import {
  getLearningPathChapterBySlug,
  getLearningPathLessonsByChapterId,
} from "@/lib/supabase-learning-paths"

export const revalidate = 21600

export default async function InvataChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const chapter = await getLearningPathChapterBySlug(slug)

  if (!chapter) {
    notFound()
  }

  const lessons = await getLearningPathLessonsByChapterId(chapter.id)

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-[#ffffff] pb-10 pt-28">
        <ChapterPageClient chapter={chapter} lessons={lessons} />
      </main>
    </>
  )
}
