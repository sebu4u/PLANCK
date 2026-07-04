import type { Metadata } from "next"
import type { SupabaseClient } from "@supabase/supabase-js"
import { notFound, redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { MarkLearningPathLessonProgress } from "@/components/invata/mark-learning-path-lesson-progress"
import { LearningPathLessonPage } from "@/components/invata/learning-path-lesson-page"
import { LearningPathLessonLockedPreview } from "@/components/invata/learning-path-lesson-locked-preview"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import {
  getCompletedLearningPathItemIdsForUser,
  getLearningPathChapterById,
  getLearningPathChapterBySlug,
  getLearningPathLessonById,
  getLearningPathLessonBySlug,
  getCanonicalLearningPathLessonPath,
  getLearningPathLessonItems,
  getLearningPathLessonsByChapterId,
  getNextIncompleteLearningPathItem,
  isUuid,
  learningPathUrlNeedsCanonicalRedirect,
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

async function resolveOwnedPersonalizedLessonContext(
  chapterSlug: string,
  lessonSlug: string,
  userId: string,
): Promise<{
  chapter: Awaited<ReturnType<typeof getLearningPathChapterBySlug>>
  lesson: Awaited<ReturnType<typeof getLearningPathLessonBySlug>>
  client: SupabaseClient | null
}> {
  const admin = createAdminClient()
  const chapterQuery = admin
    .from("learning_path_chapters")
    .select("*")
    .eq("generated_by_user_id", userId)
    .eq("is_personalized", true)
    .eq("is_active", true)

  const { data: chapter, error: chapterError } = isUuid(chapterSlug)
    ? await chapterQuery.eq("id", chapterSlug.trim()).maybeSingle()
    : await chapterQuery.eq("slug", chapterSlug.trim()).maybeSingle()

  if (chapterError || !chapter) {
    return { chapter: null, lesson: null, client: null }
  }

  const lessonQuery = admin
    .from("learning_path_lessons")
    .select("*")
    .eq("chapter_id", chapter.id)
    .eq("is_active", true)

  const { data: lesson, error: lessonError } = isUuid(lessonSlug)
    ? await lessonQuery.eq("id", lessonSlug.trim()).maybeSingle()
    : await lessonQuery.eq("slug", lessonSlug.trim()).maybeSingle()

  if (lessonError || !lesson) {
    return { chapter: null, lesson: null, client: null }
  }

  return { chapter, lesson, client: admin }
}

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

  const canonicalPath = getCanonicalLearningPathLessonPath(chapter, lesson)
  const description =
    lesson.description ||
    chapter.description ||
    `Lecție din traseul Planck Academy: ${chapter.title}. Pregătire pentru notă la clasă, BAC sau admitere.`

  return {
    title: `${lesson.title} | ${chapter.title} | PLANCK`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${lesson.title} – Traseu Planck Academy`,
      description,
      url: `https://www.planck.academy${canonicalPath}`,
      type: "website",
    },
  }
}

export default async function InvataLessonDetailPage({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string }>
}) {
  const { chapterSlug, lessonSlug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let contentClient: SupabaseClient = supabase
  let chapter = isUuid(chapterSlug)
    ? await getLearningPathChapterById(chapterSlug, supabase)
    : await getLearningPathChapterBySlug(chapterSlug, supabase)

  let lesson = null
  if (chapter) {
    lesson = isUuid(lessonSlug)
      ? await getLearningPathLessonById(lessonSlug, supabase)
      : await getLearningPathLessonBySlug(chapterSlug, lessonSlug, supabase)
  }

  if ((!chapter || !lesson || lesson.chapter_id !== chapter.id) && user) {
    const ownedPersonalized = await resolveOwnedPersonalizedLessonContext(
      chapterSlug,
      lessonSlug,
      user.id,
    )
    if (ownedPersonalized.chapter && ownedPersonalized.lesson && ownedPersonalized.client) {
      chapter = ownedPersonalized.chapter
      lesson = ownedPersonalized.lesson
      contentClient = ownedPersonalized.client
    }
  }

  if (!chapter || !lesson || lesson.chapter_id !== chapter.id) {
    notFound()
  }

  const access = await getLearningPathAccess(chapter)
  const showRealContent = access.mode === "full" || access.mode === "free-preview"

  const canonicalRedirect = learningPathUrlNeedsCanonicalRedirect(chapterSlug, lessonSlug, chapter, lesson)
  if (canonicalRedirect) {
    redirect(canonicalRedirect)
  }

  const chapterLessons = showRealContent ? await getLearningPathLessonsByChapterId(chapter.id, contentClient) : []
  const currentLessonIndex = chapterLessons.findIndex((chapterLesson) => chapterLesson.id === lesson.id)
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < chapterLessons.length - 1
      ? chapterLessons[currentLessonIndex + 1]
      : null

  const rawItems = showRealContent ? await getLearningPathLessonItems(lesson.id, contentClient) : []
  const items = rawItems.map((item) => ({
    ...item,
    content_json: sanitizeTestContentJson(item.item_type, item.content_json ?? null),
  }))
  let initialSelectedItemId: string | null = items[0]?.id ?? null
  let completedItemIdList: string[] = []

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
              nextLesson={nextLesson}
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
