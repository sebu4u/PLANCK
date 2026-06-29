import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getLearningPathAccessForUser } from "@/lib/learning-path-access"
import {
  isFreePreviewLearningPathChapterSlug,
  splitLearningPathChaptersForFreePlanHub,
} from "@/lib/learning-path-free-plan"
import {
  getLearningPathHubLessonsByChapterIds,
  getLearningPathLessonItemCountsByLessonIds,
  getUserPersonalizedLearningPathHubChapters,
  type LearningPathHubChapter,
} from "@/lib/supabase-learning-paths"
import {
  getCachedPublicLearningPathHubCatalog,
  getCachedPublicLearningPathLessonItemCounts,
} from "@/lib/learning-path-hub-cache"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set("Cache-Control", "no-store")
  return NextResponse.json(data, { ...init, headers })
}

function sortLearningPathChaptersForHub(chapters: LearningPathHubChapter[]): LearningPathHubChapter[] {
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

export async function GET(_req: NextRequest) {
  const supabase = await createClient()

  try {
    const [
      {
        data: { user },
        error: userError,
      },
      publicCatalog,
    ] = await Promise.all([supabase.auth.getUser(), getCachedPublicLearningPathHubCatalog()])

    if (userError || !user) {
      return noStoreJson({ error: "Necesită autentificare." }, { status: 401 })
    }

    const [personalizedChapters, access] = await Promise.all([
      getUserPersonalizedLearningPathHubChapters(user.id, supabase),
      getLearningPathAccessForUser(supabase, user, null),
    ])

    const personalizedLessonsByChapter = personalizedChapters.length
      ? await getLearningPathHubLessonsByChapterIds(
          personalizedChapters.map((chapter) => chapter.id),
          supabase
        )
      : {}

    const publicChapterIdSet = new Set(publicCatalog.chapters.map((chapter) => chapter.id))
    const chapters = sortLearningPathChaptersForHub([
      ...personalizedChapters,
      ...publicCatalog.chapters,
    ])
    const lessonsByChapter = {
      ...publicCatalog.lessonsByChapter,
      ...personalizedLessonsByChapter,
    }

    const hasFullAccess = access.mode === "full"
    const lockedChapterIds = hasFullAccess
      ? []
      : chapters
          .filter((chapter) => !isFreePreviewLearningPathChapterSlug(chapter.slug))
          .map((chapter) => chapter.id)

    const { visibleChapters, archivedChapters } = hasFullAccess
      ? { visibleChapters: chapters, archivedChapters: [] as LearningPathHubChapter[] }
      : splitLearningPathChaptersForFreePlanHub(chapters)

    const visiblePublicLessonIds = visibleChapters
      .filter((chapter) => publicChapterIdSet.has(chapter.id))
      .flatMap((chapter) => (lessonsByChapter[chapter.id] ?? []).map((lesson) => lesson.id))
    const visiblePersonalizedLessonIds = visibleChapters
      .filter((chapter) => !publicChapterIdSet.has(chapter.id))
      .flatMap((chapter) => (lessonsByChapter[chapter.id] ?? []).map((lesson) => lesson.id))

    const [publicItemCounts, personalizedItemCounts] = await Promise.all([
      getCachedPublicLearningPathLessonItemCounts(visiblePublicLessonIds),
      getLearningPathLessonItemCountsByLessonIds(visiblePersonalizedLessonIds, supabase),
    ])
    const itemCountsByLessonId = { ...publicItemCounts, ...personalizedItemCounts }

    const lessonProgressByLessonId: Record<string, { completed: number; total: number }> = {}
    for (const lessonId of [...visiblePublicLessonIds, ...visiblePersonalizedLessonIds]) {
      const total = itemCountsByLessonId[lessonId] ?? 0
      lessonProgressByLessonId[lessonId] = { completed: 0, total }
    }

    return noStoreJson({
      chapters: visibleChapters,
      archivedChapters,
      lessonsByChapter,
      lockedChapterIds,
      lessonProgressByLessonId,
    })
  } catch (error) {
    logger.error("[invata/hub-session] load failed:", error)
    return noStoreJson({ error: "Nu am putut încărca traseele tale." }, { status: 500 })
  }
}
