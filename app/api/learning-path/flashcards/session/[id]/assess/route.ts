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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const flashcardId = (body as { flashcardId?: unknown }).flashcardId
  const knew = (body as { knew?: unknown }).knew
  if (!isUuid(flashcardId) || typeof knew !== "boolean") {
    return NextResponse.json({ error: "flashcardId și knew sunt obligatorii" }, { status: 400 })
  }

  const { data: session } = await auth.supabase
    .from("user_flashcard_sessions")
    .select("id, user_id")
    .eq("id", sessionId.trim())
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: "Sesiune negăsită" }, { status: 404 })
  }

  const assessment = knew ? "knew" : "didnt_know"
  const now = new Date().toISOString()

  const { error: sessionCardError } = await auth.supabase
    .from("user_flashcard_session_cards")
    .update({ self_assessment: assessment, reviewed_at: now })
    .eq("session_id", sessionId.trim())
    .eq("flashcard_id", flashcardId.trim())

  if (sessionCardError) {
    console.error("flashcard assess session card:", sessionCardError)
    return NextResponse.json({ error: "Failed to assess" }, { status: 500 })
  }

  const { data: card } = await auth.supabase
    .from("user_flashcards")
    .select("know_count, dont_know_count")
    .eq("id", flashcardId.trim())
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (card) {
    await auth.supabase
      .from("user_flashcards")
      .update({
        know_count: card.know_count + (knew ? 1 : 0),
        dont_know_count: card.dont_know_count + (knew ? 0 : 1),
        last_reviewed_at: now,
      })
      .eq("id", flashcardId.trim())
      .eq("user_id", auth.user.id)
  }

  return NextResponse.json({ ok: true })
}
