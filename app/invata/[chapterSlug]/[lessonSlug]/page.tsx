import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { LearningPathLessonPage } from "@/components/invata/learning-path-lesson-page"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import {
  getLearningPathChapterById,
  getLearningPathChapterBySlug,
  getLearningPathLessonById,
  getLearningPathLessonBySlug,
  getLearningPathLessonItems,
  isUuid,
} from "@/lib/supabase-learning-paths"

export const revalidate = 21600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string }>
}): Promise<Metadata> {
  const { chapterSlug, lessonSlug } = await params
  const chapter = isUuid(chapterSlug)
    ? await getLearningPathChapterById(chapterSlug)
    : await getLearningPathChapterBySlug(chapterSlug)
  const lesson = isUuid(lessonSlug)
    ? await getLearningPathLessonById(lessonSlug)
    : await getLearningPathLessonBySlug(chapterSlug, lessonSlug)

  if (!chapter || !lesson || lesson.chapter_id !== chapter.id) {
    return generatePageMetadata("learning-paths")
  }

  return {
    title: `${lesson.title} | ${chapter.title} | PLANCK`,
    description: lesson.description || chapter.description || `Lecție din capitolul ${chapter.title} pe PLANCK.`,
    alternates: {
      canonical: `/invata/${chapterSlug}/${lessonSlug}`,
    },
  }
}

export default async function InvataLessonDetailPage({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string }>
}) {
  const { chapterSlug, lessonSlug } = await params

  const chapter = isUuid(chapterSlug)
    ? await getLearningPathChapterById(chapterSlug)
    : await getLearningPathChapterBySlug(chapterSlug)

  if (!chapter) {
    notFound()
  }

  const lesson = isUuid(lessonSlug)
    ? await getLearningPathLessonById(lessonSlug)
    : await getLearningPathLessonBySlug(chapterSlug, lessonSlug)

  if (!lesson || lesson.chapter_id !== chapter.id) {
    notFound()
  }

  const items = await getLearningPathLessonItems(lesson.id)

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#ffffff]">
        <LearningPathLessonPage chapter={chapter} lesson={lesson} items={items} />
      </main>
    </>
  )
}
