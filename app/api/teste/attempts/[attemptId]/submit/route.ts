import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import {
  computeExceededTime,
  gradeCatalogMath,
  gradeCatalogPhysics,
  gradeCustomItem,
  normalizeTestRow,
  parseAnswersMap,
  parsePracticeTestItems,
  type PracticeTestCatalogItem,
  type PracticeTestCustomItem,
  type PracticeTestItemResult,
} from "@/lib/practice-tests"

interface RouteContext {
  params: Promise<{ attemptId: string }>
}

/**
 * POST /api/teste/attempts/[attemptId]/submit
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

    const { attemptId: rawId } = await context.params
    const attemptId = decodeURIComponent(rawId ?? "").trim()
    if (!attemptId) {
      return NextResponse.json({ error: "ID invalid." }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const answers = parseAnswersMap(body?.answers)

    const { data: attempt, error: attemptError } = await supabaseUser
      .from("practice_test_attempts")
      .select(
        "id, test_id, user_id, started_at, submitted_at, exceeded_time, score_correct, score_total, answers, results",
      )
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (attemptError) {
      logger.error("[api/teste/submit] attempt fetch error:", attemptError)
      return NextResponse.json({ error: "Nu am putut încărca attempt-ul." }, { status: 500 })
    }
    if (!attempt) {
      return NextResponse.json({ error: "Attempt-ul nu a fost găsit." }, { status: 404 })
    }

    if (attempt.submitted_at) {
      return NextResponse.json({
        attempt: {
          id: attempt.id,
          test_id: attempt.test_id,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          exceeded_time: attempt.exceeded_time,
          score_correct: attempt.score_correct,
          score_total: attempt.score_total,
          answers: parseAnswersMap(attempt.answers),
          results: attempt.results,
        },
        alreadySubmitted: true,
      })
    }

    const service = getServiceRoleSupabase()
    const { data: testData, error: testError } = await service
      .from("practice_tests")
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .eq("id", attempt.test_id)
      .maybeSingle()

    if (testError || !testData) {
      logger.error("[api/teste/submit] test fetch error:", testError)
      return NextResponse.json({ error: "Testul asociat nu a fost găsit." }, { status: 404 })
    }

    const test = normalizeTestRow(testData as Record<string, unknown>)
    if (!test) {
      return NextResponse.json({ error: "Test invalid." }, { status: 500 })
    }

    const items = parsePracticeTestItems(test.items)
    const physicsIds = items
      .filter((i): i is PracticeTestCatalogItem => i.type === "catalog" && i.subject === "fizica")
      .map((i) => i.problemId)
    const mathIds = items
      .filter((i): i is PracticeTestCatalogItem => i.type === "catalog" && i.subject === "matematica")
      .map((i) => i.problemId)

    const physicsMap = new Map<string, Record<string, unknown>>()
    const mathMap = new Map<string, Record<string, unknown>>()

    if (physicsIds.length > 0) {
      const { data } = await service
        .from("problems")
        .select("id, answer_type, grila_options, grila_correct_index, value_subpoints")
        .in("id", physicsIds)
      for (const row of data ?? []) {
        physicsMap.set(row.id, row as Record<string, unknown>)
      }
    }

    if (mathIds.length > 0) {
      const { data } = await service
        .from("math_problems")
        .select("id, answer_type, value_subpoints")
        .in("id", mathIds)
      for (const row of data ?? []) {
        mathMap.set(row.id, row as Record<string, unknown>)
      }
    }

    const results: PracticeTestItemResult[] = []
    for (const item of items) {
      const answer = answers[item.id] ?? null
      if (item.type === "custom") {
        results.push(gradeCustomItem(item as PracticeTestCustomItem, answer))
        continue
      }
      if (item.subject === "fizica") {
        const problem = physicsMap.get(item.problemId) ?? {}
        results.push(
          gradeCatalogPhysics(
            item.id,
            {
              answer_type: (problem.answer_type as string | null) ?? null,
              grila_correct_index: (problem.grila_correct_index as number | null) ?? null,
              grila_options: (problem.grila_options as string[] | null) ?? null,
              value_subpoints:
                (problem.value_subpoints as Array<{ correct_value?: number }> | null) ?? null,
            },
            answer,
          ),
        )
        continue
      }
      const problem = mathMap.get(item.problemId) ?? {}
      results.push(
        gradeCatalogMath(
          item.id,
          {
            answer_type: (problem.answer_type as string | null) ?? null,
            value_subpoints:
              (problem.value_subpoints as Array<{ correct_value?: number }> | null) ?? null,
          },
          answer,
        ),
      )
    }

    const scoreCorrect = results.filter((r) => r.correct).length
    const scoreTotal = results.length
    const exceededTime = computeExceededTime(attempt.started_at, test.time_limit_seconds)
    const submittedAt = new Date().toISOString()

    const { data: updated, error: updateError } = await service
      .from("practice_test_attempts")
      .update({
        answers,
        results,
        score_correct: scoreCorrect,
        score_total: scoreTotal,
        exceeded_time: exceededTime,
        submitted_at: submittedAt,
      })
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .is("submitted_at", null)
      .select(
        "id, test_id, started_at, submitted_at, exceeded_time, score_correct, score_total, answers, results",
      )
      .maybeSingle()

    if (updateError) {
      logger.error("[api/teste/submit] update error:", updateError)
      return NextResponse.json({ error: "Nu am putut salva rezultatele." }, { status: 500 })
    }

    if (!updated) {
      // Race: already submitted
      const { data: existing } = await supabaseUser
        .from("practice_test_attempts")
        .select(
          "id, test_id, started_at, submitted_at, exceeded_time, score_correct, score_total, answers, results",
        )
        .eq("id", attemptId)
        .maybeSingle()
      return NextResponse.json({
        attempt: existing,
        alreadySubmitted: true,
      })
    }

    return NextResponse.json({
      attempt: {
        ...updated,
        answers: parseAnswersMap(updated.answers),
      },
      alreadySubmitted: false,
    })
  } catch (err) {
    logger.error("[api/teste/submit] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
