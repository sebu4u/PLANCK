import { notFound, redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { PersonalizedCourseGeneratingCard } from "@/components/invata/personalized-course-generating-card"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import type { Metadata } from "next"
import type { LearningPathLesson } from "@/lib/supabase-learning-paths"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterSlug: string }>
}): Promise<Metadata> {
  const { chapterSlug } = await params
  const admin = createAdminClient()
  const { data } = await admin
    .from("learning_path_chapters")
    .select("title, generation_status")
    .eq("slug", chapterSlug.trim())
    .maybeSingle()
  return generatePageMetadata(data?.title ?? "Curs personalizat")
}

export default async function PersonalizedChapterStatusPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>
}) {
  const { chapterSlug } = await params
  const admin = createAdminClient()

  // Fetch the chapter WITHOUT the is_active filter — a "creating" chapter is
  // is_active=false until generation completes.
  const { data: chapter, error } = await admin
    .from("learning_path_chapters")
    .select("*")
    .eq("slug", chapterSlug.trim())
    .maybeSingle()

  if (error || !chapter) {
    notFound()
  }

  // If the chapter is ready and active, redirect to its first lesson.
  if (chapter.generation_status === "ready" && chapter.is_active) {
    const { data: lessons } = await admin
      .from("learning_path_lessons")
      .select("slug, order_index")
      .eq("chapter_id", chapter.id)
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .limit(1)

    const firstLesson = (lessons?.[0] as Pick<LearningPathLesson, "slug"> | undefined) ?? null
    if (firstLesson?.slug) {
      redirect(`/invata/${chapterSlug}/${firstLesson.slug}`)
    }
    redirect(`/invata`)
  }

  // Extract initial progress from server-rendered metadata for instant display.
  const meta =
    chapter.generation_metadata && typeof chapter.generation_metadata === "object" && !Array.isArray(chapter.generation_metadata)
      ? (chapter.generation_metadata as Record<string, unknown>)
      : {}
  const metaProgress =
    meta.progress && typeof meta.progress === "object" && !Array.isArray(meta.progress)
      ? (meta.progress as { stage?: string; percent?: number; message?: string })
      : null

  // Show the generating/failed state. The client component polls until ready.
  return (
    <PersonalizedCourseGeneratingCard
      chapterId={chapter.id}
      chapterSlug={chapterSlug}
      title={chapter.title}
      status={chapter.generation_status ?? "creating"}
      failureReason={
        chapter.generation_status === "failed"
          ? typeof chapter.generation_metadata === "object" &&
            chapter.generation_metadata &&
            "reason" in chapter.generation_metadata
            ? String((chapter.generation_metadata as Record<string, unknown>).reason)
            : null
          : null
      }
      initialProgress={
        metaProgress
          ? {
              stage: metaProgress.stage ?? null,
              percent: typeof metaProgress.percent === "number" ? metaProgress.percent : 0,
              message: metaProgress.message ?? null,
            }
          : null
      }
    />
  )
}
