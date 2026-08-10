import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parsePracticeTestItems } from "@/lib/practice-tests"

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon configuration.")
  }
  return createClient(url, anonKey)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/teste/[id]/attempts — începe un attempt
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabaseUser = createServerClientWithToken(accessToken)
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const { id: rawId } = await context.params
    const testId = decodeURIComponent(rawId ?? "").trim()
    if (!testId) {
      return NextResponse.json({ error: "ID invalid." }, { status: 400 })
    }

    const anon = createAnonClient()
    const { data: testRow, error: testError } = await anon
      .from("practice_tests")
      .select("id, items, is_published, time_limit_seconds")
      .eq("id", testId)
      .eq("is_published", true)
      .maybeSingle()

    if (testError) {
      logger.error("[api/teste/attempts] test fetch error:", testError)
      return NextResponse.json({ error: "Nu am putut verifica testul." }, { status: 500 })
    }
    if (!testRow) {
      return NextResponse.json({ error: "Testul nu a fost găsit." }, { status: 404 })
    }

    const items = parsePracticeTestItems(testRow.items)
    if (items.length === 0) {
      return NextResponse.json({ error: "Testul nu are probleme." }, { status: 400 })
    }

    const { data: attempt, error: insertError } = await supabaseUser
      .from("practice_test_attempts")
      .insert({
        test_id: testId,
        user_id: user.id,
        answers: {},
      })
      .select("id, test_id, started_at, submitted_at, exceeded_time")
      .single()

    if (insertError || !attempt) {
      logger.error("[api/teste/attempts] insert error:", insertError)
      return NextResponse.json({ error: "Nu am putut începe testul." }, { status: 500 })
    }

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (err) {
    logger.error("[api/teste/attempts] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
