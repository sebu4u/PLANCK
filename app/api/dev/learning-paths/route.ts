import { NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { validateTestContent } from "@/lib/learning-path-test"
import {
  isInteractiveLessonItemType,
  validateInteractiveItemContent,
} from "@/lib/learning-path-interactive-items"
import { requireDevSession } from "@/lib/dev-api-session"
import { BIOLOGIE_LEARNING_PATH_MARKER } from "@/lib/learning-path-biologie"
import { INFORMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-informatica"
import { MATEMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-matematica"
import { isPhysicsCatalogCategory } from "@/lib/physics-catalog-chapters"
import { generateUniqueChapterSlug, generateUniqueLessonSlug } from "@/lib/learning-path-slug"

type AdminEntityType = "chapter" | "lesson" | "item"
type DevSubject = "physics" | "informatics" | "math" | "biology" | "all"

function parseSubjectStrict(trimmedInput: string): DevSubject | null {
  const s = trimmedInput.trim()
  if (s === "physics" || s === "informatics" || s === "math" || s === "biology" || s === "all") return s
  return null
}

function isReservedLearningPathMarker(pc: string | null): boolean {
  return (
    pc === INFORMATICA_LEARNING_PATH_MARKER ||
    pc === MATEMATICA_LEARNING_PATH_MARKER ||
    pc === BIOLOGIE_LEARNING_PATH_MARKER
  )
}

/** GET: parametru absent / gol → `all` (toate parcursurile). */
function resolveQuerySubject(raw: string | null): DevSubject | null {
  if (raw === null || raw.trim() === "") return "all"
  return parseSubjectStrict(raw)
}

/** POST/PUT: lipsește subject → `all`. Valoare invalidă → null. */
function parseBodySubject(raw: unknown): DevSubject | null {
  if (raw === undefined || raw === null) return "all"
  if (typeof raw !== "string") return null
  if (raw.trim() === "") return "all"
  return parseSubjectStrict(raw)
}

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

/** Răspuns JSON pentru eșec la insert item — mesaj clar pentru migrări lipsă + detalii Postgres în dev. */
function jsonLessonItemCreateError(error: unknown): NextResponse {
  const details = formatDbError(error)
  const db = error as DbErrorLike
  const code = db.code
  const msg = String(db.message || "")
  const combinedCheck = [msg, db.details, db.hint].filter(Boolean).join(" ")

  if (code === "23514" && combinedCheck.includes("learning_path_lesson_items_item_type_check")) {
    return NextResponse.json(
      {
        error:
          "Tipul itemului nu este permis de constraint-ul din Postgres. Aplică migrările `20260518_learning_path_math_problem_item.sql` și `20260518_learning_path_coding_problem_item.sql` pe proiectul Supabase, apoi încearcă din nou.",
        details,
      },
      { status: 500 }
    )
  }

  if (code === "23505" && combinedCheck.includes("idx_learning_path_lesson_items_lesson_order_unique")) {
    return NextResponse.json(
      {
        error:
          "Există deja un item la același order_index pentru această lecție. Reîncarcă pagina și alege altă poziție.",
        details,
      },
      { status: 500 }
    )
  }

  logger.error("[dev/learning-paths] create item:", details)
  return NextResponse.json({ error: "Nu am putut crea itemul.", details }, { status: 500 })
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

function chapterVisibleForSubject(
  chapter: { problem_category: string | null },
  subject: DevSubject
): boolean {
  if (subject === "all") return true
  const pc = chapter.problem_category?.trim() || null
  if (subject === "informatics") {
    return pc === INFORMATICA_LEARNING_PATH_MARKER
  }
  if (subject === "math") {
    return pc === MATEMATICA_LEARNING_PATH_MARKER
  }
  if (subject === "biology") {
    return pc === BIOLOGIE_LEARNING_PATH_MARKER
  }
  return !isReservedLearningPathMarker(pc)
}

/**
 * GET ?subject=… (opțional) — fără param sau `all` = toate parcursurile; altfel filtrat pe domeniu.
 * GET ?subject=...&action=quiz-questions — pentru itemi grilă (ca admin).
 * POST — creare capitol/lecție/item.
 * PUT — actualizare / reordonare (fără DELETE).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const subject = resolveQuerySubject(searchParams.get("subject"))
    if (!subject) {
      return NextResponse.json(
        { error: "Parametrul subject trebuie să fie all, physics, informatics, math sau biology." },
        { status: 400 }
      )
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
    const subject = parseBodySubject((body as Record<string, unknown>).subject)
    if (subject === null) {
      return NextResponse.json(
        { error: "subject în body trebuie să fie all, physics, informatics, math sau biology." },
        { status: 400 }
      )
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
      } else if (subject === "math") {
        problem_category = MATEMATICA_LEARNING_PATH_MARKER
      } else if (subject === "biology") {
        problem_category = BIOLOGIE_LEARNING_PATH_MARKER
      } else if (subject === "all") {
        const rawPc = toNullableString(body.problem_category)
        if (!rawPc) {
          problem_category = null
        } else if (
          rawPc === INFORMATICA_LEARNING_PATH_MARKER ||
          rawPc === MATEMATICA_LEARNING_PATH_MARKER ||
          rawPc === BIOLOGIE_LEARNING_PATH_MARKER ||
          isPhysicsCatalogCategory(rawPc)
        ) {
          problem_category = rawPc
        } else {
          return NextResponse.json(
            {
              error:
                "problem_category invalid: lasă gol, sau informatica, matematica, biologie, sau un capitol valid din catalogul de fizică.",
            },
            { status: 400 }
          )
        }
      } else {
        const rawPc = toNullableString(body.problem_category)
        if (rawPc === INFORMATICA_LEARNING_PATH_MARKER) {
          return NextResponse.json({ error: "Capitolele de fizică nu pot folosi marcatorul de informatică." }, { status: 400 })
        }
        if (rawPc === MATEMATICA_LEARNING_PATH_MARKER) {
          return NextResponse.json({ error: "Capitolele de fizică nu pot folosi marcatorul de matematică." }, { status: 400 })
        }
        if (rawPc === BIOLOGIE_LEARNING_PATH_MARKER) {
          return NextResponse.json({ error: "Capitolele de fizică nu pot folosi marcatorul de biologie." }, { status: 400 })
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

      const requestedSlug = toNullableString(body.slug)
      const slug =
        requestedSlug ||
        (await generateUniqueChapterSlug(supabase, title))

      const payload = {
        title,
        nav_title: toNullableString(body.nav_title),
        slug,
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
        return NextResponse.json(
          { error: "Capitolul nu aparține domeniului selectat (fizică / informatică / matematică / biologie)." },
          { status: 403 }
        )
      }

      const lessonType = toNullableString(body.lesson_type) || "text"
      if (!LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) {
        return NextResponse.json({ error: "lesson_type invalid." }, { status: 400 })
      }

      const chapterPc = chapterRow.problem_category?.trim() || null
      if (
        lessonType === "problem" &&
        isReservedLearningPathMarker(chapterPc)
      ) {
        return NextResponse.json(
          {
            error:
              "Lecția de tip problem (catalog fizică) nu se folosește pentru capitole de informatică, matematică sau biologie.",
          },
          { status: 400 }
        )
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

    const itemChapterPc = chapterRow.problem_category?.trim() || null
    if (
      itemChapterPc === INFORMATICA_LEARNING_PATH_MARKER &&
      (itemType === "problem" || itemType === "math_problem")
    ) {
      return NextResponse.json(
        {
          error:
            "Pe capitole de informatică folosește itemul coding_problem (catalog informatică), nu problem / math_problem.",
        },
        { status: 400 }
      )
    }
    if (itemChapterPc === MATEMATICA_LEARNING_PATH_MARKER && itemType === "problem") {
      return NextResponse.json(
        {
          error:
            "Pe capitole de matematică folosește itemul math_problem (catalog matematică), nu problem (fizică).",
        },
        { status: 400 }
      )
    }
    if (
      itemChapterPc === BIOLOGIE_LEARNING_PATH_MARKER &&
      (itemType === "problem" || itemType === "math_problem" || itemType === "coding_problem")
    ) {
      return NextResponse.json(
        {
          error:
            "Pe capitole de biologie nu se folosesc itemi din cataloagele de probleme (problem / math_problem / coding_problem).",
        },
        { status: 400 }
      )
    }

    const validationError = validateItemBody(itemType, body as Record<string, unknown>)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (itemType === "problem" && !isReservedLearningPathMarker(itemChapterPc)) {
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
      if (chCat && !isReservedLearningPathMarker(chCat)) {
        if (problemRow.category !== chCat) {
          return NextResponse.json(
            { error: `Problema are categoria „${problemRow.category}”, dar capitolul cere „${chCat}”."` },
            { status: 400 }
          )
        }
      }
    }

    if (itemType === "math_problem" && itemChapterPc !== INFORMATICA_LEARNING_PATH_MARKER) {
      const problemId = toNullableString(body.problem_id)
      if (!problemId) {
        return NextResponse.json({ error: "problem_id lipsă." }, { status: 400 })
      }
      const { data: mathRow, error: mErr } = await supabase
        .from("math_problems")
        .select("id, is_active")
        .eq("id", problemId)
        .maybeSingle()
      if (mErr || !mathRow) {
        return NextResponse.json({ error: "Problema de matematică nu există în catalog." }, { status: 400 })
      }
      if (!mathRow.is_active) {
        return NextResponse.json({ error: "Problema de matematică nu este activă." }, { status: 400 })
      }
    }

    if (itemType === "coding_problem" && itemChapterPc !== INFORMATICA_LEARNING_PATH_MARKER) {
      return NextResponse.json(
        { error: "Itemul coding_problem se folosește doar pe capitole de informatică." },
        { status: 400 }
      )
    }

    if (itemType === "coding_problem" && itemChapterPc === INFORMATICA_LEARNING_PATH_MARKER) {
      const problemId = toNullableString(body.problem_id)
      if (!problemId) {
        return NextResponse.json({ error: "problem_id lipsă." }, { status: 400 })
      }
      const { data: codingRow, error: cErr } = await supabase
        .from("coding_problems")
        .select("id, is_active")
        .eq("id", problemId)
        .maybeSingle()
      if (cErr || !codingRow) {
        return NextResponse.json({ error: "Problema de informatică nu există în catalog." }, { status: 400 })
      }
      if (!codingRow.is_active) {
        return NextResponse.json({ error: "Problema de informatică nu este activă." }, { status: 400 })
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
      return jsonLessonItemCreateError(error)
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
    const subject = parseBodySubject((body as Record<string, unknown>).subject)
    if (subject === null) {
      return NextResponse.json(
        { error: "subject în body trebuie să fie all, physics, informatics, math sau biology." },
        { status: 400 }
      )
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
      if (body.nav_title !== undefined) updateData.nav_title = toNullableString(body.nav_title)
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
          if (rawPc === MATEMATICA_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Nu poți seta marcatorul de matematică pe un capitol de informatică." }, { status: 400 })
          }
          updateData.problem_category = INFORMATICA_LEARNING_PATH_MARKER
        } else if (subject === "math") {
          if (rawPc && rawPc !== MATEMATICA_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Capitolele de matematică păstrează marcatorul fix." }, { status: 400 })
          }
          updateData.problem_category = MATEMATICA_LEARNING_PATH_MARKER
        } else if (subject === "biology") {
          if (rawPc && rawPc !== BIOLOGIE_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Capitolele de biologie păstrează marcatorul fix." }, { status: 400 })
          }
          updateData.problem_category = BIOLOGIE_LEARNING_PATH_MARKER
        } else if (subject === "all") {
          if (!rawPc) {
            updateData.problem_category = null
          } else if (
            rawPc === INFORMATICA_LEARNING_PATH_MARKER ||
            rawPc === MATEMATICA_LEARNING_PATH_MARKER ||
            rawPc === BIOLOGIE_LEARNING_PATH_MARKER ||
            isPhysicsCatalogCategory(rawPc)
          ) {
            updateData.problem_category = rawPc
          } else {
            return NextResponse.json(
              {
                error:
                  "problem_category invalid: informatica, matematica, biologie, gol, sau capitol din catalogul de fizică.",
              },
              { status: 400 }
            )
          }
        } else {
          if (rawPc === INFORMATICA_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Nu poți seta marcatorul de informatică pe un capitol de fizică." }, { status: 400 })
          }
          if (rawPc === MATEMATICA_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Nu poți seta marcatorul de matematică pe un capitol de fizică." }, { status: 400 })
          }
          if (rawPc === BIOLOGIE_LEARNING_PATH_MARKER) {
            return NextResponse.json({ error: "Nu poți seta marcatorul de biologie pe un capitol de fizică." }, { status: 400 })
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
        const targetChapterId =
          body.chapter_id !== undefined ? toNullableString(body.chapter_id) : existingLesson.chapter_id
        if (targetChapterId) {
          const { data: chForLessonType } = await supabase
            .from("learning_path_chapters")
            .select("problem_category")
            .eq("id", targetChapterId)
            .maybeSingle()
          const lpc = chForLessonType?.problem_category?.trim() || null
          if (lessonType === "problem" && isReservedLearningPathMarker(lpc)) {
            return NextResponse.json(
              {
                error:
                  "Lecția de tip problem (catalog fizică) nu se folosește pentru capitole de informatică, matematică sau biologie.",
              },
              { status: 400 }
            )
          }
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
      const lessonIdForItemPut =
        body.lesson_id !== undefined ? toNullableString(body.lesson_id) : currentItem.lesson_id
      if (!lessonIdForItemPut) {
        return NextResponse.json({ error: "lesson_id invalid." }, { status: 400 })
      }
      const chForIncomingItem = await getChapterForLesson(supabase, lessonIdForItemPut)
      if (!chForIncomingItem) {
        return NextResponse.json({ error: "Capitolul lecției nu a putut fi rezolvat." }, { status: 400 })
      }
      const pcPut = chForIncomingItem.problem_category?.trim() || null
      if (
        pcPut === INFORMATICA_LEARNING_PATH_MARKER &&
        (itemType === "problem" || itemType === "math_problem")
      ) {
        return NextResponse.json(
          {
            error: "Pe capitole de informatică folosește coding_problem, nu problem / math_problem.",
          },
          { status: 400 }
        )
      }
      if (pcPut === MATEMATICA_LEARNING_PATH_MARKER && itemType === "problem") {
        return NextResponse.json(
          {
            error: "Pe capitole de matematică folosește itemul math_problem, nu problem.",
          },
          { status: 400 }
        )
      }
      if (
        pcPut === BIOLOGIE_LEARNING_PATH_MARKER &&
        (itemType === "problem" || itemType === "math_problem" || itemType === "coding_problem")
      ) {
        return NextResponse.json(
          {
            error:
              "Pe capitole de biologie nu se folosesc itemi din cataloagele de probleme (problem / math_problem / coding_problem).",
          },
          { status: 400 }
        )
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

    const targetLessonIdForScope =
      typeof updateData.lesson_id === "string" && updateData.lesson_id.trim()
        ? updateData.lesson_id
        : currentItem.lesson_id
    const chTarget = await getChapterForLesson(supabase, targetLessonIdForScope)
    if (!chTarget || !chapterVisibleForSubject(chTarget, subject)) {
      return NextResponse.json({ error: "Lecția țintă nu este permisă." }, { status: 400 })
    }

    const pcTarget = chTarget.problem_category?.trim() || null
    if (
      pcTarget === INFORMATICA_LEARNING_PATH_MARKER &&
      (effectiveItemType === "problem" || effectiveItemType === "math_problem")
    ) {
      return NextResponse.json(
        { error: "Itemul problem / math_problem nu e permis pe capitole de informatică. Folosește coding_problem." },
        { status: 400 }
      )
    }
    if (pcTarget === MATEMATICA_LEARNING_PATH_MARKER && effectiveItemType === "problem") {
      return NextResponse.json(
        { error: "Itemul problem (fizică) nu e permis pe capitole de matematică." },
        { status: 400 }
      )
    }
    if (
      pcTarget === BIOLOGIE_LEARNING_PATH_MARKER &&
      (effectiveItemType === "problem" ||
        effectiveItemType === "math_problem" ||
        effectiveItemType === "coding_problem")
    ) {
      return NextResponse.json(
        {
          error:
            "Pe capitole de biologie nu se folosesc itemi din cataloagele de probleme (problem / math_problem / coding_problem).",
        },
        { status: 400 }
      )
    }

    if (
      pcTarget === INFORMATICA_LEARNING_PATH_MARKER &&
      effectiveItemType === "coding_problem"
    ) {
      const pid =
        toNullableString(body.problem_id) ??
        (await supabase.from("learning_path_lesson_items").select("problem_id").eq("id", id).single()).data
          ?.problem_id ??
        null
      if (pid) {
        const { data: codingRow, error: cErr } = await supabase
          .from("coding_problems")
          .select("id, is_active")
          .eq("id", pid)
          .maybeSingle()
        if (cErr || !codingRow) {
          return NextResponse.json({ error: "Problema de informatică nu există în catalog." }, { status: 400 })
        }
        if (!codingRow.is_active) {
          return NextResponse.json({ error: "Problema de informatică nu este activă." }, { status: 400 })
        }
      }
    }

    if (
      pcTarget !== INFORMATICA_LEARNING_PATH_MARKER &&
      effectiveItemType === "coding_problem"
    ) {
      return NextResponse.json(
        { error: "Itemul coding_problem se folosește doar pe capitole de informatică." },
        { status: 400 }
      )
    }

    if (
      !isReservedLearningPathMarker(pcTarget) &&
      (effectiveItemType === "problem" ||
        effectiveItemType === "math_problem" ||
        toNullableString(body.problem_id))
    ) {
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
        if (chCat && !isReservedLearningPathMarker(chCat)) {
          if (problemRow.category !== chCat) {
            return NextResponse.json(
              { error: `Problema are categoria „${problemRow.category}”, dar capitolul cere „${chCat}”."` },
              { status: 400 }
            )
          }
        }
      }
      if (effectiveItemType === "math_problem" && effectivePid) {
        const { data: mathRow, error: mErr } = await supabase
          .from("math_problems")
          .select("id, is_active")
          .eq("id", effectivePid)
          .maybeSingle()
        if (mErr || !mathRow) {
          return NextResponse.json({ error: "Problema de matematică nu există în catalog." }, { status: 400 })
        }
        if (!mathRow.is_active) {
          return NextResponse.json({ error: "Problema de matematică nu este activă." }, { status: 400 })
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
