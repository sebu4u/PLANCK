import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase, isUuid } from "@/lib/learning-path-flashcard-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedSupabase(request)
  if ("error" in auth) return auth.error

  const { id: sessionId } = await params
  if (!isUuid(sessionId)) {
    return NextResponse.json({ error: "sessionId invalid" }, { status: 400 })
  }

  const { data: session } = await auth.supabase
    .from("user_flashcard_sessions")
    .select("id, item_id")
    .eq("id", sessionId.trim())
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: "Sesiune negăsită" }, { status: 404 })
  }

  const now = new Date().toISOString()

  await auth.supabase
    .from("user_flashcard_sessions")
    .update({ status: "completed", completed_at: now })
    .eq("id", sessionId.trim())
    .eq("user_id", auth.user.id)

  await auth.supabase.from("user_learning_path_flashcard_offers").upsert(
    {
      user_id: auth.user.id,
      item_id: session.item_id,
      last_offered_at: now,
      last_status: "completed",
      cards_generated: 3,
    },
    { onConflict: "user_id,item_id" }
  )

  return NextResponse.json({ ok: true })
}
