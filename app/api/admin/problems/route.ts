import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import { logger } from "@/lib/logger"

/**
 * GET - Obține toate problemele de fizică pentru interfața admin
 */
export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }

    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    // Verifică dacă utilizatorul este admin (din DB + fallback metadata/env)
    if (!(await isAdminFromDB(supabase, userData.user))) {
      return NextResponse.json({ error: "Acces interzis. Doar adminii pot accesa această resursă." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const catalog = searchParams.get("catalog")?.trim()

    if (catalog === "math") {
      const search = searchParams.get("search") || ""
      const difficulty = searchParams.get("difficulty")

      let query = supabase
        .from("math_problems")
        .select("id, title, difficulty, class, created_at")
        .order("created_at", { ascending: false })

      if (search) {
        query = query.ilike("title", `%${search}%`)
      }

      if (difficulty && difficulty !== "Toate") {
        query = query.eq("difficulty", difficulty)
      }

      const { data: problems, error: problemsError } = await query

      if (problemsError) {
        logger.error("[admin/problems] Failed to fetch math problems:", problemsError)
        return NextResponse.json({ error: "Nu am putut încărca problemele de matematică." }, { status: 500 })
      }

      const rows =
        problems?.map((p) => ({
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          class: p.class,
          created_at: p.created_at,
        })) || []

      return NextResponse.json({
        problems: rows,
        count: rows.length,
      })
    }

    const search = searchParams.get("search") || ""
    const difficulty = searchParams.get("difficulty")
    const category = searchParams.get("category")

    // Construiește query-ul
    let query = supabase
      .from("problems")
      .select("id, title, difficulty, category, class, created_at")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    if (difficulty && difficulty !== "Toate") {
      query = query.eq("difficulty", difficulty)
    }

    if (category && category !== "Toate") {
      query = query.eq("category", category)
    }

    const { data: problems, error: problemsError } = await query

    if (problemsError) {
      logger.error("[admin/problems] Failed to fetch problems:", problemsError)
      return NextResponse.json({ error: "Nu am putut încărca problemele." }, { status: 500 })
    }

    return NextResponse.json({
      problems: problems || [],
      count: problems?.length || 0,
    })
  } catch (err: any) {
    logger.error("[admin/problems] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}









