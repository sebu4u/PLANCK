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

  const itemId = (body as { itemId?: unknown }).itemId
  if (!isUuid(itemId)) {
    return NextResponse.json({ error: "itemId invalid" }, { status: 400 })
  }

  const { error } = await auth.supabase.from("user_learning_path_flashcard_offers").upsert(
    {
      user_id: auth.user.id,
      item_id: itemId.trim(),
      last_offered_at: new Date().toISOString(),
      last_status: "skipped",
      cards_generated: 0,
    },
    { onConflict: "user_id,item_id" }
  )

  if (error) {
    console.error("flashcard offer skip:", error)
    return NextResponse.json({ error: "Failed to record skip" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
