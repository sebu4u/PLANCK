import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

  const itemId = typeof (body as { itemId?: unknown })?.itemId === "string"
    ? (body as { itemId: string }).itemId.trim()
    : ""

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
    return NextResponse.json({ error: "itemId invalid." }, { status: 400 })
  }

  const { data: item, error: itemError } = await supabase
    .from("personalized_course_items")
    .select("id, course_id")
    .eq("id", itemId)
    .maybeSingle()

  if (itemError || !item) {
    return NextResponse.json({ error: "Itemul nu există." }, { status: 404 })
  }

  const { error } = await supabase
    .from("personalized_course_item_progress")
    .upsert(
      {
        user_id: user.id,
        item_id: itemId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" },
    )

  if (error) {
    console.error("personalized progress upsert:", error)
    return NextResponse.json({ error: "Nu am putut salva progresul." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
