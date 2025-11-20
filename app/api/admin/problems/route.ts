import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdmin, getAccessTokenFromRequest } from "@/lib/admin-check"

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

    // Verifică dacă utilizatorul este admin
    if (!isAdmin(userData.user)) {
      return NextResponse.json({ error: "Acces interzis. Doar adminii pot accesa această resursă." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
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
      console.error("[admin/problems] Failed to fetch problems:", problemsError)
      return NextResponse.json({ error: "Nu am putut încărca problemele." }, { status: 500 })
    }

    return NextResponse.json({
      problems: problems || [],
      count: problems?.length || 0,
    })
  } catch (err: any) {
    console.error("[admin/problems] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}




