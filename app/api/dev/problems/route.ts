import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireDevSession } from "@/lib/dev-api-session"
import { isPhysicsCatalogCategory } from "@/lib/physics-catalog-chapters"

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, key)
}

const CODING_DIFFICULTY: Record<string, string> = {
  "inițiere": "Inițiere",
  initiere: "Inițiere",
  "ușor": "Ușor",
  usor: "Ușor",
  mediu: "Mediu",
  avansat: "Avansat",
  concurs: "Concurs",
}

const CLASS_SET = new Set([9, 10, 11, 12])

function normalizeCodingDifficulty(raw: string): string {
  const key = raw.trim().toLowerCase()
  return CODING_DIFFICULTY[key] ?? raw.trim()
}

/**
 * GET ?catalog=physics|informatics — listă recentă (dev).
 * POST body: { catalog: "physics"|"informatics", ... } — adaugă o problemă (fără ștergere).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const catalog = new URL(req.url).searchParams.get("catalog")?.trim()
    if (catalog !== "physics" && catalog !== "informatics") {
      return NextResponse.json({ error: "Parametrul catalog trebuie să fie physics sau informatics." }, { status: 400 })
    }

    const service = createServiceClient()

    if (catalog === "physics") {
      const searchParams = new URL(req.url).searchParams
      const search = searchParams.get("search") || ""
      const difficulty = searchParams.get("difficulty")
      const category = searchParams.get("category")

      let query = service
        .from("problems")
        .select("id, title, difficulty, category, class, created_at")
        .order("created_at", { ascending: false })
        .limit(300)

      if (search) {
        query = query.ilike("title", `%${search}%`)
      }
      if (difficulty && difficulty !== "Toate") {
        query = query.eq("difficulty", difficulty)
      }
      if (category && category !== "Toate") {
        query = query.eq("category", category)
      }

      const { data: problems, error } = await query
      if (error) {
        logger.error("[dev/problems] physics list:", error)
        return NextResponse.json({ error: "Nu am putut încărca problemele." }, { status: 500 })
      }
      return NextResponse.json({ problems: problems || [] })
    }

    const { data: rows, error } = await service
      .from("coding_problems")
      .select("id, slug, title, difficulty, class, chapter, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(300)

    if (error) {
      logger.error("[dev/problems] informatics list:", error)
      return NextResponse.json({ error: "Nu am putut încărca problemele de informatică." }, { status: 500 })
    }
    return NextResponse.json({ problems: rows || [] })
  } catch (e) {
    logger.error("[dev/problems] GET:", e)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const body = (await req.json()) as Record<string, unknown>
    const catalog = typeof body.catalog === "string" ? body.catalog.trim() : ""

    if (catalog !== "physics" && catalog !== "informatics") {
      return NextResponse.json({ error: "catalog trebuie să fie physics sau informatics." }, { status: 400 })
    }

    const service = createServiceClient()

    if (catalog === "physics") {
      const id = typeof body.id === "string" ? body.id.trim() : ""
      const title = typeof body.title === "string" ? body.title.trim() : ""
      const statement = typeof body.statement === "string" ? body.statement.trim() : ""
      const difficulty = typeof body.difficulty === "string" ? body.difficulty.trim() : ""
      const category = typeof body.category === "string" ? body.category.trim() : ""
      const youtube_url = typeof body.youtube_url === "string" ? body.youtube_url.trim() : ""
      const description =
        typeof body.description === "string" && body.description.trim() ? body.description.trim() : ""

      const classRaw = body.class
      const classNum =
        typeof classRaw === "number" && Number.isFinite(classRaw)
          ? Math.floor(classRaw)
          : typeof classRaw === "string"
            ? Number.parseInt(classRaw, 10)
            : NaN

      if (!id || !title || !statement || !difficulty || !category || !youtube_url) {
        return NextResponse.json(
          { error: "Câmpuri obligatorii: id, title, statement, difficulty, category, youtube_url." },
          { status: 400 }
        )
      }

      if (!isPhysicsCatalogCategory(category)) {
        return NextResponse.json(
          { error: "Categoria trebuie să fie exact un capitol din catalogul de fizică." },
          { status: 400 }
        )
      }

      if (!CLASS_SET.has(classNum)) {
        return NextResponse.json({ error: "class trebuie să fie 9, 10, 11 sau 12." }, { status: 400 })
      }

      let answer_type: string | null = null
      if (body.answer_type !== undefined && body.answer_type !== null && body.answer_type !== "") {
        if (body.answer_type !== "value" && body.answer_type !== "grila") {
          return NextResponse.json({ error: "answer_type invalid (value sau grila)." }, { status: 400 })
        }
        answer_type = body.answer_type
      }

      const payload: Record<string, unknown> = {
        id,
        title,
        description,
        statement,
        difficulty,
        category,
        class: classNum,
        youtube_url,
        answer_type,
        value_subpoints: body.value_subpoints ?? null,
        grila_options: body.grila_options ?? null,
        grila_correct_index: typeof body.grila_correct_index === "number" ? body.grila_correct_index : null,
      }

      const { data, error } = await service.from("problems").insert(payload).select("id, title, category, class").single()
      if (error) {
        logger.error("[dev/problems] physics insert:", error)
        return NextResponse.json({ error: error.message || "Nu am putut crea problema." }, { status: 500 })
      }
      return NextResponse.json({ success: true, problem: data })
    }

    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : ""
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const statement_markdown = typeof body.statement_markdown === "string" ? body.statement_markdown.trim() : ""
    const chapter = typeof body.chapter === "string" && body.chapter.trim() ? body.chapter.trim() : "Capitol neclasificat"

    const classRaw = body.class
    const classNum =
      typeof classRaw === "number" && Number.isFinite(classRaw)
        ? Math.floor(classRaw)
        : typeof classRaw === "string"
          ? Number.parseInt(classRaw, 10)
          : 9

    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { error: "slug obligatoriu (litere mici, cifre și cratime, ex: suma-cifrelor)." },
        { status: 400 }
      )
    }
    if (!title || !statement_markdown) {
      return NextResponse.json({ error: "title și statement_markdown sunt obligatorii." }, { status: 400 })
    }
    if (!CLASS_SET.has(classNum)) {
      return NextResponse.json({ error: "class trebuie să fie 9, 10, 11 sau 12." }, { status: 400 })
    }

    const diffRaw = typeof body.difficulty === "string" ? body.difficulty.trim() : "Ușor"
    const difficulty = normalizeCodingDifficulty(diffRaw)

    const language =
      body.language === "python" || body.language === "cpp" ? body.language : "cpp"

    const insertRow: Record<string, unknown> = {
      slug,
      title,
      statement_markdown,
      difficulty,
      class: classNum,
      chapter,
      points: typeof body.points === "number" && body.points >= 0 ? Math.floor(body.points) : 100,
      time_limit_ms:
        typeof body.time_limit_ms === "number" && body.time_limit_ms > 0 ? Math.floor(body.time_limit_ms) : 2000,
      memory_limit_kb:
        typeof body.memory_limit_kb === "number" && body.memory_limit_kb > 0
          ? Math.floor(body.memory_limit_kb)
          : 256000,
      tags: Array.isArray(body.tags) ? body.tags : [],
      is_active: body.is_active === false ? false : true,
      sample_input: typeof body.sample_input === "string" ? body.sample_input : null,
      sample_output: typeof body.sample_output === "string" ? body.sample_output : null,
      explanation_markdown: typeof body.explanation_markdown === "string" ? body.explanation_markdown : null,
      boilerplate_cpp: typeof body.boilerplate_cpp === "string" ? body.boilerplate_cpp : null,
      boilerplate_python: typeof body.boilerplate_python === "string" ? body.boilerplate_python : null,
      language,
    }

    const { data, error } = await service.from("coding_problems").insert(insertRow).select("id, slug, title").single()
    if (error) {
      logger.error("[dev/problems] coding insert:", error)
      return NextResponse.json({ error: error.message || "Nu am putut crea problema de informatică." }, { status: 500 })
    }
    return NextResponse.json({ success: true, problem: data })
  } catch (e) {
    logger.error("[dev/problems] POST:", e)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
