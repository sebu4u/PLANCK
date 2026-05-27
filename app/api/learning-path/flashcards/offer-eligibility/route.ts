import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase, isUuid } from "@/lib/learning-path-flashcard-auth"
import { getFlashcardOfferEligibility } from "@/lib/supabase-flashcards"

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if ("error" in auth) return auth.error

  const itemId = request.nextUrl.searchParams.get("itemId")
  if (!isUuid(itemId)) {
    return NextResponse.json({ error: "itemId invalid" }, { status: 400 })
  }

  const eligible = await getFlashcardOfferEligibility(auth.supabase, itemId.trim())
  return NextResponse.json({ eligible })
}
