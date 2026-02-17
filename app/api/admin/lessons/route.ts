import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"

/**
 * Helper: verifică autentificarea și drepturile de admin
 */
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

/**
 * GET - Obține toate clasele, capitolele și lecțiile (inclusiv inactive) pentru admin
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const { supabase } = auth

    // Fetch grades
    const { data: grades, error: gradesErr } = await supabase
      .from("grades")
      .select("*")
      .order("order_index")

    if (gradesErr) {
      logger.error("[admin/lessons] Failed to fetch grades:", gradesErr)
      return NextResponse.json({ error: "Nu am putut încărca clasele." }, { status: 500 })
    }

    // Fetch all chapters (inclusiv inactive)
    const { data: chapters, error: chaptersErr } = await supabase
      .from("chapters")
      .select("*")
      .order("order_index")

    if (chaptersErr) {
      logger.error("[admin/lessons] Failed to fetch chapters:", chaptersErr)
      return NextResponse.json({ error: "Nu am putut încărca capitolele." }, { status: 500 })
    }

    // Fetch all lessons (fără content pentru listare, inclusiv inactive)
    const { data: lessons, error: lessonsErr } = await supabase
      .from("lessons")
      .select("id, chapter_id, title, order_index, difficulty_level, estimated_duration, is_active, created_at, updated_at")
      .order("order_index")

    if (lessonsErr) {
      logger.error("[admin/lessons] Failed to fetch lessons:", lessonsErr)
      return NextResponse.json({ error: "Nu am putut încărca lecțiile." }, { status: 500 })
    }

    return NextResponse.json({
      grades: grades || [],
      chapters: chapters || [],
      lessons: lessons || [],
    })
  } catch (err: any) {
    logger.error("[admin/lessons] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * POST - Creează un capitol sau o lecție nouă
 * Body: { type: "chapter" | "lesson", ...fields }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const { supabase } = auth

    const body = await req.json()
    const { type, ...fields } = body

    if (type === "chapter") {
      const { grade_id, title, description, order_index, is_active, estimated_duration } = fields

      if (!grade_id || !title) {
        return NextResponse.json({ error: "grade_id și title sunt obligatorii." }, { status: 400 })
      }

      const { data, error } = await supabase
        .from("chapters")
        .insert({
          grade_id,
          title,
          description: description || null,
          order_index: order_index ?? 0,
          is_active: is_active ?? true,
          estimated_duration: estimated_duration || null,
        })
        .select()
        .single()

      if (error) {
        logger.error("[admin/lessons] Failed to create chapter:", error)
        return NextResponse.json({ error: "Nu am putut crea capitolul." }, { status: 500 })
      }

      return NextResponse.json({ success: true, chapter: data })
    }

    if (type === "lesson") {
      const { chapter_id, title, content, order_index, difficulty_level, estimated_duration, is_active } = fields

      if (!chapter_id || !title) {
        return NextResponse.json({ error: "chapter_id și title sunt obligatorii." }, { status: 400 })
      }

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          chapter_id,
          title,
          content: content || "",
          order_index: order_index ?? 0,
          difficulty_level: difficulty_level || null,
          estimated_duration: estimated_duration || null,
          is_active: is_active ?? true,
        })
        .select()
        .single()

      if (error) {
        logger.error("[admin/lessons] Failed to create lesson:", error)
        return NextResponse.json({ error: "Nu am putut crea lecția." }, { status: 500 })
      }

      return NextResponse.json({ success: true, lesson: data })
    }

    return NextResponse.json({ error: "Tip invalid. Folosește 'chapter' sau 'lesson'." }, { status: 400 })
  } catch (err: any) {
    logger.error("[admin/lessons] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * PUT - Editează un capitol sau o lecție existentă
 * Body: { type: "chapter" | "lesson", id: string, ...fields }
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error
    const { supabase } = auth

    const body = await req.json()
    const { type, id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: "id este obligatoriu." }, { status: 400 })
    }

    if (type === "chapter") {
      const updateData: Record<string, any> = {}
      if (fields.title !== undefined) updateData.title = fields.title
      if (fields.description !== undefined) updateData.description = fields.description
      if (fields.order_index !== undefined) updateData.order_index = fields.order_index
      if (fields.is_active !== undefined) updateData.is_active = fields.is_active
      if (fields.estimated_duration !== undefined) updateData.estimated_duration = fields.estimated_duration
      if (fields.grade_id !== undefined) updateData.grade_id = fields.grade_id
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("chapters")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        logger.error("[admin/lessons] Failed to update chapter:", error)
        return NextResponse.json({ error: "Nu am putut actualiza capitolul." }, { status: 500 })
      }

      return NextResponse.json({ success: true, chapter: data })
    }

    if (type === "lesson") {
      const updateData: Record<string, any> = {}
      if (fields.title !== undefined) updateData.title = fields.title
      if (fields.content !== undefined) updateData.content = fields.content
      if (fields.order_index !== undefined) updateData.order_index = fields.order_index
      if (fields.difficulty_level !== undefined) updateData.difficulty_level = fields.difficulty_level
      if (fields.estimated_duration !== undefined) updateData.estimated_duration = fields.estimated_duration
      if (fields.is_active !== undefined) updateData.is_active = fields.is_active
      if (fields.chapter_id !== undefined) updateData.chapter_id = fields.chapter_id
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("lessons")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        logger.error("[admin/lessons] Failed to update lesson:", error)
        return NextResponse.json({ error: "Nu am putut actualiza lecția." }, { status: 500 })
      }

      return NextResponse.json({ success: true, lesson: data })
    }

    return NextResponse.json({ error: "Tip invalid. Folosește 'chapter' sau 'lesson'." }, { status: 400 })
  } catch (err: any) {
    logger.error("[admin/lessons] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
