import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireDevSession } from "@/lib/dev-api-session"
import { assertDevCanAccessApiSubject } from "@/lib/admin-check"
import { buildBiologyQuizRow, type BiologyQuizCreateInput } from "@/lib/quiz-question-utils"

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, key)
}

/**
 * POST — creează o grilă de biologie (dev cu acces la biology sau super-dev).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const body = (await req.json()) as BiologyQuizCreateInput & { subject?: string }
    const subject = typeof body.subject === "string" ? body.subject.trim() : "biology"
    if (subject === "biology" && !assertDevCanAccessApiSubject(auth.permissions, "biology")) {
      return NextResponse.json({ error: "Nu ai acces dev la biologie." }, { status: 403 })
    }

    let row: ReturnType<typeof buildBiologyQuizRow>
    try {
      row = buildBiologyQuizRow(body)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Date invalide pentru grila de biologie."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert(row)
      .select("id, question_id, class, statement, title, difficulty, correct_answers, created_at")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Există deja o grilă cu acest ID (B001 etc.)." }, { status: 409 })
      }
      logger.error("[dev/quiz-questions] create:", error)
      return NextResponse.json({ error: "Nu am putut crea grila de biologie." }, { status: 500 })
    }

    return NextResponse.json({ quizQuestion: data })
  } catch (err: unknown) {
    logger.error("[dev/quiz-questions] POST:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
