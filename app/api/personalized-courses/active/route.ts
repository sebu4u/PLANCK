import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import {
  getPersonalizedGenerationStaleReason,
} from "@/lib/personalized-courses/generation-stale"

export const dynamic = "force-dynamic"

async function markChapterFailed(admin: ReturnType<typeof createAdminClient>, chapterId: string, reason: string) {
  await admin
    .from("learning_path_chapters")
    .update({
      generation_status: "failed",
      generation_metadata: {
        failedAt: new Date().toISOString(),
        reason: reason.slice(0, 500),
      },
    })
    .eq("id", chapterId)
}

/**
 * GET /api/personalized-courses/active
 * Returns the user's in-progress personalized chapters (generation_status=creating).
 * Used to restore the global corner widget after refresh/navigation.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("learning_path_chapters")
    .select("id, slug, title, generation_status, generation_metadata, created_at")
    .eq("generated_by_user_id", user.id)
    .eq("is_personalized", true)
    .eq("is_active", false)
    .eq("generation_status", "creating")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("active personalized courses:", error)
    return NextResponse.json({ error: "Nu am putut încărca generările active." }, { status: 500 })
  }

  const row = data?.[0]
  if (!row) {
    return NextResponse.json({ chapters: [] })
  }

  const metadata =
    row.generation_metadata && typeof row.generation_metadata === "object" && !Array.isArray(row.generation_metadata)
      ? (row.generation_metadata as Record<string, unknown>)
      : {}

  const staleReason = getPersonalizedGenerationStaleReason({
    createdAt: row.created_at,
    generationMetadata: metadata,
  })

  if (staleReason) {
    await markChapterFailed(admin, row.id, staleReason)
    return NextResponse.json({ chapters: [] })
  }

  const progress =
    metadata.progress && typeof metadata.progress === "object" && !Array.isArray(metadata.progress)
      ? (metadata.progress as { stage?: string; percent?: number; message?: string })
      : null

  return NextResponse.json({
    chapters: [
      {
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.generation_status ?? "creating",
        progress: progress
          ? {
              stage: progress.stage ?? null,
              percent: typeof progress.percent === "number" ? progress.percent : 0,
              message: progress.message ?? null,
            }
          : null,
      },
    ],
  })
}
