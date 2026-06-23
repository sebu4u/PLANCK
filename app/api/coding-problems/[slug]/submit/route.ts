export const runtime = "nodejs"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { getActiveCodingProblemBySlug, isCodingProblemUnlocked } from "@/lib/coding-problems-access"
import {
  judgeOutputMatches,
  runJudge0PythonSubmission,
  JUDGE0_PYTHON_LANGUAGE_ID,
} from "@/lib/coding-judge0-python"
import { logger } from "@/lib/logger"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { createServerClientWithToken } from "@/lib/supabaseServer"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

/** Parallel Judge0 runs per batch (reduces wall time without overloading CE). */
const JUDGE0_SUBMIT_CONCURRENCY = 4

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

type CodingProblemRow = {
  id: string
  language: string
  time_limit_ms: number
  memory_limit_kb: number
}

type TestRow = {
  id: string
  stdin: string | null
  expected_stdout: string | null
  weight: number | string | null
  order_index: number
  is_sample: boolean
  time_limit_ms: number | null
  memory_limit_kb: number | null
}

function testWeight(t: TestRow): number {
  const w = Number(t.weight ?? 1)
  return Number.isFinite(w) && w >= 0 ? w : 1
}

function mapPerTestDbStatus(passed: boolean, judgeStatusId: number): string {
  if (passed) return "passed"
  if (judgeStatusId === 6) return "compile_error"
  if (judgeStatusId === 5) return "time_limit_exceeded"
  if (judgeStatusId >= 7 && judgeStatusId <= 12) return "runtime_error"
  if (judgeStatusId === 13) return "internal_error"
  return "failed"
}

function aggregateSubmissionStatus(
  tests: TestRow[],
  perTest: Array<{ passed: boolean; judgeStatusId: number }>,
  stoppedOnCompile: boolean
): string {
  if (stoppedOnCompile) return "compile_error"
  if (perTest.length !== tests.length) {
    return "internal_error"
  }
  if (perTest.every((p) => p.passed)) return "accepted"
  if (perTest.some((p) => p.passed)) return "partial"
  if (perTest.some((p) => p.judgeStatusId === 5)) return "time_limit_exceeded"
  if (perTest.some((p) => p.judgeStatusId >= 7 && p.judgeStatusId <= 12)) return "runtime_error"
  if (perTest.some((p) => p.judgeStatusId === 6)) return "compile_error"
  return "wrong_answer"
}

