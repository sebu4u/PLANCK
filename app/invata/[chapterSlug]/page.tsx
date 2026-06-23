import { notFound, redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import type { Metadata } from "next"
import type { LearningPathLesson } from "@/lib/supabase-learning-paths"

export const dynamic = "force-dynamic"

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

  const { data: chapter, error } = await admin
    .from("learning_path_chapters")
    .select("*")
    .eq("slug", chapterSlug.trim())
    .maybeSingle()

  if (error || !chapter) {
    notFound()
  }

  if (chapter.generation_status === "creating" || chapter.generation_status === "failed") {
    redirect("/invata")
  }

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

  redirect("/invata")
}
