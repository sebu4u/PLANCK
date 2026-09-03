import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getActiveAnswerEntries } from "@/lib/quiz-question-utils"
import {
  formatLessonExerciseDifficulty,
  getLessonExerciseHref,
  getLessonExerciseKindLabel,
  type LessonExerciseContentType,
  type LessonExercisePublic,
} from "@/lib/lesson-exercises"
import { logger } from "@/lib/logger"
import type { QuizAnswers } from "@/lib/types/quiz-questions"

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase anon configuration.")
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type LessonExerciseRow = {
  id: string
  content_type: LessonExerciseContentType
  content_id: string
  order_index: number
}

function idsForType(rows: LessonExerciseRow[], type: LessonExerciseContentType): string[] {
  return [...new Set(rows.filter((row) => row.content_type === type).map((row) => row.content_id))]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const supabase = getAnonClient()

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle()

    if (lessonError) {
      logger.error("[physics/lessons/exercises] Failed to load lesson:", lessonError)
      return NextResponse.json({ error: "Nu am putut încărca exercițiile." }, { status: 500 })
    }
    if (!lesson) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { data: rows, error: rowsError } = await supabase
      .from("lesson_exercises")
      .select("id, content_type, content_id, order_index")
      .eq("lesson_id", id)
      .order("order_index", { ascending: true })

    if (rowsError) {
      logger.error("[physics/lessons/exercises] Failed to load rows:", rowsError)
      return NextResponse.json({ error: "Nu am putut încărca exercițiile." }, { status: 500 })
    }

    const exerciseRows = (rows || []) as LessonExerciseRow[]
    if (exerciseRows.length === 0) {
      return NextResponse.json(
        { exercises: [] as LessonExercisePublic[] },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
      )
    }

    const problemIds = idsForType(exerciseRows, "problem")
    const mathIds = idsForType(exerciseRows, "math_problem")
    const codingIds = idsForType(exerciseRows, "coding_problem")
    const grilaIds = idsForType(exerciseRows, "grila")

    const [problemsRes, mathRes, codingRes, grilaRes] = await Promise.all([
      problemIds.length
        ? supabase.from("problems").select("id, title, statement, difficulty, image_url").in("id", problemIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
      mathIds.length
        ? supabase
            .from("math_problems")
            .select("id, title, statement, difficulty, image_url, is_active")
            .in("id", mathIds)
            .eq("is_active", true)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
      codingIds.length
        ? supabase
            .from("coding_problems")
            .select("id, slug, title, statement_markdown, difficulty, is_active")
            .in("id", codingIds)
            .eq("is_active", true)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
      grilaIds.length
        ? supabase
            .from("quiz_questions")
            .select("id, title, question_id, statement, difficulty, answers, image_url, materie")
            .in("id", grilaIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    ])

    const firstError = problemsRes.error || mathRes.error || codingRes.error || grilaRes.error
    if (firstError) {
      logger.error("[physics/lessons/exercises] Failed to join catalogs:", firstError)
      return NextResponse.json({ error: "Nu am putut încărca exercițiile." }, { status: 500 })
    }

    const problemsById = new Map((problemsRes.data || []).map((row) => [String(row.id), row]))
    const mathById = new Map((mathRes.data || []).map((row) => [String(row.id), row]))
    const codingById = new Map((codingRes.data || []).map((row) => [String(row.id), row]))
    const grilaById = new Map((grilaRes.data || []).map((row) => [String(row.id), row]))

    const exercises: LessonExercisePublic[] = []

    for (const row of exerciseRows) {
      if (row.content_type === "problem") {
        const item = problemsById.get(row.content_id)
        if (!item) continue
        const href = getLessonExerciseHref({
          contentType: "problem",
          contentId: String(item.id),
        })
        if (!href) continue
        exercises.push({
          id: row.id,
          contentType: "problem",
          contentId: String(item.id),
          title: String(item.title ?? ""),
          statement: String(item.statement ?? ""),
          statementFormat: "latex",
          imageUrl: typeof item.image_url === "string" ? item.image_url : null,
          difficulty: formatLessonExerciseDifficulty("problem", item.difficulty),
          href,
          kindLabel: getLessonExerciseKindLabel("problem"),
        })
        continue
      }

      if (row.content_type === "math_problem") {
        const item = mathById.get(row.content_id)
        if (!item) continue
        const href = getLessonExerciseHref({
          contentType: "math_problem",
          contentId: String(item.id),
        })
        if (!href) continue
        exercises.push({
          id: row.id,
          contentType: "math_problem",
          contentId: String(item.id),
          title: String(item.title ?? ""),
          statement: String(item.statement ?? ""),
          statementFormat: "latex",
          imageUrl: typeof item.image_url === "string" ? item.image_url : null,
          difficulty: formatLessonExerciseDifficulty("math_problem", item.difficulty),
          href,
          kindLabel: getLessonExerciseKindLabel("math_problem"),
        })
        continue
      }

      if (row.content_type === "coding_problem") {
        const item = codingById.get(row.content_id)
        if (!item) continue
        const href = getLessonExerciseHref({
          contentType: "coding_problem",
          contentId: String(item.id),
          slug: typeof item.slug === "string" ? item.slug : null,
        })
        if (!href) continue
        exercises.push({
          id: row.id,
          contentType: "coding_problem",
          contentId: String(item.id),
          title: String(item.title ?? ""),
          statement: String(item.statement_markdown ?? ""),
          statementFormat: "markdown",
          difficulty: formatLessonExerciseDifficulty("coding_problem", item.difficulty),
          href,
          kindLabel: getLessonExerciseKindLabel("coding_problem"),
        })
        continue
      }

      const item = grilaById.get(row.content_id)
      if (!item) continue
      const href = getLessonExerciseHref({
        contentType: "grila",
        contentId: String(item.id),
        materie: typeof item.materie === "string" ? item.materie : null,
      })
      if (!href) continue
      const answers = getActiveAnswerEntries((item.answers || {}) as QuizAnswers).map(([key, text]) => ({
        key,
        text,
      }))
      const title =
        (typeof item.title === "string" && item.title.trim()) ||
        (typeof item.question_id === "string" && item.question_id.trim()) ||
        "Grilă"
      exercises.push({
        id: row.id,
        contentType: "grila",
        contentId: String(item.id),
        title,
        statement: String(item.statement ?? ""),
        statementFormat: "latex",
        imageUrl: typeof item.image_url === "string" ? item.image_url : null,
        difficulty: formatLessonExerciseDifficulty("grila", item.difficulty),
        href,
        kindLabel: getLessonExerciseKindLabel("grila"),
        answers,
      })
    }

    return NextResponse.json(
      { exercises },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    logger.error("[physics/lessons/exercises] GET error:", error)
    return NextResponse.json({ error: "Nu am putut încărca exercițiile." }, { status: 500 })
  }
}
