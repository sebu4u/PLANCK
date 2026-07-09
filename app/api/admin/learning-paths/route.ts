import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"
import { validateTestContent } from "@/lib/learning-path-test"
import {
  isInteractiveLessonItemType,
  validateInteractiveItemContent,
} from "@/lib/learning-path-interactive-items"
import { generateUniqueLessonSlug } from "@/lib/learning-path-slug"
import { normalizeLearningPathChapterAccentColor } from "@/lib/learning-path-chapter-theme"
import { parseAllowedDevUserIdsInput } from "@/lib/dev-chapter-access"
import { fetchAllTableRows } from "@/lib/supabase-fetch-all"

type AdminEntityType = "chapter" | "lesson" | "item"

const LESSON_TYPES = ["text", "video", "grila", "problem"] as const
const ITEM_TYPES = [
  "text",
  "video",
  "grila",
  "problem",
  "math_problem",
  "coding_problem",
  "poll",
  "custom_text",
  "simulation",
  "test",
  "card_sort",
  "fill_slot",
  "match",
  "graph_build",
  "code_trace",
  "swipe_classify",
  "flow_build",
  "slider_explore",
  "table_fill",
  "memory_flip",
  "speed_round",
  "reveal_steps",
] as const

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

function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.")
  }

  return createClient(url, serviceRoleKey)
}

type DbErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

function formatDbError(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown database error."
  const dbError = error as DbErrorLike
  const parts = [dbError.code, dbError.message, dbError.details, dbError.hint].filter(Boolean)
  return parts.join(" | ") || "Unknown database error."
}

function jsonLessonCreateError(error: unknown): NextResponse {
  const details = formatDbError(error)
  const db = error as DbErrorLike
  const combinedCheck = [String(db.message || ""), db.details, db.hint].filter(Boolean).join(" ")

  if (db.code === "PGRST204" && combinedCheck.includes("hub_show_nou_badge")) {
    return NextResponse.json(
      {
        error:
          "Coloana hub_show_nou_badge lipsește din baza de date. Aplică migrarea `20260529_learning_path_lesson_hub_nou_badge.sql` pe proiectul Supabase.",
        details,
      },
      { status: 500 }
    )
  }

  logger.error("[admin/learning-paths] Failed to create lesson:", details)
  return NextResponse.json({ error: "Nu am putut crea lecția.", details }, { status: 500 })
}

async function shiftItemOrderRange(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  lessonId: string,
  fromIndex: number,
  delta: 1 | -1,
  excludeItemId?: string
) {
  const comparator = delta === 1 ? "gte" : "gt"
  const { data: affectedRows, error: fetchErr } = await supabase
    .from("learning_path_lesson_items")
    .select("id, order_index")
    .eq("lesson_id", lessonId)
    [comparator]("order_index", fromIndex)
    .order("order_index", { ascending: delta === -1 })

  if (fetchErr) {
    throw new Error(`Failed to fetch affected order rows: ${formatDbError(fetchErr)}`)
  }

  const rows = (affectedRows || []).filter((row) => row.id !== excludeItemId)
  for (const row of rows) {
    const { error } = await supabase
      .from("learning_path_lesson_items")
      .update({ order_index: row.order_index + delta, updated_at: new Date().toISOString() })
      .eq("id", row.id)
    if (error) {
      throw new Error(`Failed to shift item order_index: ${formatDbError(error)}`)
    }
  }
}

async function shiftItemOrderBand(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  lessonId: string,
  minIndex: number,
  maxIndex: number,
  delta: 1 | -1,
  excludeItemId?: string
) {
  const { data: affectedRows, error: fetchErr } = await supabase
    .from("learning_path_lesson_items")
    .select("id, order_index")
    .eq("lesson_id", lessonId)
    .gte("order_index", minIndex)
    .lte("order_index", maxIndex)
    .order("order_index", { ascending: delta === -1 })

  if (fetchErr) {
    throw new Error(`Failed to fetch affected order band: ${formatDbError(fetchErr)}`)
  }

  const rows = (affectedRows || []).filter((row) => row.id !== excludeItemId)
  for (const row of rows) {
    const { error } = await supabase
      .from("learning_path_lesson_items")
      .update({ order_index: row.order_index + delta, updated_at: new Date().toISOString() })
      .eq("id", row.id)
    if (error) {
      throw new Error(`Failed to shift item order band: ${formatDbError(error)}`)
    }
  }
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

function toAccentColor(value: unknown): string | null {
  if (value === null) return null
  return normalizeLearningPathChapterAccentColor(toNullableString(value))
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

async function validateAllowedDevUserIds(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  ids: string[] | null
): Promise<string | null> {
  if (!ids || ids.length === 0) return null
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("is_dev", true)
    .in("user_id", ids)
  if (error) return "Nu am putut valida utilizatorii dev."
  if ((data?.length ?? 0) !== ids.length) {
    return "Unul sau mai mulți useri selectați nu sunt conturi dev."
  }
  return null
}

function toInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value)
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function parseAdminEntityType(value: unknown): AdminEntityType | null {
  if (value === "chapter" || value === "lesson" || value === "item") return value
  return null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isValidSimulationUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === "https:") return true
    const isLocalDev = process.env.NODE_ENV !== "production"
    const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
    return isLocalDev && isLocalHost && parsed.protocol === "http:"
  } catch {
    return false
  }
}

