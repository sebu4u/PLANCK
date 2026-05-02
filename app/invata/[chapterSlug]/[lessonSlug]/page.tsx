import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { MarkLearningPathLessonProgress } from "@/components/invata/mark-learning-path-lesson-progress"
import { LearningPathLessonPage } from "@/components/invata/learning-path-lesson-page"
import { LearningPathLessonLockedPreview } from "@/components/invata/learning-path-lesson-locked-preview"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import { canViewLearningPathContent } from "@/lib/learning-path-access"
import { createClient } from "@/lib/supabase/server"
import {
  getCompletedLearningPathItemIdsForUser,
  getLearningPathChapterById,
  getLearningPathChapterBySlug,
  getLearningPathLessonById,
  getLearningPathLessonBySlug,
  getLearningPathLessonItems,
  getNextIncompleteLearningPathItem,
  isUuid,
} from "@/lib/supabase-learning-paths"
import { sanitizeTestContentJson } from "@/lib/learning-path-test"

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
  const canViewLearningPathsContent = await canViewLearningPathContent()

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

  const rawItems = canViewLearningPathsContent ? await getLearningPathLessonItems(lesson.id) : []
  const items = rawItems.map((item) => ({
    ...item,
    content_json: sanitizeTestContentJson(item.item_type, item.content_json ?? null),
  }))
  let initialSelectedItemId: string | null = items[0]?.id ?? null

  if (items.length > 0) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const completedItemIds = await getCompletedLearningPathItemIdsForUser(
        supabase,
        user.id,
        items.map((item) => item.id)
      )
      initialSelectedItemId =
        getNextIncompleteLearningPathItem(items, completedItemIds)?.id ?? items[items.length - 1]?.id ?? null
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#ffffff]">
        {canViewLearningPathsContent ? (
          <>
            <LearningPathLessonPage
              chapter={chapter}
              lesson={lesson}
              items={items}
              initialSelectedItemId={initialSelectedItemId}
            />
            {items.length === 0 ? <MarkLearningPathLessonProgress lessonId={lesson.id} /> : null}
          </>
        ) : (
          <LearningPathLessonLockedPreview chapter={chapter} lesson={lesson} />
        )}
      </main>
    </>
  )
}
