import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import {
  loadPersonalizedCourseItemPayload,
} from "@/lib/personalized-courses/data"
import { PersonalizedItemView } from "@/components/invata/personalized-item-view"
import { ITEM_TYPE_LABEL } from "@/components/invata/learning-path-item-body"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

export const dynamic = "force-dynamic"

function parseItemIndex(raw: string): number | null {
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return parsed
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string; itemIndex: string }>
}): Promise<Metadata> {
  const { courseId, lessonId, itemIndex } = await params
  const parsedIndex = parseItemIndex(itemIndex)
  if (!parsedIndex) return generatePageMetadata("learning-paths")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return generatePageMetadata("learning-paths")

  const result = await loadPersonalizedCourseItemPayload(
    supabase,
    user.id,
    courseId,
    lessonId,
    parsedIndex,
  )
  if (result.status !== "ok") return generatePageMetadata("learning-paths")
  const { item, lesson } = result.payload
  return {
    title: `${item.title?.trim() || ITEM_TYPE_LABEL[item.item_type as LearningPathLessonType] || "Item"} | ${lesson.title} | PLANCK`,
    description: lesson.description ?? `Item din lecția ${lesson.title}.`,
  }
}

export default async function PersonalizedItemPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string; itemIndex: string }>
}) {
  const { courseId, lessonId, itemIndex } = await params
  const parsedIndex = parseItemIndex(itemIndex)
  if (!parsedIndex) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invata/personalizat/${courseId}/${lessonId}/${parsedIndex}`)
  }

  const access = await getLearningPathAccess(null)
  if (access.mode !== "full") {
    redirect(`/abonament?next=/invata/personalizat/${courseId}/${lessonId}/${parsedIndex}`)
  }

  const result = await loadPersonalizedCourseItemPayload(
    supabase,
    user.id,
    courseId,
    lessonId,
    parsedIndex,
  )

  if (result.status === "not_found") {
    notFound()
  }
  if (result.status === "unauthorized") {
    redirect(`/login?next=/invata/personalizat/${courseId}/${lessonId}/${parsedIndex}`)
  }

  return <PersonalizedItemView payload={result.payload} />
}
