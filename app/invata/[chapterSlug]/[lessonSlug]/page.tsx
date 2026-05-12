import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { MarkLearningPathLessonProgress } from "@/components/invata/mark-learning-path-lesson-progress"
import { LearningPathLessonPage } from "@/components/invata/learning-path-lesson-page"
import { LearningPathLessonLockedPreview } from "@/components/invata/learning-path-lesson-locked-preview"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import { getLearningPathAccess } from "@/lib/learning-path-access"
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
import { cookies } from "next/headers"
import { FREE_PLAN_LEARNING_PATH_ITEM_LIMIT } from "@/lib/learning-path-free-plan"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  countGuestCompletedLearningPathItems,
  getGuestCompletedItemIdsForLesson,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"

export const dynamic = "force-dynamic"

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

  const access = await getLearningPathAccess(chapter)
  const showRealContent = access.mode === "full" || access.mode === "free-preview"

  const lesson = isUuid(lessonSlug)
    ? await getLearningPathLessonById(lessonSlug)
    : await getLearningPathLessonBySlug(chapterSlug, lessonSlug)

  if (!lesson || lesson.chapter_id !== chapter.id) {
    notFound()
  }

  const rawItems = showRealContent ? await getLearningPathLessonItems(lesson.id) : []
  const items = rawItems.map((item) => ({
    ...item,
    content_json: sanitizeTestContentJson(item.item_type, item.content_json ?? null),
  }))
  let initialSelectedItemId: string | null = items[0]?.id ?? null
  let completedItemIdList: string[] = []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let guestProgressMap = parseGuestLearningPathProgress(undefined)
  if (access.mode === "free-preview" && !user) {
    const cookieStore = await cookies()
    guestProgressMap = parseGuestLearningPathProgress(
      cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value
    )
  }
  const guestGlobalSolved =
    access.mode === "free-preview" && !user
      ? countGuestCompletedLearningPathItems(guestProgressMap)
      : 0
  const guestLessonCompleted =
    access.mode === "free-preview" && !user
      ? getGuestCompletedItemIdsForLesson(guestProgressMap, lesson.id)
      : []

  if (items.length > 0) {
    if (user) {
      const completedItemIds = await getCompletedLearningPathItemIdsForUser(
        supabase,
        user.id,
        items.map((item) => item.id)
      )
      completedItemIdList = Array.from(completedItemIds)
      initialSelectedItemId =
        getNextIncompleteLearningPathItem(items, completedItemIds)?.id ?? items[items.length - 1]?.id ?? null
    } else if (access.mode === "free-preview") {
      completedItemIdList = guestLessonCompleted
      initialSelectedItemId =
        getNextIncompleteLearningPathItem(items, guestLessonCompleted)?.id ?? items[items.length - 1]?.id ?? null
    }
  }

  const freeAccess =
    access.mode === "free-preview"
      ? {
          itemsSolved: user ? access.itemsSolved : guestGlobalSolved,
          itemsRemaining: user
            ? access.itemsRemaining
            : Math.max(0, FREE_PLAN_LEARNING_PATH_ITEM_LIMIT - guestGlobalSolved),
        }
      : null

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#ffffff]">
        {showRealContent ? (
          <>
            <LearningPathLessonPage
              chapter={chapter}
              lesson={lesson}
              items={items}
              initialSelectedItemId={initialSelectedItemId}
              completedItemIds={completedItemIdList}
              freeAccess={freeAccess}
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
