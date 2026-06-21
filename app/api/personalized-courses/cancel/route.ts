import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { isPersonalizedChapterStillCreating } from "@/lib/personalized-courses/chapter-generation-status"

export const dynamic = "force-dynamic"

/**
 * POST /api/personalized-courses/cancel
 * Stops an in-progress personalized course generation for the current user.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 })
  }

  const chapterId =
    typeof (body as { chapterId?: unknown })?.chapterId === "string"
      ? (body as { chapterId: string }).chapterId.trim()
      : ""

  if (!chapterId) {
    return NextResponse.json({ error: "chapterId este obligatoriu." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: chapter, error: chapterError } = await admin
    .from("learning_path_chapters")
    .select("id, generation_status")
    .eq("id", chapterId)
    .eq("generated_by_user_id", user.id)
    .eq("is_personalized", true)
    .maybeSingle()

  if (chapterError) {
    console.error("personalized course cancel lookup:", chapterError)
    return NextResponse.json({ error: "Nu am putut verifica acest curs." }, { status: 500 })
  }

  if (!chapter) {
    return NextResponse.json({ error: "Cursul nu există sau nu îți aparține." }, { status: 404 })
  }

  if (chapter.generation_status === "ready") {
    return NextResponse.json({ error: "Traseul este deja gata." }, { status: 409 })
  }

  if (!(await isPersonalizedChapterStillCreating(admin, chapterId))) {
    return NextResponse.json({ ok: true, alreadyStopped: true })
  }

  const { error: deleteError } = await admin
    .from("learning_path_chapters")
    .delete()
    .eq("id", chapterId)
    .eq("generated_by_user_id", user.id)
    .eq("is_personalized", true)
    .eq("generation_status", "creating")

  if (deleteError) {
    console.error("personalized course cancel delete:", deleteError)
    return NextResponse.json({ error: "Nu am putut opri generarea." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
