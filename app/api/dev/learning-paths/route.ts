import { NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { validateTestContent } from "@/lib/learning-path-test"
import {
  isInteractiveLessonItemType,
  validateInteractiveItemContent,
} from "@/lib/learning-path-interactive-items"
import { requireDevSession } from "@/lib/dev-api-session"
import { INFORMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-informatica"
import { isPhysicsCatalogCategory } from "@/lib/physics-catalog-chapters"

type AdminEntityType = "chapter" | "lesson" | "item"
type DevSubject = "physics" | "informatics"

const LESSON_TYPES = ["text", "video", "grila", "problem"] as const
const ITEM_TYPES = [
  "text",
  "video",
  "grila",
  "problem",
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

function createServiceClient(): SupabaseClient {
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

async function shiftItemOrderRange(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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

async function getChapterForLesson(
  supabase: SupabaseClient,
  lessonId: string
): Promise<{ id: string; problem_category: string | null } | null> {
  const { data: lesson, error: lErr } = await supabase
    .from("learning_path_lessons")
    .select("chapter_id")
    .eq("id", lessonId)
    .maybeSingle()
  if (lErr || !lesson?.chapter_id) return null
  const { data: chapter, error: cErr } = await supabase
    .from("learning_path_chapters")
    .select("id, problem_category")
    .eq("id", lesson.chapter_id)
    .maybeSingle()
  if (cErr || !chapter) return null
  return chapter as { id: string; problem_category: string | null }
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
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

function parseSubject(raw: string | null): DevSubject | null {
  const s = raw?.trim()
  if (s === "physics" || s === "informatics") return s
  return null
}

function chapterVisibleForSubject(
  chapter: { problem_category: string | null },
  subject: DevSubject
): boolean {
  const pc = chapter.problem_category?.trim() || null
  if (subject === "informatics") {
    return pc === INFORMATICA_LEARNING_PATH_MARKER
  }
  return pc !== INFORMATICA_LEARNING_PATH_MARKER
}

/**
 * GET ?subject=physics|informatics — structură filtrată (doar citire).
 * GET ?subject=...&action=quiz-questions — pentru itemi grilă (ca admin).
 * POST — creare capitol/lecție/item.
 * PUT — actualizare / reordonare (fără DELETE).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const subject = parseSubject(searchParams.get("subject"))
    if (!subject) {
      return NextResponse.json({ error: "Parametrul subject trebuie să fie physics sau informatics." }, { status: 400 })
    }

    const supabase = createServiceClient()
    const action = searchParams.get("action")

    if (action === "quiz-questions") {
      const search = (searchParams.get("search") || "").trim()
      const classParam = (searchParams.get("class") || "").trim()

      let query = supabase
        .from("quiz_questions")
        .select("id, question_id, class, statement, difficulty, correct_answer, created_at")
        .order("created_at", { ascending: false })
        .limit(60)

      if (search) {
        const escaped = search.replace(/[%_]/g, "")
        query = query.or(`statement.ilike.%${escaped}%,question_id.ilike.%${escaped}%`)
      }

      if (classParam) {
        const classValue = Number.parseInt(classParam, 10)
        if (Number.isFinite(classValue)) {
          query = query.eq("class", classValue)
        }
      }

      const { data: quizQuestions, error: quizError } = await query
      if (quizError) {
        logger.error("[dev/learning-paths] quiz questions:", quizError)
        return NextResponse.json({ error: "Nu am putut încărca întrebările grilă." }, { status: 500 })
      }

      return NextResponse.json({ quizQuestions: quizQuestions || [] })
    }

    const { data: allChapters, error: chaptersErr } = await supabase
      .from("learning_path_chapters")
      .select("*")
      .order("order_index")

    if (chaptersErr) {
      logger.error("[dev/learning-paths] chapters:", chaptersErr)
      return NextResponse.json({ error: "Nu am putut încărca capitolele." }, { status: 500 })
    }

    const chapters = (allChapters || []).filter((c) => chapterVisibleForSubject(c, subject))
    const chapterIds = new Set(chapters.map((c) => c.id))

    const { data: allLessons, error: lessonsErr } = await supabase
      .from("learning_path_lessons")
      .select("*")
      .order("order_index")

    if (lessonsErr) {
      logger.error("[dev/learning-paths] lessons:", lessonsErr)
      return NextResponse.json({ error: "Nu am putut încărca lecțiile." }, { status: 500 })
    }

    const lessons = (allLessons || []).filter((l) => chapterIds.has(l.chapter_id))
    const lessonIds = new Set(lessons.map((l) => l.id))

    const { data: allItems, error: itemsErr } = await supabase
      .from("learning_path_lesson_items")
      .select("*")
      .order("order_index")

    if (itemsErr) {
      logger.error("[dev/learning-paths] items:", itemsErr)
      return NextResponse.json({ error: "Nu am putut încărca itemii." }, { status: 500 })
    }

    const items = (allItems || []).filter((it) => lessonIds.has(it.lesson_id))

    return NextResponse.json({
      chapters,
      lessons,
      items,
    })
  } catch (err) {
    logger.error("[dev/learning-paths] GET:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const subject = parseSubject(typeof body.subject === "string" ? body.subject : null)
    if (!subject) {
      return NextResponse.json({ error: "subject în body trebuie să fie physics sau informatics." }, { status: 400 })
    }

    const supabase = createServiceClient()
    const type = parseAdminEntityType(body?.type)
    if (!type) {
      return NextResponse.json({ error: "Tip invalid. Folosește 'chapter', 'lesson' sau 'item'." }, { status: 400 })
    }

    if (type === "chapter") {
      const title = toNullableString(body.title)
      if (!title) return NextResponse.json({ error: "title este obligatoriu." }, { status: 400 })

      let problem_category: string | null
      if (subject === "informatics") {
        problem_category = INFORMATICA_LEARNING_PATH_MARKER
      } else {
        const rawPc = toNullableString(body.problem_category)
        if (rawPc === INFORMATICA_LEARNING_PATH_MARKER) {
          return NextResponse.json({ error: "Capitolele de fizică nu pot folosi marcatorul de informatică." }, { status: 400 })
        }
        if (!rawPc) {
          problem_category = null
        } else if (isPhysicsCatalogCategory(rawPc)) {
          problem_category = rawPc
        } else {
          return NextResponse.json(
            { error: "problem_category trebuie lăsat gol sau să fie un capitol valid din catalogul de fizică." },
            { status: 400 }
          )
        }
      }

      const payload = {
        title,
        slug: toNullableString(body.slug),
        description: toNullableString(body.description),
        icon_url: toNullableString(body.icon_url),
        problem_category,
        order_index: toInt(body.order_index, 0),
        is_active: toBoolean(body.is_active, true),
      }

      const { data, error } = await supabase.from("learning_path_chapters").insert(payload).select().single()
      if (error) {
        logger.error("[dev/learning-paths] create chapter:", error)
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

      const { data: chapterRow, error: chErr } = await supabase
        .from("learning_path_chapters")
        .select("id, problem_category")
        .eq("id", chapterId)
        .maybeSingle()

      if (chErr || !chapterRow) {
        return NextResponse.json({ error: "Capitolul nu există." }, { status: 404 })
      }

      if (!chapterVisibleForSubject(chapterRow, subject)) {
        return NextResponse.json({ error: "Capitolul nu aparține domeniului selectat (fizică / informatică)." }, { status: 403 })
      }

      const lessonType = toNullableString(body.lesson_type) || "text"
      if (!LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) {
        return NextResponse.json({ error: "lesson_type invalid." }, { status: 400 })
      }

      if (subject === "informatics" && lessonType === "problem") {
        return NextResponse.json({ error: "Pentru parcursuri de informatică nu se adaugă lecții de tip problem (catalog fizică)." }, { status: 400 })
      }

      const payload = {
        chapter_id: chapterId,
        slug: toNullableString(body.slug),
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
        logger.error("[dev/learning-paths] create lesson:", error)
        return NextResponse.json({ error: "Nu am putut crea lecția." }, { status: 500 })
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

    if (subject === "informatics" && itemType === "problem") {
      return NextResponse.json(
        { error: "Itemii de tip problem din learning path folosesc catalogul de fizică; nu sunt permiși pentru informatică." },
        { status: 400 }
      )
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("learning_path_lessons")
      .select("id, chapter_id")
      .eq("id", lessonId)
      .maybeSingle()

    if (lessonErr || !lessonRow) {
      return NextResponse.json({ error: "Lecția nu există." }, { status: 404 })
    }

    const { data: chapterRow, error: ch2Err } = await supabase
      .from("learning_path_chapters")
      .select("id, problem_category")
      .eq("id", lessonRow.chapter_id)
      .maybeSingle()

    if (ch2Err || !chapterRow) {
      return NextResponse.json({ error: "Capitolul lecției nu există." }, { status: 404 })
    }

    if (!chapterVisibleForSubject(chapterRow, subject)) {
      return NextResponse.json({ error: "Lecția nu aparține domeniului selectat." }, { status: 403 })
    }

    const validationError = validateItemBody(itemType, body as Record<string, unknown>)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (subject === "physics" && itemType === "problem") {
      const problemId = toNullableString(body.problem_id)
      if (!problemId) {
        return NextResponse.json({ error: "problem_id lipsă." }, { status: 400 })
      }
      const { data: problemRow, error: pErr } = await supabase
        .from("problems")
        .select("id, category")
        .eq("id", problemId)
        .maybeSingle()
      if (pErr || !problemRow) {
        return NextResponse.json({ error: "Problema (fizică) nu există în catalog." }, { status: 400 })
      }
      const chCat = chapterRow.problem_category?.trim() || null
      if (chCat && chCat !== INFORMATICA_LEARNING_PATH_MARKER) {
        if (problemRow.category !== chCat) {
          return NextResponse.json(
            { error: `Problema are categoria „${problemRow.category}”, dar capitolul cere „${chCat}”."` },
            { status: 400 }
          )
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
      logger.error("[dev/learning-paths] create item:", formatDbError(error))
      return NextResponse.json({ error: "Nu am putut crea itemul." }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (err) {
    logger.error("[dev/learning-paths] POST:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const subject = parseSubject(typeof body.subject === "string" ? body.subject : null)
    if (!subject) {
      return NextResponse.json({ error: "subject în body trebuie să fie physics sau informatics." }, { status: 400 })
    }

    const supabase = createServiceClient()
    const type = parseAdminEntityType(body?.type)
    const id = toNullableString(body?.id)
    if (!type || !id) {
      return NextResponse.json({ error: "type și id sunt obligatorii." }, { status: 400 })
    }

    if (type === "chapter") {
      const { data: existing, error: exErr } = await supabase
        .from("learning_path_chapters")
        .select("id, problem_category")
        .eq("id", id)
        .maybeSingle()
      if (exErr || !existing) {
        return NextResponse.json({ error: "Capitolul nu există." }, { status: 404 })
      }
      if (!chapterVisibleForSubject(existing, subject)) {
        return NextResponse.json({ error: "Capitolul nu este în domeniul tău dev." }, { status: 403 })
      }

      const updateData: Record<string, unknown> = {}
      if (body.title !== undefined) updateData.title = toNullableString(body.title)
      if (body.slug !== undefined) updateData.slug = toNullableString(body.slug)
      if (body.description !== undefined) updateData.description = toNullableString(body.description)
      if (body.icon_url !== undefined) updateData.icon_url = toNullableString(body.icon_url)
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)

      if (body.problem_category !== undefined) {
        const rawPc = toNullableString(body.problem_category)
        if (subject === "informatics") {
          if (rawPc && rawPc !== INFORMATICA_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Capitolele de informatică păstrează marcatorul fix." }, { status: 400 })
          }
          updateData.problem_category = INFORMATICA_LEARNING_PATH_MARKER
        } else {
          if (rawPc === INFORMATICA_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Nu poți seta marcatorul de informatică pe un capitol de fizică." }, { status: 400 })
          }
          if (rawPc && !isPhysicsCatalogCategory(rawPc)) {
            return NextResponse.json({ error: "problem_category invalid pentru fizică." }, { status: 400 })
          }
          updateData.problem_category = rawPc
        }
      }

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("learning_path_chapters")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
      if (error) {
        logger.error("[dev/learning-paths] PUT chapter:", error)
        return NextResponse.json({ error: "Nu am putut actualiza capitolul." }, { status: 500 })
      }
      return NextResponse.json({ success: true, chapter: data })
    }

    if (type === "lesson") {
      const { data: existingLesson, error: l0 } = await supabase
        .from("learning_path_lessons")
        .select("id, chapter_id")
        .eq("id", id)
        .maybeSingle()
      if (l0 || !existingLesson) {
        return NextResponse.json({ error: "Lecția nu există." }, { status: 404 })
      }
      const ch0 = await getChapterForLesson(supabase, existingLesson.id)
      if (!ch0 || !chapterVisibleForSubject(ch0, subject)) {
        return NextResponse.json({ error: "Lecția nu este în domeniul tău dev." }, { status: 403 })
      }

      if (body.chapter_id !== undefined) {
        const newChId = toNullableString(body.chapter_id)
        if (newChId) {
          const { data: newCh, error: ncErr } = await supabase
            .from("learning_path_chapters")
            .select("id, problem_category")
            .eq("id", newChId)
            .maybeSingle()
          if (ncErr || !newCh || !chapterVisibleForSubject(newCh, subject)) {
            return NextResponse.json({ error: "Capitolul țintă nu este permis." }, { status: 400 })
          }
        }
      }

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
        if (subject === "informatics" && lessonType === "problem") {
          return NextResponse.json({ error: "Lecția problem nu e permisă pentru informatică." }, { status: 400 })
        }
        updateData.lesson_type = lessonType
      }
      if (body.cursuri_lesson_slug !== undefined) updateData.cursuri_lesson_slug = toNullableString(body.cursuri_lesson_slug)
      if (body.youtube_url !== undefined) updateData.youtube_url = toNullableString(body.youtube_url)
      if (body.quiz_question_id !== undefined) updateData.quiz_question_id = toNullableString(body.quiz_question_id)
      if (body.problem_id !== undefined) updateData.problem_id = toNullableString(body.problem_id)
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("learning_path_lessons")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
      if (error) {
        logger.error("[dev/learning-paths] PUT lesson:", error)
        return NextResponse.json({ error: "Nu am putut actualiza lecția." }, { status: 500 })
      }
      return NextResponse.json({ success: true, lesson: data })
    }

    const { data: currentItem, error: currentItemErr } = await supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, order_index, item_type")
      .eq("id", id)
      .single()
    if (currentItemErr || !currentItem) {
      logger.error("[dev/learning-paths] PUT item fetch:", formatDbError(currentItemErr))
      return NextResponse.json({ error: "Itemul nu există sau nu poate fi citit." }, { status: 404 })
    }

    const chForItem = await getChapterForLesson(supabase, currentItem.lesson_id)
    if (!chForItem || !chapterVisibleForSubject(chForItem, subject)) {
      return NextResponse.json({ error: "Itemul nu este în domeniul tău dev." }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.lesson_id !== undefined) updateData.lesson_id = toNullableString(body.lesson_id)
    if (body.item_type !== undefined) {
      const itemType = toNullableString(body.item_type)
      if (!itemType || !ITEM_TYPES.includes(itemType as (typeof ITEM_TYPES)[number])) {
        return NextResponse.json({ error: "item_type invalid." }, { status: 400 })
      }
      if (subject === "informatics" && itemType === "problem") {
        return NextResponse.json({ error: "Tipul problem nu e permis pentru informatică." }, { status: 400 })
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

    const effectiveItemType = (updateData.item_type as string | undefined) ?? (currentItem as { item_type: string }).item_type
    if (subject === "informatics" && effectiveItemType === "problem") {
      return NextResponse.json({ error: "Itemul problem nu e permis pentru informatică." }, { status: 400 })
    }

    const targetLessonIdForScope =
      typeof updateData.lesson_id === "string" && updateData.lesson_id.trim()
        ? updateData.lesson_id
        : currentItem.lesson_id
    const chTarget = await getChapterForLesson(supabase, targetLessonIdForScope)
    if (!chTarget || !chapterVisibleForSubject(chTarget, subject)) {
      return NextResponse.json({ error: "Lecția țintă nu este permisă." }, { status: 400 })
    }

    if (subject === "physics" && (effectiveItemType === "problem" || toNullableString(body.problem_id))) {
      const pid = toNullableString(body.problem_id) ?? null
      const { data: rowFull } = await supabase.from("learning_path_lesson_items").select("problem_id").eq("id", id).single()
      const effectivePid = pid ?? (rowFull as { problem_id?: string | null } | null)?.problem_id
      if (effectiveItemType === "problem" && effectivePid) {
        const { data: problemRow, error: pErr } = await supabase
          .from("problems")
          .select("id, category")
          .eq("id", effectivePid)
          .maybeSingle()
        if (pErr || !problemRow) {
          return NextResponse.json({ error: "Problema (fizică) nu există în catalog." }, { status: 400 })
        }
        const chCat = chTarget.problem_category?.trim() || null
        if (chCat && chCat !== INFORMATICA_LEARNING_PATH_MARKER) {
          if (problemRow.category !== chCat) {
            return NextResponse.json(
              { error: `Problema are categoria „${problemRow.category}”, dar capitolul cere „${chCat}”."` },
              { status: 400 }
            )
          }
        }
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
        logger.error("[dev/learning-paths] PUT reorder step 1:", formatDbError(maxOrderErr))
        return NextResponse.json({ error: "Nu am putut reordona itemul (pas 1)." }, { status: 500 })
      }

      const tempOrderIndex = (maxOrderRows?.[0]?.order_index ?? 0) + 1000
      const { error: tempMoveErr } = await supabase
        .from("learning_path_lesson_items")
        .update({ order_index: tempOrderIndex, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (tempMoveErr) {
        logger.error("[dev/learning-paths] PUT reorder step 2:", formatDbError(tempMoveErr))
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
      } catch (reorderErr: unknown) {
        logger.error("[dev/learning-paths] PUT reorder:", reorderErr)
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
      logger.error("[dev/learning-paths] PUT item:", formatDbError(error))
      return NextResponse.json({ error: "Nu am putut actualiza itemul." }, { status: 500 })
    }
    return NextResponse.json({ success: true, item: data })
  } catch (err) {
    logger.error("[dev/learning-paths] PUT:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
