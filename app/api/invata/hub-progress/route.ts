import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"
import {
  getCompletedLearningPathItemIdsForUser,
  getCompletedLearningPathLessonIdsForUser,
  getLearningPathLessonItemAggregates,
  type LearningPathLessonItemAggregates,
} from "@/lib/supabase-learning-paths"
import { getCachedPublicLearningPathLessonItemAggregates } from "@/lib/learning-path-hub-cache"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  getGuestCompletedItemIdsForLesson,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"

export const dynamic = "force-dynamic"

const lessonIdListSchema = z.array(z.string().uuid()).max(500).default([])

const bodySchema = z.object({
  allLessonIds: lessonIdListSchema,
  publicVisibleLessonIds: lessonIdListSchema,
  personalizedVisibleLessonIds: lessonIdListSchema,
})

function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set("Cache-Control", "no-store")
  return NextResponse.json(data, { ...init, headers })
}

function mergeLearningPathLessonItemAggregates(
  ...aggregates: LearningPathLessonItemAggregates[]
): LearningPathLessonItemAggregates {
  return aggregates.reduce<LearningPathLessonItemAggregates>(
    (merged, aggregate) => ({
      counts: { ...merged.counts, ...aggregate.counts },
      itemIdsByLessonId: {
        ...merged.itemIdsByLessonId,
        ...aggregate.itemIdsByLessonId,
      },
    }),
    { counts: {}, itemIdsByLessonId: {} }
  )
}

function buildLessonProgress({
  visibleLessonIds,
  itemAggregates,
  completedLessonIds,
  completedItemIds,
}: {
  visibleLessonIds: string[]
  itemAggregates: LearningPathLessonItemAggregates
  completedLessonIds: string[]
  completedItemIds: Iterable<string>
}): Record<string, { completed: number; total: number }> {
  const completedLessonIdSet = new Set(completedLessonIds)
  const completedItemIdSet = new Set(completedItemIds)
  const progressByLessonId: Record<string, { completed: number; total: number }> = {}

  for (const lessonId of visibleLessonIds) {
    const total = itemAggregates.counts[lessonId] ?? 0
    if (total === 0) {
      progressByLessonId[lessonId] = {
        completed: completedLessonIdSet.has(lessonId) ? 1 : 0,
        total: 0,
      }
      continue
    }

    const itemIds = itemAggregates.itemIdsByLessonId[lessonId] ?? []
    const completed = itemIds.filter((itemId) => completedItemIdSet.has(itemId)).length
    progressByLessonId[lessonId] = { completed, total }
  }

  return progressByLessonId
}

export async function POST(req: NextRequest) {
  let parsedBody: z.infer<typeof bodySchema>
  try {
    const json = (await req.json().catch(() => ({}))) as unknown
    parsedBody = bodySchema.parse(json)
  } catch (error) {
    logger.warn("[invata/hub-progress] invalid request:", error)
    return noStoreJson({ error: "Date invalide." }, { status: 400 })
  }

  const {
    allLessonIds,
    publicVisibleLessonIds,
    personalizedVisibleLessonIds,
  } = parsedBody
  const visibleLessonIds = [...publicVisibleLessonIds, ...personalizedVisibleLessonIds]

  const supabase = await createClient()
  const [
    {
      data: { user },
    },
    publicItemAggregates,
    personalizedItemAggregates,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getCachedPublicLearningPathLessonItemAggregates(publicVisibleLessonIds),
    getLearningPathLessonItemAggregates(personalizedVisibleLessonIds, supabase),
  ])

  const itemAggregates = mergeLearningPathLessonItemAggregates(
    publicItemAggregates,
    personalizedItemAggregates
  )

  if (!user) {
    const guestProgressMap = parseGuestLearningPathProgress(
      req.cookies.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value
    )
    const completedItemIds = visibleLessonIds.flatMap((lessonId) =>
      getGuestCompletedItemIdsForLesson(guestProgressMap, lessonId)
    )

    return noStoreJson({
      completedLessonIds: [],
      lessonProgressByLessonId: buildLessonProgress({
        visibleLessonIds,
        itemAggregates,
        completedLessonIds: [],
        completedItemIds,
      }),
    })
  }

  try {
    const visibleItemIds = Object.values(itemAggregates.itemIdsByLessonId).flat()
    const [completedLessonIds, allCompletedItemIds] = await Promise.all([
      getCompletedLearningPathLessonIdsForUser(supabase, user.id, allLessonIds),
      visibleItemIds.length > 0
        ? getCompletedLearningPathItemIdsForUser(supabase, user.id, visibleItemIds)
        : Promise.resolve<string[]>([]),
    ])

    return noStoreJson({
      completedLessonIds,
      lessonProgressByLessonId: buildLessonProgress({
        visibleLessonIds,
        itemAggregates,
        completedLessonIds,
        completedItemIds: allCompletedItemIds,
      }),
    })
  } catch (error) {
    logger.error("[invata/hub-progress] progress load failed:", error)
    return noStoreJson({ error: "Nu am putut încărca progresul." }, { status: 500 })
  }
}
