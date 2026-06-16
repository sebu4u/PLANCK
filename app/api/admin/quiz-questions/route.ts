import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"
import { buildBiologyQuizRow, type BiologyQuizCreateInput } from "@/lib/quiz-question-utils"

function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, key)
}

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }

  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }

  const supabase = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }

  if (!(await isAdminFromDB(supabase, userData.user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }

  return { user: userData.user }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const body = (await req.json()) as BiologyQuizCreateInput
    let row: ReturnType<typeof buildBiologyQuizRow>
    try {
      row = buildBiologyQuizRow(body)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Date invalide pentru grila de biologie."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert(row)
      .select("id, question_id, class, statement, title, difficulty, correct_answers, created_at")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Există deja o grilă cu acest ID (B001 etc.)." }, { status: 409 })
      }
      logger.error("[admin/quiz-questions] create:", error)
      return NextResponse.json({ error: "Nu am putut crea grila de biologie." }, { status: 500 })
    }

    return NextResponse.json({ quizQuestion: data })
  } catch (err: unknown) {
    logger.error("[admin/quiz-questions] POST:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
