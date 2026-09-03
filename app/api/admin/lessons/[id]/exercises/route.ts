import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"
import {
  formatLessonExerciseDifficulty,
  isLessonExerciseContentType,
  LESSON_EXERCISE_CONTENT_TYPES,
  type LessonExerciseAdminItem,
  type LessonExerciseContentType,
} from "@/lib/lesson-exercises"

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
    return { error: NextResponse.json({ error: "Acces interzis. Doar adminii pot accesa această resursă." }, { status: 403 }) }
  }

  return { supabase, user: userData.user }
}

const putBodySchema = z.object({
  items: z
    .array(
      z.object({
        content_type: z.enum(LESSON_EXERCISE_CONTENT_TYPES),
        content_id: z.string().trim().min(1).max(120),
      }),
    )
    .max(50),
})

type LessonExerciseRow = {
  id: string
  content_type: string
  content_id: string
  order_index: number
}

function idsForType(rows: LessonExerciseRow[], type: LessonExerciseContentType): string[] {
  return [...new Set(rows.filter((row) => row.content_type === type).map((row) => row.content_id))]
}

async function resolveAdminItems(
  supabase: ReturnType<typeof createServerClientWithToken>,
  rows: LessonExerciseRow[],
): Promise<LessonExerciseAdminItem[]> {
  const typedRows = rows.filter((row): row is LessonExerciseRow & { content_type: LessonExerciseContentType } =>
    isLessonExerciseContentType(row.content_type),
  )

  const problemIds = idsForType(typedRows, "problem")
  const mathIds = idsForType(typedRows, "math_problem")
  const codingIds = idsForType(typedRows, "coding_problem")
  const grilaIds = idsForType(typedRows, "grila")

  const [problemsRes, mathRes, codingRes, grilaRes] = await Promise.all([
    problemIds.length
      ? supabase.from("problems").select("id, title, difficulty").in("id", problemIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    mathIds.length
      ? supabase.from("math_problems").select("id, title, difficulty").in("id", mathIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    codingIds.length
      ? supabase.from("coding_problems").select("id, title, difficulty, slug, display_id").in("id", codingIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    grilaIds.length
      ? supabase.from("quiz_questions").select("id, title, question_id, difficulty").in("id", grilaIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ])

  const firstError = problemsRes.error || mathRes.error || codingRes.error || grilaRes.error
  if (firstError) {
    throw firstError
  }

  const problemsById = new Map((problemsRes.data || []).map((row) => [String(row.id), row]))
  const mathById = new Map((mathRes.data || []).map((row) => [String(row.id), row]))
  const codingById = new Map((codingRes.data || []).map((row) => [String(row.id), row]))
  const grilaById = new Map((grilaRes.data || []).map((row) => [String(row.id), row]))

  return typedRows.map((row) => {
    if (row.content_type === "problem") {
      const item = problemsById.get(row.content_id)
      return {
        id: row.id,
        content_type: row.content_type,
        content_id: row.content_id,
        order_index: row.order_index,
        title: String(item?.title ?? row.content_id),
        difficulty: formatLessonExerciseDifficulty("problem", item?.difficulty),
      }
    }
    if (row.content_type === "math_problem") {
      const item = mathById.get(row.content_id)
      return {
        id: row.id,
        content_type: row.content_type,
        content_id: row.content_id,
        order_index: row.order_index,
        title: String(item?.title ?? row.content_id),
        difficulty: formatLessonExerciseDifficulty("math_problem", item?.difficulty),
      }
    }
    if (row.content_type === "coding_problem") {
      const item = codingById.get(row.content_id)
      const displayId = typeof item?.display_id === "string" ? item.display_id.trim() : ""
      const title = String(item?.title ?? row.content_id)
      return {
        id: row.id,
        content_type: row.content_type,
        content_id: row.content_id,
        order_index: row.order_index,
        title: displayId ? `${displayId} · ${title}` : title,
        difficulty: formatLessonExerciseDifficulty("coding_problem", item?.difficulty),
      }
    }
    const item = grilaById.get(row.content_id)
    const title =
      (typeof item?.title === "string" && item.title.trim()) ||
      (typeof item?.question_id === "string" && item.question_id.trim()) ||
      row.content_id
    return {
      id: row.id,
      content_type: row.content_type,
      content_id: row.content_id,
      order_index: row.order_index,
      title,
      difficulty: formatLessonExerciseDifficulty("grila", item?.difficulty),
    }
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const { supabase } = auth
    const { id } = await params

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (lessonError) {
      logger.error("[admin/lessons/exercises] Failed to load lesson:", lessonError)
      return NextResponse.json({ error: "Nu am putut încărca lecția." }, { status: 500 })
    }
    if (!lesson) {
      return NextResponse.json({ error: "Lecția nu există." }, { status: 404 })
    }

    const { data: rows, error: rowsError } = await supabase
      .from("lesson_exercises")
      .select("id, content_type, content_id, order_index")
      .eq("lesson_id", id)
      .order("order_index", { ascending: true })

    if (rowsError) {
      logger.error("[admin/lessons/exercises] Failed to load rows:", rowsError)
      return NextResponse.json({ error: "Nu am putut încărca exercițiile." }, { status: 500 })
    }

    const exercises = await resolveAdminItems(supabase, (rows || []) as LessonExerciseRow[])
    return NextResponse.json({ exercises })
  } catch (error) {
    logger.error("[admin/lessons/exercises] GET error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const { supabase } = auth
    const { id } = await params

    const parsed = putBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 })
    }

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (lessonError) {
      logger.error("[admin/lessons/exercises] Failed to load lesson:", lessonError)
      return NextResponse.json({ error: "Nu am putut încărca lecția." }, { status: 500 })
    }
    if (!lesson) {
      return NextResponse.json({ error: "Lecția nu există." }, { status: 404 })
    }

    const seen = new Set<string>()
    const uniqueItems = parsed.data.items.filter((item) => {
      const key = `${item.content_type}:${item.content_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const { error: deleteError } = await supabase.from("lesson_exercises").delete().eq("lesson_id", id)
    if (deleteError) {
      logger.error("[admin/lessons/exercises] Failed to replace rows:", deleteError)
      return NextResponse.json({ error: "Nu am putut salva exercițiile." }, { status: 500 })
    }

    if (uniqueItems.length > 0) {
      const { error: insertError } = await supabase.from("lesson_exercises").insert(
        uniqueItems.map((item, index) => ({
          lesson_id: id,
          content_type: item.content_type,
          content_id: item.content_id,
          order_index: index,
        })),
      )
      if (insertError) {
        logger.error("[admin/lessons/exercises] Failed to insert rows:", insertError)
        return NextResponse.json({ error: "Nu am putut salva exercițiile." }, { status: 500 })
      }
    }

    const { data: rows, error: rowsError } = await supabase
      .from("lesson_exercises")
      .select("id, content_type, content_id, order_index")
      .eq("lesson_id", id)
      .order("order_index", { ascending: true })

    if (rowsError) {
      logger.error("[admin/lessons/exercises] Failed to reload rows:", rowsError)
      return NextResponse.json({ error: "Exercițiile au fost salvate, dar nu am putut reîncărca lista." }, { status: 500 })
    }

    const exercises = await resolveAdminItems(supabase, (rows || []) as LessonExerciseRow[])
    return NextResponse.json({ success: true, exercises })
  } catch (error) {
    logger.error("[admin/lessons/exercises] PUT error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
