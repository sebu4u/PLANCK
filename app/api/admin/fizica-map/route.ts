import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"

type AdminEntityType = "chapter" | "lesson" | "assignment"

const LESSON_TYPES = ["invata", "scrie", "exerseaza"] as const

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
    return {
      error: NextResponse.json(
        { error: "Acces interzis. Doar adminii pot accesa această resursă." },
        { status: 403 },
      ),
    }
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

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

function toInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value)
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function parseAdminEntityType(value: unknown): AdminEntityType | null {
  if (value === "chapter" || value === "lesson" || value === "assignment") return value
  return null
}

function formatDbError(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown database error."
  const dbError = error as { code?: string; message?: string; details?: string; hint?: string }
  const parts = [dbError.code, dbError.message, dbError.details, dbError.hint].filter(Boolean)
  return parts.join(" | ") || "Unknown database error."
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function shiftAssignmentOrderBand(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  fizicaLessonId: string,
  minIndex: number,
  maxIndex: number,
  delta: 1 | -1,
  excludeAssignmentId?: string,
) {
  const { data: affectedRows, error: fetchErr } = await supabase
    .from("fizica_lesson_items")
    .select("id, order_index")
    .eq("fizica_lesson_id", fizicaLessonId)
    .gte("order_index", minIndex)
    .lte("order_index", maxIndex)
    .order("order_index", { ascending: delta === -1 })

  if (fetchErr) {
    throw new Error(`Failed to fetch affected assignment order band: ${formatDbError(fetchErr)}`)
  }

  for (const row of (affectedRows ?? []).filter((entry) => entry.id !== excludeAssignmentId)) {
    const { error } = await supabase
      .from("fizica_lesson_items")
      .update({ order_index: row.order_index + delta, updated_at: new Date().toISOString() })
      .eq("id", row.id)
    if (error) {
      throw new Error(`Failed to shift assignment order band: ${formatDbError(error)}`)
    }
  }
}

async function shiftAssignmentOrderRange(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  fizicaLessonId: string,
  fromIndex: number,
  delta: 1 | -1,
  excludeAssignmentId?: string,
) {
  const comparator = delta === 1 ? "gte" : "gt"
  const { data: affectedRows, error: fetchErr } = await supabase
    .from("fizica_lesson_items")
    .select("id, order_index")
    .eq("fizica_lesson_id", fizicaLessonId)
    [comparator]("order_index", fromIndex)
    .order("order_index", { ascending: delta === -1 })

  if (fetchErr) {
    throw new Error(`Failed to fetch affected assignment order rows: ${formatDbError(fetchErr)}`)
  }

  for (const row of (affectedRows ?? []).filter((entry) => entry.id !== excludeAssignmentId)) {
    const { error } = await supabase
      .from("fizica_lesson_items")
      .update({ order_index: row.order_index + delta, updated_at: new Date().toISOString() })
      .eq("id", row.id)
    if (error) {
      throw new Error(`Failed to shift assignment order rows: ${formatDbError(error)}`)
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const supabase = createAdminSupabaseClient()

    const { data: routes, error: routesErr } = await supabase
      .from("fizica_routes")
      .select("id, slug, title, order_index, is_active")
      .order("order_index", { ascending: true })

    if (routesErr) {
      logger.error("[admin/fizica-map] Failed to fetch routes:", routesErr)
      return NextResponse.json({ error: "Nu am putut încărca traseele." }, { status: 500 })
    }

    const { data: chapters, error: chaptersErr } = await supabase
      .from("fizica_chapters")
      .select("id, route_id, slug, title, order_index, is_active")
      .order("order_index", { ascending: true })

    if (chaptersErr) {
      logger.error("[admin/fizica-map] Failed to fetch chapters:", chaptersErr)
      return NextResponse.json({ error: "Nu am putut încărca capitolele." }, { status: 500 })
    }

    const { data: lessons, error: lessonsErr } = await supabase
      .from("fizica_lessons")
      .select("id, chapter_id, title, duration_minutes, lesson_type, order_index, is_active")
      .order("order_index", { ascending: true })

    if (lessonsErr) {
      logger.error("[admin/fizica-map] Failed to fetch lessons:", lessonsErr)
      return NextResponse.json({ error: "Nu am putut încărca lecțiile." }, { status: 500 })
    }

    const { data: assignments, error: assignmentsErr } = await supabase
      .from("fizica_lesson_items")
      .select("id, fizica_lesson_id, learning_path_lesson_item_id, order_index")
      .order("order_index", { ascending: true })

    if (assignmentsErr) {
      logger.error("[admin/fizica-map] Failed to fetch assignments:", assignmentsErr)
      return NextResponse.json({ error: "Nu am putut încărca asignările." }, { status: 500 })
    }

    return NextResponse.json({
      routes: routes ?? [],
      chapters: chapters ?? [],
      lessons: lessons ?? [],
      assignments: assignments ?? [],
    })
  } catch (err) {
    logger.error("[admin/fizica-map] GET error:", err)
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
      return NextResponse.json(
        { error: "Tip invalid. Folosește 'chapter', 'lesson' sau 'assignment'." },
        { status: 400 },
      )
    }

    if (type === "chapter") {
      const routeId = toNullableString(body.route_id)
      const title = toNullableString(body.title)
      if (!routeId || !title) {
        return NextResponse.json({ error: "route_id și title sunt obligatorii." }, { status: 400 })
      }

      const requestedSlug = toNullableString(body.slug) ?? slugify(title)
      const payload = {
        route_id: routeId,
        slug: requestedSlug,
        title,
        order_index: toInt(body.order_index, 0),
        is_active: toBoolean(body.is_active, true),
      }

      const { data, error } = await supabase.from("fizica_chapters").insert(payload).select().single()
      if (error) {
        logger.error("[admin/fizica-map] Failed to create chapter:", error)
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

      const lessonType = toNullableString(body.lesson_type) || "invata"
      if (!LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) {
        return NextResponse.json({ error: "lesson_type invalid." }, { status: 400 })
      }

      const payload = {
        chapter_id: chapterId,
        title,
        duration_minutes: Math.max(0, toInt(body.duration_minutes, 0)),
        lesson_type: lessonType,
        order_index: toInt(body.order_index, 0),
        is_active: toBoolean(body.is_active, true),
      }

      const { data, error } = await supabase.from("fizica_lessons").insert(payload).select().single()
      if (error) {
        logger.error("[admin/fizica-map] Failed to create lesson:", error)
        return NextResponse.json({ error: "Nu am putut crea lecția." }, { status: 500 })
      }
      return NextResponse.json({ success: true, lesson: data })
    }

    const fizicaLessonId = toNullableString(body.fizica_lesson_id)
    const learningPathItemId = toNullableString(body.learning_path_lesson_item_id)
    if (!fizicaLessonId || !learningPathItemId) {
      return NextResponse.json(
        { error: "fizica_lesson_id și learning_path_lesson_item_id sunt obligatorii." },
        { status: 400 },
      )
    }

    const { data: lpItem, error: lpItemErr } = await supabase
      .from("learning_path_lesson_items")
      .select("id")
      .eq("id", learningPathItemId)
      .maybeSingle()

    if (lpItemErr || !lpItem) {
      return NextResponse.json({ error: "Itemul din learning path nu există." }, { status: 400 })
    }

    const requestedOrderIndex = toInt(body.order_index, 0)

    try {
      await shiftAssignmentOrderRange(supabase, fizicaLessonId, requestedOrderIndex, 1)
    } catch (shiftErr) {
      const details = shiftErr instanceof Error ? shiftErr.message : formatDbError(shiftErr)
      logger.error("[admin/fizica-map] Failed to shift assignment order:", details)
      return NextResponse.json(
        { error: "Nu am putut pregăti ordinea itemilor.", details },
        { status: 500 },
      )
    }

    const { data, error } = await supabase
      .from("fizica_lesson_items")
      .insert({
        fizica_lesson_id: fizicaLessonId,
        learning_path_lesson_item_id: learningPathItemId,
        order_index: requestedOrderIndex,
      })
      .select()
      .single()

    if (error) {
      const details = formatDbError(error)
      logger.error("[admin/fizica-map] Failed to create assignment:", details)
      const message =
        error.code === "23505"
          ? "Acest item este deja asignat lecției selectate."
          : "Nu am putut asigna itemul."
      return NextResponse.json({ error: message, details }, { status: 500 })
    }

    return NextResponse.json({ success: true, assignment: data })
  } catch (err) {
    logger.error("[admin/fizica-map] POST error:", err)
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
      if (body.route_id !== undefined) updateData.route_id = toNullableString(body.route_id)
      if (body.title !== undefined) updateData.title = toNullableString(body.title)
      if (body.slug !== undefined) updateData.slug = toNullableString(body.slug)
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("fizica_chapters")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        logger.error("[admin/fizica-map] Failed to update chapter:", error)
        return NextResponse.json({ error: "Nu am putut actualiza capitolul." }, { status: 500 })
      }
      return NextResponse.json({ success: true, chapter: data })
    }

    if (type === "lesson") {
      const updateData: Record<string, unknown> = {}
      if (body.chapter_id !== undefined) updateData.chapter_id = toNullableString(body.chapter_id)
      if (body.title !== undefined) updateData.title = toNullableString(body.title)
      if (body.duration_minutes !== undefined) {
        updateData.duration_minutes = Math.max(0, toInt(body.duration_minutes, 0))
      }
      if (body.lesson_type !== undefined) {
        const lessonType = toNullableString(body.lesson_type)
        if (!lessonType || !LESSON_TYPES.includes(lessonType as (typeof LESSON_TYPES)[number])) {
          return NextResponse.json({ error: "lesson_type invalid." }, { status: 400 })
        }
        updateData.lesson_type = lessonType
      }
      if (body.order_index !== undefined) updateData.order_index = toInt(body.order_index, 0)
      if (body.is_active !== undefined) updateData.is_active = toBoolean(body.is_active, true)
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("fizica_lessons")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        logger.error("[admin/fizica-map] Failed to update lesson:", error)
        return NextResponse.json({ error: "Nu am putut actualiza lecția." }, { status: 500 })
      }
      return NextResponse.json({ success: true, lesson: data })
    }

    const nextOrderIndex =
      body.order_index !== undefined ? toInt(body.order_index, 0) : undefined

    const { data: currentAssignment, error: currentAssignmentErr } = await supabase
      .from("fizica_lesson_items")
      .select("id, fizica_lesson_id, order_index")
      .eq("id", id)
      .single()

    if (currentAssignmentErr || !currentAssignment) {
      return NextResponse.json({ error: "Asignarea nu există." }, { status: 404 })
    }

    if (nextOrderIndex !== undefined && nextOrderIndex !== currentAssignment.order_index) {
      const lessonId = currentAssignment.fizica_lesson_id
      const oldIndex = currentAssignment.order_index

      const { data: maxOrderRows, error: maxOrderErr } = await supabase
        .from("fizica_lesson_items")
        .select("order_index")
        .eq("fizica_lesson_id", lessonId)
        .order("order_index", { ascending: false })
        .limit(1)

      if (maxOrderErr) {
        const details = formatDbError(maxOrderErr)
        logger.error("[admin/fizica-map] Failed to compute temporary assignment order:", details)
        return NextResponse.json(
          { error: "Nu am putut reordona asignarea (pas 1).", details },
          { status: 500 },
        )
      }

      const tempOrderIndex = (maxOrderRows?.[0]?.order_index ?? 0) + 1000
      const { error: tempMoveErr } = await supabase
        .from("fizica_lesson_items")
        .update({ order_index: tempOrderIndex, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (tempMoveErr) {
        const details = formatDbError(tempMoveErr)
        logger.error("[admin/fizica-map] Failed to move assignment to temporary index:", details)
        return NextResponse.json(
          { error: "Nu am putut reordona asignarea (pas 2).", details },
          { status: 500 },
        )
      }

      try {
        if (nextOrderIndex > oldIndex) {
          await shiftAssignmentOrderBand(
            supabase,
            lessonId,
            oldIndex + 1,
            nextOrderIndex,
            -1,
            id,
          )
        } else {
          await shiftAssignmentOrderBand(
            supabase,
            lessonId,
            nextOrderIndex,
            oldIndex - 1,
            1,
            id,
          )
        }
      } catch (reorderErr) {
        const details = reorderErr instanceof Error ? reorderErr.message : formatDbError(reorderErr)
        logger.error("[admin/fizica-map] Failed during assignment reorder:", details)
        return NextResponse.json({ error: "Nu am putut reordona asignarea.", details }, { status: 500 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (nextOrderIndex !== undefined) updateData.order_index = nextOrderIndex
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("fizica_lesson_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      const details = formatDbError(error)
      logger.error("[admin/fizica-map] Failed to update assignment:", details)
      return NextResponse.json({ error: "Nu am putut actualiza asignarea.", details }, { status: 500 })
    }

    return NextResponse.json({ success: true, assignment: data })
  } catch (err) {
    logger.error("[admin/fizica-map] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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
      const { error } = await supabase.from("fizica_chapters").delete().eq("id", id)
      if (error) {
        logger.error("[admin/fizica-map] Failed to delete chapter:", error)
        return NextResponse.json({ error: "Nu am putut șterge capitolul." }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (type === "lesson") {
      const { error } = await supabase.from("fizica_lessons").delete().eq("id", id)
      if (error) {
        logger.error("[admin/fizica-map] Failed to delete lesson:", error)
        return NextResponse.json({ error: "Nu am putut șterge lecția." }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from("fizica_lesson_items").delete().eq("id", id)
    if (error) {
      logger.error("[admin/fizica-map] Failed to delete assignment:", error)
      return NextResponse.json({ error: "Nu am putut elimina asignarea." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("[admin/fizica-map] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
