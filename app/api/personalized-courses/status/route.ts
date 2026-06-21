import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import {
  getPersonalizedGenerationStaleReason,
  PERSONALIZED_GENERATION_STALE_REASON,
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
 * GET /api/personalized-courses/status?chapterId=...
 * Returns the generation status of a personalized learning path chapter.
 * Used by the generating-card client to poll until the chapter is ready.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }

  const url = new URL(request.url)
  const chapterId = url.searchParams.get("chapterId")?.trim()

  if (!chapterId) {
    return NextResponse.json({ error: "chapterId este obligatoriu." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("learning_path_chapters")
    .select("id, generation_status, generated_by_user_id, generation_metadata, created_at, is_active")
    .eq("id", chapterId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "Cursul nu a fost găsit." }, { status: 404 })
  }

  // Only the owner can poll their own personalized course.
  if (data.generated_by_user_id !== user.id) {
    return NextResponse.json({ error: "Nu ai acces la acest curs." }, { status: 403 })
  }

  const metadata =
    data.generation_metadata && typeof data.generation_metadata === "object" && !Array.isArray(data.generation_metadata)
      ? (data.generation_metadata as Record<string, unknown>)
      : {}

  if (data.generation_status === "creating") {
    const staleReason = getPersonalizedGenerationStaleReason({
      createdAt: data.created_at,
      generationMetadata: metadata,
    })

    if (staleReason) {
      await markChapterFailed(admin, chapterId, staleReason)
      return NextResponse.json({
        status: "failed" as const,
        stage: null,
        percent: 0,
        message: null,
        failureReason: staleReason,
        stale: true,
      })
    }
  }

  const progress =
    metadata.progress && typeof metadata.progress === "object" && !Array.isArray(metadata.progress)
      ? (metadata.progress as { stage?: string; percent?: number; message?: string })
      : null

  const failureReason =
    data.generation_status === "failed" && typeof metadata.reason === "string"
      ? metadata.reason
      : null

  const status =
    data.generation_status === "ready" || (data.generation_status === "creating" && data.is_active)
      ? "ready"
      : (data.generation_status ?? "creating")

  return NextResponse.json({
    status,
    stage: progress?.stage ?? null,
    percent: typeof progress?.percent === "number" ? progress.percent : 0,
    message: progress?.message ?? null,
    failureReason,
  })
}
