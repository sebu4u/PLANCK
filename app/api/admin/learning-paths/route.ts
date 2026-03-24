import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"

type AdminEntityType = "chapter" | "lesson" | "item"

const LESSON_TYPES = ["text", "video", "grila", "problem"] as const
const ITEM_TYPES = ["text", "video", "grila", "problem", "poll", "custom_text", "simulation"] as const

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

function isValidHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:"
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
    if (!embedUrl || !isValidHttpsUrl(embedUrl)) {
      return "Pentru item de tip simulation, content_json.embedUrl trebuie să fie URL HTTPS valid."
    }
  }

  if (itemType === "poll" && !isObject(body.content_json)) {
    return "Pentru item de tip poll, content_json este obligatoriu."
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const { supabase } = auth

    const { searchParams } = new URL(req.url)
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
        logger.error("[admin/learning-paths] Failed to fetch quiz questions:", quizError)
        return NextResponse.json({ error: "Nu am putut încărca întrebările grilă." }, { status: 500 })
      }

      return NextResponse.json({ quizQuestions: quizQuestions || [] })
    }

    const { data: chapters, error: chaptersErr } = await supabase
      .from("learning_path_chapters")
      .select("*")
      .order("order_index")

    if (chaptersErr) {
      logger.error("[admin/learning-paths] Failed to fetch chapters:", chaptersErr)
      return NextResponse.json({ error: "Nu am putut încărca capitolele de learning path." }, { status: 500 })
    }

    const { data: lessons, error: lessonsErr } = await supabase
      .from("learning_path_lessons")
      .select("*")
      .order("order_index")

    if (lessonsErr) {
      logger.error("[admin/learning-paths] Failed to fetch lessons:", lessonsErr)
      return NextResponse.json({ error: "Nu am putut încărca lecțiile de learning path." }, { status: 500 })
    }

    const { data: items, error: itemsErr } = await supabase
      .from("learning_path_lesson_items")
      .select("*")
      .order("order_index")

    if (itemsErr) {
      logger.error("[admin/learning-paths] Failed to fetch lesson items:", itemsErr)
      return NextResponse.json({ error: "Nu am putut încărca itemii lecțiilor." }, { status: 500 })
    }

    return NextResponse.json({
      chapters: chapters || [],
      lessons: lessons || [],
      items: items || [],
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
    const { supabase } = auth

    const body = await req.json()
    const type = parseAdminEntityType(body?.type)
    if (!type) {
      return NextResponse.json({ error: "Tip invalid. Folosește 'chapter', 'lesson' sau 'item'." }, { status: 400 })
    }

    if (type === "chapter") {
      const title = toNullableString(body.title)
      if (!title) return NextResponse.json({ error: "title este obligatoriu." }, { status: 400 })

      const payload = {
        title,
        slug: toNullableString(body.slug),
        description: toNullableString(body.description),
        icon_url: toNullableString(body.icon_url),
        problem_category: toNullableString(body.problem_category),
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
        logger.error("[admin/learning-paths] Failed to create lesson:", error)
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

    const validationError = validateItemBody(itemType, body as Record<string, unknown>)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const payload = {
      lesson_id: lessonId,
      item_type: itemType,
      title: toNullableString(body.title),
      cursuri_lesson_slug: toNullableString(body.cursuri_lesson_slug),
      youtube_url: toNullableString(body.youtube_url),
      quiz_question_id: toNullableString(body.quiz_question_id),
      problem_id: toNullableString(body.problem_id),
      content_json: isObject(body.content_json) ? body.content_json : null,
      order_index: toInt(body.order_index, 0),
      is_active: toBoolean(body.is_active, true),
    }

    const { data, error } = await supabase.from("learning_path_lesson_items").insert(payload).select().single()
    if (error) {
      logger.error("[admin/learning-paths] Failed to create lesson item:", error)
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
    const { supabase } = auth

    const body = await req.json()
    const type = parseAdminEntityType(body?.type)
    const id = toNullableString(body?.id)
    if (!type || !id) {
      return NextResponse.json({ error: "type și id sunt obligatorii." }, { status: 400 })
    }

    if (type === "chapter") {
      const updateData: Record<string, unknown> = {}
      if (body.title !== undefined) updateData.title = toNullableString(body.title)
      if (body.slug !== undefined) updateData.slug = toNullableString(body.slug)
      if (body.description !== undefined) updateData.description = toNullableString(body.description)
      if (body.icon_url !== undefined) updateData.icon_url = toNullableString(body.icon_url)
      if (body.problem_category !== undefined) updateData.problem_category = toNullableString(body.problem_category)
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
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
    if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
    if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("learning_path_lesson_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      logger.error("[admin/learning-paths] Failed to update lesson item:", error)
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
    const { supabase } = auth

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
