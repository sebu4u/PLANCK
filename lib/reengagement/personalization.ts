import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { randomUUID } from "crypto"

import { ONBOARDING_SUBJECT_OPTIONS } from "@/lib/onboarding"
import { PLATFORM_SITE_URL } from "@/lib/platform-marketing"
import { buildReengagementSubject } from "@/lib/reengagement/email-content"
import type { ReengagementPersonalization, ReengagementTier } from "@/lib/reengagement/types"
import {
  getCompletedLearningPathItemIdsForUser,
  getLastWorkedLearningPathChapterIdForUser,
  getLearningPathChapterById,
  getLearningPathLessonItems,
  getLearningPathLessonsByChapterId,
  getLearningPathResumeHrefForUser,
} from "@/lib/supabase-learning-paths"

const MATERIE_LABELS: Record<string, string> = Object.fromEntries(
  ONBOARDING_SUBJECT_OPTIONS.map((o) => [o.id, o.label])
)

function firstNameFromProfile(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return "acolo"
  return trimmed.split(/\s+/)[0] || "acolo"
}

function materieLabel(materie: string | null | undefined): string {
  if (!materie) return "Planck"
  return MATERIE_LABELS[materie] ?? materie
}

async function getChapterProgressPercent(
  client: SupabaseClient,
  userId: string,
  chapterId: string
): Promise<number> {
  const lessons = await getLearningPathLessonsByChapterId(chapterId)
  if (!lessons.length) return 0

  const allItemIds: string[] = []
  const itemsByLesson: string[][] = []

  for (const lesson of lessons) {
    const items = await getLearningPathLessonItems(lesson.id)
    const ids = items.map((i) => i.id)
    itemsByLesson.push(ids)
    allItemIds.push(...ids)
  }

  if (allItemIds.length === 0) return 0

  const completed = await getCompletedLearningPathItemIdsForUser(client, userId, allItemIds)
  const completedSet = new Set(completed)
  const completedCount = allItemIds.filter((id) => completedSet.has(id)).length
  return Math.round((completedCount / allItemIds.length) * 100)
}

async function getLastWorkLabel(
  client: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: progressRow } = await client
    .from("user_learning_path_item_progress")
    .select("item_id, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (progressRow?.item_id) {
    const { data: itemRow } = await client
      .from("learning_path_lesson_items")
      .select("title, learning_path_lessons(title, learning_path_chapters(title))")
      .eq("id", progressRow.item_id)
      .maybeSingle()

    const lesson = itemRow?.learning_path_lessons as
      | { title?: string; learning_path_chapters?: { title?: string } | { title?: string }[] }
      | { title?: string; learning_path_chapters?: { title?: string } | { title?: string }[] }[]
      | null

    const lessonObj = Array.isArray(lesson) ? lesson[0] : lesson
    const chapterRaw = lessonObj?.learning_path_chapters
    const chapter = Array.isArray(chapterRaw) ? chapterRaw[0] : chapterRaw

    const parts = [
      itemRow?.title?.trim(),
      lessonObj?.title?.trim(),
      chapter?.title?.trim(),
    ].filter(Boolean)

    if (parts.length) return parts.join(" — ")
  }

  const { data: solvedRow } = await client
    .from("solved_problems")
    .select("problem_id, solved_at")
    .eq("user_id", userId)
    .order("solved_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (solvedRow?.problem_id) {
    const { data: problem } = await client
      .from("problems")
      .select("title")
      .eq("id", solvedRow.problem_id)
      .maybeSingle()

    if (problem?.title) return problem.title
    return `problema ${solvedRow.problem_id}`
  }

  return "ultima lecție"
}

export async function buildReengagementPersonalization(
  client: SupabaseClient,
  userId: string,
  tier: ReengagementTier,
  daysInactive: number,
  profile: {
    name: string | null
    preferred_materie: string | null
    current_streak: number
  }
): Promise<ReengagementPersonalization> {
  const resumePath = await getLearningPathResumeHrefForUser(userId, client)
  const ctaPath = resumePath.startsWith("/") ? resumePath : "/dashboard"
  const cta_url = `${PLATFORM_SITE_URL}${ctaPath}`

  const chapterId = await getLastWorkedLearningPathChapterIdForUser(client, userId)
  let materie = profile.preferred_materie
  let progress_percent = 0

  if (chapterId) {
    const chapter = await getLearningPathChapterById(chapterId)
    if (chapter?.materie) materie = chapter.materie
    progress_percent = await getChapterProgressPercent(client, userId, chapterId)
  }

  const last_work_label = await getLastWorkLabel(client, userId)
  const first_name = firstNameFromProfile(profile.name)
  const materieLabelStr = materieLabel(materie)

  const base = {
    first_name,
    days_inactive: daysInactive,
    last_work_label,
    progress_percent,
    materie: materieLabelStr,
    current_streak: profile.current_streak,
    cta_url,
    reeng_tier: tier,
    reeng_send_id: randomUUID(),
  }

  return {
    ...base,
    subject: buildReengagementSubject(tier, base),
  }
}
