import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { LearningPathLessonLockedPreview } from "@/components/invata/learning-path-lesson-locked-preview"
import { FreePlanComparisonScreen } from "@/components/invata/free-plan-comparison-screen"
import { LearningPathItemExperience } from "@/components/invata/learning-path-item-experience"
import { ITEM_TYPE_LABEL } from "@/components/invata/learning-path-item-body"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import {
  getCanonicalLearningPathLessonPath,
  getLearningPathLessonItems,
  learningPathUrlNeedsCanonicalRedirect,
} from "@/lib/supabase-learning-paths"
import {
  loadLearningPathItemPayload,
  resolveLessonContext,
} from "@/lib/learning-path-item-loader"
import { getLearningPathAccess } from "@/lib/learning-path-access"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string; itemIndex: string }>
}): Promise<Metadata> {
  const { chapterSlug, lessonSlug, itemIndex } = await params
  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug)

  if (!chapter || !lesson) {
    return generatePageMetadata("learning-paths")
  }

  const access = await getLearningPathAccess(chapter)
  if (access.mode === "locked") {
    return generatePageMetadata("learning-paths")
  }

  const items = await getLearningPathLessonItems(lesson.id)
  const parsedIndex = Number.parseInt(itemIndex, 10)
  const item = Number.isFinite(parsedIndex) ? items[parsedIndex - 1] : null

  if (!item) {
    return generatePageMetadata("learning-paths")
  }

  const canonicalPath = getCanonicalLearningPathLessonPath(chapter, lesson, parsedIndex)

  return {
    title: `${item.title || ITEM_TYPE_LABEL[item.item_type]} | ${lesson.title} | PLANCK`,
    description: lesson.description || `Item din lecția ${lesson.title}.`,
    alternates: {
      canonical: canonicalPath,
    },
  }
}

export default async function InvataLessonItemPage({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string; itemIndex: string }>
}) {
  const { chapterSlug, lessonSlug, itemIndex } = await params
  const parsedIndex = Number.parseInt(itemIndex, 10)

  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug)
  if (chapter && lesson) {
    const canonicalRedirect = learningPathUrlNeedsCanonicalRedirect(
      chapterSlug,
      lessonSlug,
      chapter,
      lesson,
      itemIndex
    )
    if (canonicalRedirect) {
      redirect(canonicalRedirect)
    }
  }

  const result = await loadLearningPathItemPayload(chapterSlug, lessonSlug, parsedIndex)

  if (result.status === "not_found" || result.status === "invalid_index") {
    notFound()
  }

  if (result.status === "locked") {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#ffffff]">
          <LearningPathLessonLockedPreview chapter={result.chapter} lesson={result.lesson} />
        </main>
      </>
    )
  }

  if (result.status === "blocked") {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#ffffff]">
          <FreePlanComparisonScreen backHref={result.lessonBaseHref} />
        </main>
      </>
    )
  }

  return <LearningPathItemExperience initialPayload={result.payload} />
}