function validateItemBody(itemType: string, body: Record<string, unknown>) {
  if (itemType === "text" && !toNullableString(body.cursuri_lesson_slug)) {
    return "Pentru item de tip text, câmpul cursuri_lesson_slug este obligatoriu."
  }
  if (itemType === "video" && !toNullableString(body.youtube_url)) {
    return "Pentru item de tip video, câmpul youtube_url este obligatoriu."
  }
  if (itemType === "grila" && !toNullableString(body.quiz_question_id)) {
    return "Pentru item de tip grila, câmpul quiz_question_id este obligatoriu."
  }
  if (itemType === "problem" && !toNullableString(body.problem_id)) {
    return "Pentru item de tip problem, câmpul problem_id este obligatoriu."
  }
  if (itemType === "math_problem" && !toNullableString(body.problem_id)) {
    return "Pentru item de tip math_problem, câmpul problem_id este obligatoriu."
  }
  if (itemType === "coding_problem" && !toNullableString(body.problem_id)) {
    return "Pentru item de tip coding_problem, câmpul problem_id este obligatoriu."
  }

  if (itemType === "custom_text") {
    const content = body.content_json
    if (!isObject(content) || !toNullableString(content.body)) {
      return "Pentru item de tip custom_text, content_json.body este obligatoriu."
    }
  }

  if (itemType === "simulation") {
    const content = body.content_json
    const embedUrl = isObject(content) ? toNullableString(content.embedUrl) : null
    if (!embedUrl || !isValidSimulationUrl(embedUrl)) {
      return "Pentru item de tip simulation, content_json.embedUrl trebuie să fie HTTPS valid (sau http://localhost în development)."
    }
  }

  if (itemType === "poll" && !isObject(body.content_json)) {
    return "Pentru item de tip poll, content_json este obligatoriu."
  }

  if (itemType === "test") {
    if (!isObject(body.content_json)) {
      return "Pentru item de tip test, content_json este obligatoriu."
    }
    const testError = validateTestContent(body.content_json)
    if (testError) return testError
  }

  if (isInteractiveLessonItemType(itemType)) {
    if (!isObject(body.content_json)) {
      return "Pentru itemele interactive, content_json (JSON) este obligatoriu."
    }
    return validateInteractiveItemContent(itemType, body.content_json)
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const supabase = createAdminSupabaseClient()

    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    if (action === "quiz-questions") {
      const search = (searchParams.get("search") || "").trim()
      const classParam = (searchParams.get("class") || "").trim()
      const materieParam = (searchParams.get("materie") || "").trim()

      let query = supabase
        .from("quiz_questions")
        .select("id, question_id, class, statement, title, difficulty, correct_answer, correct_answers, materie, created_at")
        .order("created_at", { ascending: false })
        .limit(60)

      if (materieParam === "biologie") {
        query = query.eq("materie", "biologie")
      } else if (materieParam === "fizica") {
        query = query.or("materie.eq.fizica,materie.is.null")
      }

      if (search) {
        const escaped = search.replace(/[%_]/g, "")
        query = query.or(`statement.ilike.%${escaped}%,question_id.ilike.%${escaped}%,title.ilike.%${escaped}%`)
      }

      if (classParam) {
        const classValue = Number.parseInt(classParam, 10)
        if (Number.isFinite(classValue)) {
          query = query.eq("class", classValue)
        }
      }

      const { data: quizQuestions, error: quizError } = await query
      if (quizError) {
        logger.error("[admin/learning-paths] Failed to fetch quiz questions:", quizError)
        return NextResponse.json({ error: "Nu am putut încărca întrebările grilă." }, { status: 500 })
      }

      return NextResponse.json({ quizQuestions: quizQuestions || [] })
    }

    if (action === "lesson-items-search") {
      const search = (searchParams.get("search") || "").trim()
      const itemTypeParam = (searchParams.get("item_type") || "").trim()
      const chapterId = (searchParams.get("chapter_id") || "").trim()
      const excludeLessonId = (searchParams.get("exclude_lesson_id") || "").trim()

      let lessonIdsFilter: string[] | null = null
      if (chapterId) {
        const { data: chapterLessons, error: chapterLessonsErr } = await supabase
          .from("learning_path_lessons")
          .select("id")
          .eq("chapter_id", chapterId)
        if (chapterLessonsErr) {
          logger.error("[admin/learning-paths] Failed to resolve chapter lessons:", chapterLessonsErr)
          return NextResponse.json({ error: "Nu am putut filtra după traseu." }, { status: 500 })
        }
        lessonIdsFilter = (chapterLessons || []).map((row) => row.id)
        if (lessonIdsFilter.length === 0) {
          return NextResponse.json({ items: [] })
        }
      }

      let query = supabase
        .from("learning_path_lesson_items")
        .select(
          "id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json, order_index, is_active, created_at, learning_path_lessons(title, slug, chapter_id, learning_path_chapters(title, slug))"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50)

      if (itemTypeParam && ITEM_TYPES.includes(itemTypeParam as (typeof ITEM_TYPES)[number])) {
        query = query.eq("item_type", itemTypeParam)
      }
      if (lessonIdsFilter) {
        query = query.in("lesson_id", lessonIdsFilter)
      }
      if (excludeLessonId) {
        query = query.neq("lesson_id", excludeLessonId)
      }
      if (search) {
        const escaped = search.replace(/[%_]/g, "")
        query = query.or(`title.ilike.%${escaped}%,cursuri_lesson_slug.ilike.%${escaped}%`)
      }

      const { data: lessonItems, error: lessonItemsErr } = await query
      if (lessonItemsErr) {
        logger.error("[admin/learning-paths] Failed to search lesson items:", lessonItemsErr)
        return NextResponse.json({ error: "Nu am putut căuta itemii existenți." }, { status: 500 })
      }

      return NextResponse.json({ items: lessonItems || [] })
    }

    const { data: chapters, error: chaptersErr } = await fetchAllTableRows(async (range) =>
      supabase
        .from("learning_path_chapters")
        .select("*")
        .order("order_index", { ascending: true })
        .order("id", { ascending: true })
        .range(range.from, range.to)
    )

    if (chaptersErr) {
      logger.error("[admin/learning-paths] Failed to fetch chapters:", chaptersErr)
      return NextResponse.json({ error: "Nu am putut încărca capitolele de learning path." }, { status: 500 })
    }

    const { data: lessons, error: lessonsErr } = await fetchAllTableRows(async (range) =>
      supabase
        .from("learning_path_lessons")
        .select("*")
        .order("order_index", { ascending: true })
        .order("id", { ascending: true })
        .range(range.from, range.to)
    )

    if (lessonsErr) {
      logger.error("[admin/learning-paths] Failed to fetch lessons:", lessonsErr)
      return NextResponse.json({ error: "Nu am putut încărca lecțiile de learning path." }, { status: 500 })
    }

    const { data: items, error: itemsErr } = await fetchAllTableRows(async (range) =>
      supabase
        .from("learning_path_lesson_items")
        .select("*")
        .order("order_index", { ascending: true })
        .order("id", { ascending: true })
        .range(range.from, range.to)
    )

    if (itemsErr) {
      logger.error("[admin/learning-paths] Failed to fetch lesson items:", itemsErr)
      return NextResponse.json({ error: "Nu am putut încărca itemii lecțiilor." }, { status: 500 })
    }

    return NextResponse.json({
      chapters,
      lessons,
      items,
    })
  } catch (err: any) {
    logger.error("[admin/learning-paths] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const supabase = createAdminSupabaseClient()

    const body = await req.json()
    const type = parseAdminEntityType(body?.type)
    if (!type) {
      return NextResponse.json({ error: "Tip invalid. Folosește 'chapter', 'lesson' sau 'item'." }, { status: 400 })
    }

    if (type === "chapter") {
      const title = toNullableString(body.title)
      if (!title) return NextResponse.json({ error: "title este obligatoriu." }, { status: 400 })

      const accentColor = body.accent_color === undefined ? null : toAccentColor(body.accent_color)
      if (body.accent_color !== undefined && body.accent_color !== null && accentColor === null) {
        return NextResponse.json(
          { error: "accent_color trebuie să fie un cod hex valid (ex. #7c3aed)." },
          { status: 400 }
        )
      }

      const allowedDevUserIds =
        body.allowed_dev_user_ids !== undefined
          ? parseAllowedDevUserIdsInput(body.allowed_dev_user_ids)
          : null
      if (body.allowed_dev_user_ids !== undefined && body.allowed_dev_user_ids !== null && allowedDevUserIds === null) {
        return NextResponse.json({ error: "allowed_dev_user_ids conține ID-uri invalide." }, { status: 400 })
      }
      const devIdsError = await validateAllowedDevUserIds(supabase, allowedDevUserIds)
      if (devIdsError) {
        return NextResponse.json({ error: devIdsError }, { status: 400 })
      }

      const payload = {
        title,
        nav_title: toNullableString(body.nav_title),
        slug: toNullableString(body.slug),
        description: toNullableString(body.description),
        icon_url: toNullableString(body.icon_url),
        accent_color: accentColor,
        problem_category: toNullableString(body.problem_category),
        allowed_dev_user_ids: allowedDevUserIds && allowedDevUserIds.length > 0 ? allowedDevUserIds : null,
        order_index: toInt(body.order_index, 0),
        is_active: toBoolean(body.is_active, true),
      }

      const { data, error } = await supabase.from("learning_path_chapters").insert(payload).select().single()
      if (error) {
        logger.error("[admin/learning-paths] Failed to create chapter:", error)
        return NextResponse.json({ error: "Nu am putut crea capitolul." }, { status: 500 })
      }
      return NextResponse.json({ success: true, chapter: data })
    }

    if (type === "lesson") {
      const chapterId = toNullableString(body.chapter_id)
      const title = toNullableString(body.title)
      if (!chapterId || !title) {
        return NextResponse.json({ error: "chapter_id și title sunt obligatorii." }, { status: 400 })
      }

      const lessonType = toNullableString(body.lesson_type) || "text"
      if (!LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) {
        return NextResponse.json({ error: "lesson_type invalid." }, { status: 400 })
      }

      const requestedLessonSlug = toNullableString(body.slug)
      const lessonSlug =
        requestedLessonSlug ||
        (await generateUniqueLessonSlug(supabase, chapterId, title))

      const payload = {
        chapter_id: chapterId,
        slug: lessonSlug,
        title,
        description: toNullableString(body.description),
        image_url: toNullableString(body.image_url),
        lesson_type: lessonType,
        cursuri_lesson_slug: toNullableString(body.cursuri_lesson_slug),
        youtube_url: toNullableString(body.youtube_url),
        quiz_question_id: toNullableString(body.quiz_question_id),
        problem_id: toNullableString(body.problem_id),
        order_index: toInt(body.order_index, 0),
        is_active: toBoolean(body.is_active, true),
      }

      const { data, error } = await supabase.from("learning_path_lessons").insert(payload).select().single()
      if (error) {
        return jsonLessonCreateError(error)
      }
      return NextResponse.json({ success: true, lesson: data })
    }

    const lessonId = toNullableString(body.lesson_id)
    const itemType = toNullableString(body.item_type)
    if (!lessonId || !itemType) {
      return NextResponse.json({ error: "lesson_id și item_type sunt obligatorii." }, { status: 400 })
    }

    if (!ITEM_TYPES.includes(itemType as (typeof ITEM_TYPES)[number])) {
      return NextResponse.json({ error: "item_type invalid." }, { status: 400 })
    }

    const validationError = validateItemBody(itemType, body as Record<string, unknown>)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (itemType === "math_problem") {
      const mid = toNullableString(body.problem_id)
      if (mid) {
        const { data: mathRow, error: mErr } = await supabase
          .from("math_problems")
          .select("id, is_active")
          .eq("id", mid)
          .maybeSingle()
        if (mErr || !mathRow) {
          return NextResponse.json({ error: "Problema de matematică nu există în catalog." }, { status: 400 })
        }
        if (!mathRow.is_active) {
          return NextResponse.json({ error: "Problema de matematică nu este activă." }, { status: 400 })
        }
      }
    }

    if (itemType === "coding_problem") {
      const cid = toNullableString(body.problem_id)
      if (cid) {
        const { data: codingRow, error: cErr } = await supabase
          .from("coding_problems")
          .select("id, is_active")
          .eq("id", cid)
          .maybeSingle()
        if (cErr || !codingRow) {
          return NextResponse.json({ error: "Problema de informatică nu există în catalog." }, { status: 400 })
        }
        if (!codingRow.is_active) {
          return NextResponse.json({ error: "Problema de informatică nu este activă." }, { status: 400 })
        }
      }
    }

    const requestedOrderIndex = toInt(body.order_index, 0)
    const payload = {
      lesson_id: lessonId,
      item_type: itemType,
      title: toNullableString(body.title),
      cursuri_lesson_slug: toNullableString(body.cursuri_lesson_slug),
      youtube_url: toNullableString(body.youtube_url),
      quiz_question_id: toNullableString(body.quiz_question_id),
      problem_id: toNullableString(body.problem_id),
      content_json: isObject(body.content_json) ? body.content_json : null,
      order_index: requestedOrderIndex,
      is_active: toBoolean(body.is_active, true),
    }

    await shiftItemOrderRange(supabase, lessonId, requestedOrderIndex, 1)

    const { data, error } = await supabase.from("learning_path_lesson_items").insert(payload).select().single()
    if (error) {
      logger.error("[admin/learning-paths] Failed to create lesson item:", formatDbError(error))
      return NextResponse.json({ error: "Nu am putut crea itemul." }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (err: any) {
    logger.error("[admin/learning-paths] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const supabase = createAdminSupabaseClient()

    const body = await req.json()
    const type = parseAdminEntityType(body?.type)
    const id = toNullableString(body?.id)
    if (!type || !id) {
      return NextResponse.json({ error: "type și id sunt obligatorii." }, { status: 400 })
    }

    if (type === "chapter") {
      const updateData: Record<string, unknown> = {}
      if (body.title !== undefined) updateData.title = toNullableString(body.title)
      if (body.nav_title !== undefined) updateData.nav_title = toNullableString(body.nav_title)
      if (body.slug !== undefined) updateData.slug = toNullableString(body.slug)
      if (body.description !== undefined) updateData.description = toNullableString(body.description)
      if (body.icon_url !== undefined) updateData.icon_url = toNullableString(body.icon_url)
      if (body.accent_color !== undefined) {
        const accentColor = toAccentColor(body.accent_color)
        if (body.accent_color !== null && accentColor === null) {
          return NextResponse.json(
            { error: "accent_color trebuie să fie un cod hex valid (ex. #7c3aed)." },
            { status: 400 }
          )
        }
        updateData.accent_color = accentColor
      }
      if (body.problem_category !== undefined) updateData.problem_category = toNullableString(body.problem_category)
      if (body.allowed_dev_user_ids !== undefined) {
        const allowedDevUserIds = parseAllowedDevUserIdsInput(body.allowed_dev_user_ids)
        if (body.allowed_dev_user_ids !== null && allowedDevUserIds === null) {
          return NextResponse.json({ error: "allowed_dev_user_ids conține ID-uri invalide." }, { status: 400 })
        }
        const devIdsError = await validateAllowedDevUserIds(supabase, allowedDevUserIds)
        if (devIdsError) {
          return NextResponse.json({ error: devIdsError }, { status: 400 })
        }
        updateData.allowed_dev_user_ids =
          allowedDevUserIds && allowedDevUserIds.length > 0 ? allowedDevUserIds : null
      }
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
      if (body.is_hidden !== undefined) updateData.is_hidden = toBoolean(body.is_hidden, false)
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("learning_path_chapters")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
      if (error) {
        logger.error("[admin/learning-paths] Failed to update chapter:", error)
        return NextResponse.json({ error: "Nu am putut actualiza capitolul." }, { status: 500 })
      }
      return NextResponse.json({ success: true, chapter: data })
    }

    if (type === "lesson") {
      const updateData: Record<string, unknown> = {}
      if (body.chapter_id !== undefined) updateData.chapter_id = toNullableString(body.chapter_id)
      if (body.slug !== undefined) updateData.slug = toNullableString(body.slug)
      if (body.title !== undefined) updateData.title = toNullableString(body.title)
      if (body.description !== undefined) updateData.description = toNullableString(body.description)
      if (body.image_url !== undefined) updateData.image_url = toNullableString(body.image_url)
      if (body.lesson_type !== undefined) {
        const lessonType = toNullableString(body.lesson_type)
        if (!lessonType || !LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) {
          return NextResponse.json({ error: "lesson_type invalid." }, { status: 400 })
        }
        updateData.lesson_type = lessonType
      }
      if (body.cursuri_lesson_slug !== undefined) updateData.cursuri_lesson_slug = toNullableString(body.cursuri_lesson_slug)
      if (body.youtube_url !== undefined) updateData.youtube_url = toNullableString(body.youtube_url)
      if (body.quiz_question_id !== undefined) updateData.quiz_question_id = toNullableString(body.quiz_question_id)
      if (body.problem_id !== undefined) updateData.problem_id = toNullableString(body.problem_id)
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
      if (body.hub_show_nou_badge !== undefined) {
        updateData.hub_show_nou_badge = toBoolean(body.hub_show_nou_badge, false)
      }
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("learning_path_lessons")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
      if (error) {
        logger.error("[admin/learning-paths] Failed to update lesson:", error)
        return NextResponse.json({ error: "Nu am putut actualiza lecția." }, { status: 500 })
      }
      return NextResponse.json({ success: true, lesson: data })
    }

    const updateData: Record<string, unknown> = {}
    if (body.lesson_id !== undefined) updateData.lesson_id = toNullableString(body.lesson_id)
    if (body.item_type !== undefined) {
      const itemType = toNullableString(body.item_type)
      if (!itemType || !ITEM_TYPES.includes(itemType as (typeof ITEM_TYPES)[number])) {
        return NextResponse.json({ error: "item_type invalid." }, { status: 400 })
      }
      const validationError = validateItemBody(itemType, body as Record<string, unknown>)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
      updateData.item_type = itemType
    }

    if (body.title !== undefined) updateData.title = toNullableString(body.title)
    if (body.cursuri_lesson_slug !== undefined) updateData.cursuri_lesson_slug = toNullableString(body.cursuri_lesson_slug)
    if (body.youtube_url !== undefined) updateData.youtube_url = toNullableString(body.youtube_url)
    if (body.quiz_question_id !== undefined) updateData.quiz_question_id = toNullableString(body.quiz_question_id)
    if (body.problem_id !== undefined) updateData.problem_id = toNullableString(body.problem_id)
    if (body.content_json !== undefined) updateData.content_json = isObject(body.content_json) ? body.content_json : null
    const nextOrderIndex = body.order_index !== undefined ? toInt(body.order_index, 0) : undefined
    if (body.order_index !== undefined) updateData.order_index = nextOrderIndex
    if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
    updateData.updated_at = new Date().toISOString()

    const { data: currentItem, error: currentItemErr } = await supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, order_index, item_type, problem_id")
      .eq("id", id)
      .single()
    if (currentItemErr || !currentItem) {
      logger.error("[admin/learning-paths] Failed to fetch lesson item before update:", formatDbError(currentItemErr))
      return NextResponse.json({ error: "Itemul nu există sau nu poate fi citit." }, { status: 404 })
    }

    const effectiveItemType = (updateData.item_type as string | undefined) ?? currentItem.item_type
    const effectiveProblemId =
      body.problem_id !== undefined ? toNullableString(body.problem_id) : currentItem.problem_id

    if (effectiveItemType === "math_problem" && effectiveProblemId) {
      const { data: mathRow, error: mErr } = await supabase
        .from("math_problems")
        .select("id, is_active")
        .eq("id", effectiveProblemId)
        .maybeSingle()
      if (mErr || !mathRow) {
        return NextResponse.json({ error: "Problema de matematică nu există în catalog." }, { status: 400 })
      }
      if (!mathRow.is_active) {
        return NextResponse.json({ error: "Problema de matematică nu este activă." }, { status: 400 })
      }
    }

    if (effectiveItemType === "coding_problem" && effectiveProblemId) {
      const { data: codingRow, error: cErr } = await supabase
        .from("coding_problems")
        .select("id, is_active")
        .eq("id", effectiveProblemId)
        .maybeSingle()
      if (cErr || !codingRow) {
        return NextResponse.json({ error: "Problema de informatică nu există în catalog." }, { status: 400 })
      }
      if (!codingRow.is_active) {
        return NextResponse.json({ error: "Problema de informatică nu este activă." }, { status: 400 })
      }
    }

    const targetLessonId =
      typeof updateData.lesson_id === "string" && updateData.lesson_id.trim() ? updateData.lesson_id : currentItem.lesson_id
    const hasOrderChange = typeof nextOrderIndex === "number" && Number.isFinite(nextOrderIndex)
    const targetOrderIndex = hasOrderChange ? nextOrderIndex! : currentItem.order_index

    if (targetLessonId !== currentItem.lesson_id || targetOrderIndex !== currentItem.order_index) {
      const { data: maxOrderRows, error: maxOrderErr } = await supabase
        .from("learning_path_lesson_items")
        .select("order_index")
        .eq("lesson_id", currentItem.lesson_id)
        .order("order_index", { ascending: false })
        .limit(1)
      if (maxOrderErr) {
        logger.error("[admin/learning-paths] Failed to compute temporary order index:", formatDbError(maxOrderErr))
        return NextResponse.json({ error: "Nu am putut reordona itemul (pas 1)." }, { status: 500 })
      }

      const tempOrderIndex = (maxOrderRows?.[0]?.order_index ?? 0) + 1000
      const { error: tempMoveErr } = await supabase
        .from("learning_path_lesson_items")
        .update({ order_index: tempOrderIndex, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (tempMoveErr) {
        logger.error("[admin/learning-paths] Failed to move item to temporary index:", formatDbError(tempMoveErr))
        return NextResponse.json({ error: "Nu am putut reordona itemul (pas 2)." }, { status: 500 })
      }

      try {
        if (targetLessonId === currentItem.lesson_id) {
          if (targetOrderIndex > currentItem.order_index) {
            await shiftItemOrderBand(supabase, currentItem.lesson_id, currentItem.order_index + 1, targetOrderIndex, -1, id)
          } else {
            await shiftItemOrderBand(supabase, currentItem.lesson_id, targetOrderIndex, currentItem.order_index - 1, 1, id)
          }
        } else {
          await shiftItemOrderBand(
            supabase,
            currentItem.lesson_id,
            currentItem.order_index + 1,
            Number.MAX_SAFE_INTEGER,
            -1,
            id
          )
          await shiftItemOrderRange(supabase, targetLessonId, targetOrderIndex, 1, id)
        }
      } catch (reorderErr: any) {
        logger.error("[admin/learning-paths] Failed during reorder operation:", reorderErr?.message || reorderErr)
        return NextResponse.json({ error: "Nu am putut reordona itemul." }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from("learning_path_lesson_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      logger.error("[admin/learning-paths] Failed to update lesson item:", formatDbError(error))
      return NextResponse.json({ error: "Nu am putut actualiza itemul." }, { status: 500 })
    }
    return NextResponse.json({ success: true, item: data })
  } catch (err: any) {
    logger.error("[admin/learning-paths] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const supabase = createAdminSupabaseClient()

    const { searchParams } = new URL(req.url)
    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const type = parseAdminEntityType(body.type ?? searchParams.get("type"))
    const id = toNullableString(body.id ?? searchParams.get("id"))
    const hardDelete = (body.hard ?? searchParams.get("hard")) === true || (body.hard ?? searchParams.get("hard")) === "true"

    if (!type || !id) {
      return NextResponse.json({ error: "type și id sunt obligatorii." }, { status: 400 })
    }

    if (type === "item" && !hardDelete) {
      const { data, error } = await supabase
        .from("learning_path_lesson_items")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        logger.error("[admin/learning-paths] Failed to soft-delete lesson item:", error)
        return NextResponse.json({ error: "Nu am putut dezactiva itemul." }, { status: 500 })
      }

      return NextResponse.json({ success: true, item: data, mode: "soft" })
    }

    const tableByType: Record<AdminEntityType, string> = {
      chapter: "learning_path_chapters",
      lesson: "learning_path_lessons",
      item: "learning_path_lesson_items",
    }

    const { error } = await supabase.from(tableByType[type]).delete().eq("id", id)
    if (error) {
      logger.error("[admin/learning-paths] Failed to hard-delete row:", error)
      return NextResponse.json({ error: "Nu am putut șterge elementul." }, { status: 500 })
    }

    return NextResponse.json({ success: true, mode: "hard" })
  } catch (err: any) {
    logger.error("[admin/learning-paths] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