type EloRpcRow = {
  previous_elo: number
  new_elo: number
  delta_elo: number
  old_best: number
  new_best: number
  max_gain: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const accessToken = parseAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const authed = createServerClientWithToken(accessToken)

  const { data: userData, error: userErr } = await authed.auth.getUser()
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Sesiune invalidă" }, { status: 401 })
  }
  const userId = userData.user.id

  let body: { sourceCode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 })
  }
  const sourceCode = typeof body.sourceCode === "string" ? body.sourceCode : ""
  if (!sourceCode.trim()) {
    return NextResponse.json({ error: "Codul sursă lipsește" }, { status: 400 })
  }

  const { data: problemRow, error: problemError } = await getActiveCodingProblemBySlug(supabase, slug)
  if (problemError || !problemRow) {
    return NextResponse.json({ error: "Problemă negăsită" }, { status: 404 })
  }

  const problem = problemRow as CodingProblemRow
  if (problem.language !== "python") {
    return NextResponse.json(
      { error: "Trimiterea oficială este disponibilă doar pentru probleme Python." },
      { status: 400 }
    )
  }

  const { ok: unlocked } = await isCodingProblemUnlocked(supabase, authed, accessToken, problem.id)
  if (!unlocked) {
    return NextResponse.json({ error: "Problem locked", code: "PROBLEM_LOCKED" }, { status: 403 })
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    logger.error("[coding-submit] admin client", e)
    return NextResponse.json({ error: "Configurare server incompletă." }, { status: 500 })
  }

  const { data: tests, error: testsError } = await admin
    .from("coding_problem_tests")
    .select("id, stdin, expected_stdout, weight, order_index, is_sample, time_limit_ms, memory_limit_kb")
    .eq("problem_id", problem.id)
    .order("order_index", { ascending: true })

  if (testsError || !tests?.length) {
    logger.error("[coding-submit] tests", testsError)
    return NextResponse.json({ error: "Problema nu are teste configurate." }, { status: 400 })
  }

  const typedTests = tests as TestRow[]
  const totalWeight = typedTests.reduce((s, t) => s + testWeight(t), 0)
  if (totalWeight <= 0) {
    return NextResponse.json({ error: "Suma ponderilor testelor este invalidă." }, { status: 400 })
  }

  const defaultCpuSec = Math.max(1, Math.ceil((problem.time_limit_ms || 2000) / 1000))
  const defaultMemKb = problem.memory_limit_kb || 256000

  const { data: progressRow } = await admin
    .from("coding_problem_progress")
    .select("best_score")
    .eq("user_id", userId)
    .eq("problem_id", problem.id)
    .maybeSingle()

  const oldBest = Number(progressRow?.best_score ?? 0)

  const { count: priorSubmissionCount, error: countErr } = await admin
    .from("coding_submissions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("problem_id", problem.id)

  if (countErr) {
    logger.error("[coding-submit] prior count", countErr)
  }
  const priorCount = priorSubmissionCount ?? 0

  const perTest: Array<{
    test: TestRow
    passed: boolean
    judgeStatusId: number
    stdout: string | null
    stderr: string | null
    compile_output: string | null
  }> = []

  let stoppedOnCompile = false
  const submitStartedAt = Date.now()

  const runSingleTest = async (test: TestRow) => {
    const tCpu = test.time_limit_ms != null ? Math.max(1, Math.ceil(test.time_limit_ms / 1000)) : defaultCpuSec
    const tMem = test.memory_limit_kb ?? defaultMemKb
    const j = await runJudge0PythonSubmission({
      sourceCode,
      stdin: test.stdin ?? "",
      cpuTimeSeconds: tCpu,
      memoryLimitKb: tMem,
    })
    const sid = j.status?.id ?? 0
    const accepted = sid === 3
    const outOk = accepted && judgeOutputMatches(test.expected_stdout ?? "", j.stdout)
    return {
      test,
      passed: outOk,
      judgeStatusId: sid,
      stdout: j.stdout,
      stderr: j.stderr,
      compile_output: j.compile_output,
    }
  }

  for (let offset = 0; offset < typedTests.length; offset += JUDGE0_SUBMIT_CONCURRENCY) {
    if (stoppedOnCompile) break

    const batch = typedTests.slice(offset, offset + JUDGE0_SUBMIT_CONCURRENCY)
    let batchResults: Awaited<ReturnType<typeof runSingleTest>>[]
    try {
      batchResults = await Promise.all(batch.map((test) => runSingleTest(test)))
    } catch (e) {
      logger.error("[coding-submit] Judge0", e)
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Serviciul de evaluare nu răspunde." },
        { status: 502 }
      )
    }

    for (const result of batchResults) {
      perTest.push(result)
      if (result.judgeStatusId === 6) {
        stoppedOnCompile = true
        break
      }
    }
  }

  logger.info(
    `[judge0.submit] ${Date.now() - submitStartedAt}ms tests=${typedTests.length} ran=${perTest.length} compileError=${stoppedOnCompile}`
  )

  const passedWeight = perTest
    .filter((p) => p.passed)
    .reduce((s, p) => s + testWeight(p.test), 0)

  const pct =
    totalWeight > 0
      ? Math.round(((100 * passedWeight) / totalWeight + Number.EPSILON) * 100) / 100
      : 0

  const aggStatus = aggregateSubmissionStatus(typedTests, perTest, stoppedOnCompile)
  const passedCount = perTest.filter((p) => p.passed).length

  const { data: submission, error: subInsErr } = await admin
    .from("coding_submissions")
    .insert({
      user_id: userId,
      problem_id: problem.id,
      status: aggStatus,
      score: pct,
      total_tests: typedTests.length,
      passed_tests: passedCount,
      judge0_submission_id: null,
      stdout: null,
      stderr: null,
      compile_output: null,
      time_ms: null,
      memory_kb: null,
    })
    .select("id")
    .single()

  if (subInsErr || !submission) {
    logger.error("[coding-submit] insert submission", subInsErr)
    return NextResponse.json({ error: "Nu am putut salva submisia." }, { status: 500 })
  }

  const submissionId = submission.id as string

  const testRows = perTest.map((p) => ({
    submission_id: submissionId,
    test_id: p.test.id,
    status: mapPerTestDbStatus(p.passed, p.judgeStatusId),
    score: p.passed ? testWeight(p.test) : 0,
    time_ms: null as number | null,
    memory_kb: null as number | null,
    stdout: p.test.is_sample ? p.stdout : null,
    stderr: p.test.is_sample ? p.stderr : null,
  }))

  const { error: stErr } = await admin.from("coding_submission_tests").insert(testRows)
  if (stErr) {
    logger.error("[coding-submit] insert submission tests", stErr)
  }

  const newBest = Math.round((Math.max(oldBest, pct) + Number.EPSILON) * 100) / 100

  let elo: EloRpcRow | null = null
  let eloError: string | null = null
  const { data: eloData, error: eloRpcErr } = await admin.rpc("apply_coding_problem_elo_delta", {
    p_user_id: userId,
    p_problem_id: problem.id,
    p_old_best: oldBest,
    p_new_best: newBest,
    p_prior_submission_count: priorCount,
  })

  if (eloRpcErr) {
    logger.error("[coding-submit] elo rpc", eloRpcErr)
    eloError = eloRpcErr.message
  } else {
    const row = (Array.isArray(eloData) ? eloData[0] : eloData) as EloRpcRow | undefined
    if (row) elo = row
  }

  return NextResponse.json({
    submissionId,
    status: aggStatus,
    scorePercent: pct,
    passedTests: passedCount,
    totalTests: typedTests.length,
    judge0PythonLanguageId: JUDGE0_PYTHON_LANGUAGE_ID,
    tests: perTest.map((p) => ({
      testId: p.test.id,
      orderIndex: p.test.order_index,
      isSample: p.test.is_sample,
      passed: p.passed,
      status: mapPerTestDbStatus(p.passed, p.judgeStatusId),
      stdin: p.test.is_sample ? p.test.stdin : undefined,
      expectedStdout: p.test.is_sample ? p.test.expected_stdout : undefined,
      stdout: p.test.is_sample ? p.stdout : undefined,
      stderr: p.test.is_sample ? p.stderr : undefined,
    })),
    elo: elo
      ? {
          previousElo: elo.previous_elo,
          newElo: elo.new_elo,
          delta: elo.delta_elo,
          oldBest: elo.old_best,
          newBest: elo.new_best,
          maxGain: elo.max_gain,
        }
      : null,
    eloError,
  })
}
