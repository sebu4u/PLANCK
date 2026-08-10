import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import {
  normalizeTestRow,
  parseAnswersMap,
  secondsRemaining,
  toListItem,
} from "@/lib/practice-tests"
import { resolveParsedPublicItems } from "@/lib/practice-tests-server"

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon configuration.")
  }
  return createClient(url, anonKey)
}

interface RouteContext {
  params: Promise<{ attemptId: string }>
}

/**
 * GET /api/teste/attempts/[attemptId]
 */
export async function GET(req: NextRequest, context: RouteContext) {
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

    const { attemptId: rawId } = await context.params
    const attemptId = decodeURIComponent(rawId ?? "").trim()
    if (!attemptId) {
      return NextResponse.json({ error: "ID invalid." }, { status: 400 })
    }

    const { data: attempt, error: attemptError } = await supabaseUser
      .from("practice_test_attempts")
      .select(
        "id, test_id, user_id, started_at, submitted_at, exceeded_time, score_correct, score_total, answers, results",
      )
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (attemptError) {
      logger.error("[api/teste/attempts/id] fetch error:", attemptError)
      return NextResponse.json({ error: "Nu am putut încărca attempt-ul." }, { status: 500 })
    }
    if (!attempt) {
      return NextResponse.json({ error: "Attempt-ul nu a fost găsit." }, { status: 404 })
    }

    const anon = createAnonClient()
    const { data: testData, error: testError } = await anon
      .from("practice_tests")
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .eq("id", attempt.test_id)
      .maybeSingle()

    if (testError || !testData) {
      logger.error("[api/teste/attempts/id] test fetch error:", testError)
      return NextResponse.json({ error: "Testul asociat nu a fost găsit." }, { status: 404 })
    }

    const test = normalizeTestRow(testData as Record<string, unknown>)
    if (!test) {
      return NextResponse.json({ error: "Test invalid." }, { status: 500 })
    }

    const items = await resolveParsedPublicItems(anon, test.items)
    const submitted = Boolean(attempt.submitted_at)
    const remaining = secondsRemaining(attempt.started_at, test.time_limit_seconds)

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        test_id: attempt.test_id,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        exceeded_time: attempt.exceeded_time,
        score_correct: submitted ? attempt.score_correct : null,
        score_total: submitted ? attempt.score_total : null,
        answers: parseAnswersMap(attempt.answers),
        results: submitted ? attempt.results : null,
        seconds_remaining: remaining,
      },
      test: toListItem(test),
      items,
    })
  } catch (err) {
    logger.error("[api/teste/attempts/id] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
