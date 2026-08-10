import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { isPracticeSubjectId } from "@/lib/practice-subject"
import {
  isPracticeTestDifficulty,
  normalizeTestRow,
  parsePracticeTestItems,
  validatePracticeTestItems,
} from "@/lib/practice-tests"
import { createServerClientWithToken } from "@/lib/supabaseServer"

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const supabaseUser = createServerClientWithToken(accessToken)
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(supabaseUser, user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }
  return { userId: user.id }
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, serviceRoleKey)
}

function parseTestPayload(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description = typeof body.description === "string" ? body.description : ""
  const subject = body.subject
  const chapter = typeof body.chapter === "string" ? body.chapter.trim() : ""
  const difficulty = body.difficulty
  const classNum =
    typeof body.class === "number"
      ? body.class
      : typeof body.class === "string"
        ? Number.parseInt(body.class, 10)
        : NaN
  const timeLimit =
    typeof body.time_limit_seconds === "number"
      ? body.time_limit_seconds
      : typeof body.time_limit_seconds === "string"
        ? Number.parseInt(body.time_limit_seconds, 10)
        : NaN
  const isPublished = Boolean(body.is_published)
  const itemsError = validatePracticeTestItems(body.items)
  if (!title) return { error: "Titlul este obligatoriu." }
  if (!isPracticeSubjectId(subject)) return { error: "Materia este invalidă." }
  if (![9, 10, 11, 12].includes(classNum)) return { error: "Clasa trebuie să fie 9–12." }
  if (!isPracticeTestDifficulty(difficulty)) return { error: "Dificultatea este invalidă." }
  if (!Number.isFinite(timeLimit) || timeLimit < 30 || timeLimit > 14400) {
    return { error: "Limita de timp trebuie să fie între 30s și 4h." }
  }
  if (itemsError) return { error: itemsError }

  return {
    payload: {
      title,
      description,
      subject,
      class: classNum,
      chapter,
      difficulty,
      time_limit_seconds: Math.floor(timeLimit),
      items: parsePracticeTestItems(body.items),
      is_published: isPublished,
    },
  }
}

/**
 * GET /api/admin/teste — toate testele (inclusiv nepublicate)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("practice_tests")
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .order("updated_at", { ascending: false })

    if (error) {
      logger.error("[api/admin/teste] GET error:", error)
      return NextResponse.json({ error: "Nu am putut încărca testele." }, { status: 500 })
    }

    const tests = (data ?? [])
      .map((row) => normalizeTestRow(row as Record<string, unknown>))
      .filter((row): row is NonNullable<typeof row> => row !== null)

    return NextResponse.json({ tests })
  } catch (err) {
    logger.error("[api/admin/teste] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * POST /api/admin/teste — creează test
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: "Body invalid." }, { status: 400 })
    }

    const parsed = parseTestPayload(body)
    if ("error" in parsed && parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    if (!("payload" in parsed) || !parsed.payload) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("practice_tests")
      .insert(parsed.payload)
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .single()

    if (error || !data) {
      logger.error("[api/admin/teste] POST error:", error)
      return NextResponse.json({ error: "Nu am putut crea testul." }, { status: 500 })
    }

    const test = normalizeTestRow(data as Record<string, unknown>)
    return NextResponse.json({ test }, { status: 201 })
  } catch (err) {
    logger.error("[api/admin/teste] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * PUT /api/admin/teste — actualizează test (?id=)
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")?.trim()
    if (!id) {
      return NextResponse.json({ error: "ID lipsă." }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: "Body invalid." }, { status: 400 })
    }

    const parsed = parseTestPayload(body)
    if ("error" in parsed && parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    if (!("payload" in parsed) || !parsed.payload) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("practice_tests")
      .update(parsed.payload)
      .eq("id", id)
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .maybeSingle()

    if (error) {
      logger.error("[api/admin/teste] PUT error:", error)
      return NextResponse.json({ error: "Nu am putut actualiza testul." }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Testul nu a fost găsit." }, { status: 404 })
    }

    const test = normalizeTestRow(data as Record<string, unknown>)
    return NextResponse.json({ test })
  } catch (err) {
    logger.error("[api/admin/teste] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/teste — șterge test (?id=)
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")?.trim()
    if (!id) {
      return NextResponse.json({ error: "ID lipsă." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from("practice_tests").delete().eq("id", id)
    if (error) {
      logger.error("[api/admin/teste] DELETE error:", error)
      return NextResponse.json({ error: "Nu am putut șterge testul." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("[api/admin/teste] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
