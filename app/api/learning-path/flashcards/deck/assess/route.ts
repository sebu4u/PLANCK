import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase, isUuid } from "@/lib/learning-path-flashcard-auth"

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if ("error" in auth) return auth.error

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

  const { data: card } = await auth.supabase
    .from("user_flashcards")
    .select("know_count, dont_know_count")
    .eq("id", flashcardId.trim())
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (!card) {
    return NextResponse.json({ error: "Flashcard negăsit" }, { status: 404 })
  }

  const now = new Date().toISOString()
  const { error } = await auth.supabase
    .from("user_flashcards")
    .update({
      know_count: card.know_count + (knew ? 1 : 0),
      dont_know_count: card.dont_know_count + (knew ? 0 : 1),
      last_reviewed_at: now,
    })
    .eq("id", flashcardId.trim())
    .eq("user_id", auth.user.id)

  if (error) {
    console.error("deck assess flashcard:", error)
    return NextResponse.json({ error: "Failed to assess" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
