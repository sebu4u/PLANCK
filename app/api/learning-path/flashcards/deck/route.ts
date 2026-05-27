import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase } from "@/lib/learning-path-flashcard-auth"
import { getUserFlashcardDeck } from "@/lib/supabase-flashcards"

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if ("error" in auth) return auth.error

  const cards = await getUserFlashcardDeck(auth.supabase, auth.user.id)
  return NextResponse.json({ cards })
}
