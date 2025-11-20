import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdmin, getAccessTokenFromRequest } from "@/lib/admin-check"
import { currentMonthKey } from "@/lib/monthly-free-rotation"

/**
 * GET - Obține problemele selectate manual pentru o lună
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
    const monthKey = searchParams.get("month_key") || currentMonthKey()

    // Obține problemele selectate pentru luna specificată
    const { data: selections, error: selectError } = await supabase
      .from("monthly_free_problems")
      .select("problem_id")
      .eq("month_key", monthKey)

    if (selectError) {
      console.error("[admin/monthly-free-problems] Failed to fetch selections:", selectError)
      return NextResponse.json({ error: "Nu am putut încărca selecțiile." }, { status: 500 })
    }

    const problemIds = (selections || []).map((s) => s.problem_id)

    // Obține detaliile problemelor
    if (problemIds.length === 0) {
      return NextResponse.json({ month_key: monthKey, problem_ids: [], problems: [] })
    }

    const { data: problems, error: problemsError } = await supabase
      .from("problems")
      .select("id, title, difficulty, category, class")
      .in("id", problemIds)

    if (problemsError) {
      console.error("[admin/monthly-free-problems] Failed to fetch problems:", problemsError)
      return NextResponse.json({ error: "Nu am putut încărca detaliile problemelor." }, { status: 500 })
    }

    return NextResponse.json({
      month_key: monthKey,
      problem_ids: problemIds,
      problems: problems || [],
    })
  } catch (err: any) {
    console.error("[admin/monthly-free-problems] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * POST - Adaugă probleme la selecțiile manuale pentru o lună
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { month_key, problem_ids } = body

    if (!month_key || !Array.isArray(problem_ids)) {
      return NextResponse.json({ error: "Parametri invalizi. month_key și problem_ids (array) sunt necesare." }, { status: 400 })
    }

    // Verifică că nu depășim limita de 50
    if (problem_ids.length > 50) {
      return NextResponse.json({ error: "Nu poți selecta mai mult de 50 de probleme." }, { status: 400 })
    }

    // Verifică că problemele există
    const { data: existingProblems, error: checkError } = await supabase
      .from("problems")
      .select("id")
      .in("id", problem_ids)

    if (checkError) {
      console.error("[admin/monthly-free-problems] Failed to verify problems:", checkError)
      return NextResponse.json({ error: "Nu am putut verifica problemele." }, { status: 500 })
    }

    const validProblemIds = (existingProblems || []).map((p) => p.id)
    if (validProblemIds.length !== problem_ids.length) {
      return NextResponse.json({ error: "Unele probleme nu există sau nu sunt active." }, { status: 400 })
    }

    // Șterge selecțiile existente pentru această lună
    const { error: deleteError } = await supabase
      .from("monthly_free_problems")
      .delete()
      .eq("month_key", month_key)

    if (deleteError) {
      console.error("[admin/monthly-free-problems] Failed to delete existing selections:", deleteError)
      return NextResponse.json({ error: "Nu am putut șterge selecțiile existente." }, { status: 500 })
    }

    // Adaugă noile selecții
    const insertData = validProblemIds.map((problemId) => ({
      month_key,
      problem_id: problemId,
      created_by: userData.user.id,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from("monthly_free_problems")
      .insert(insertData)
      .select()

    if (insertError) {
      console.error("[admin/monthly-free-problems] Failed to insert selections:", insertError)
      return NextResponse.json({ error: "Nu am putut salva selecțiile." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      month_key,
      count: inserted?.length || 0,
      problem_ids: validProblemIds,
    })
  } catch (err: any) {
    console.error("[admin/monthly-free-problems] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * DELETE - Șterge selecțiile manuale pentru o lună
 */
export async function DELETE(req: NextRequest) {
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
    const monthKey = searchParams.get("month_key") || currentMonthKey()

    const { error: deleteError } = await supabase
      .from("monthly_free_problems")
      .delete()
      .eq("month_key", monthKey)

    if (deleteError) {
      console.error("[admin/monthly-free-problems] Failed to delete selections:", deleteError)
      return NextResponse.json({ error: "Nu am putut șterge selecțiile." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      month_key: monthKey,
      message: "Selecțiile au fost șterse. Sistemul va folosi algoritmul automat.",
    })
  } catch (err: any) {
    console.error("[admin/monthly-free-problems] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

