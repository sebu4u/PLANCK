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

const MATH_DIFFICULTY_SET = new Set(["Ușor", "Mediu", "Avansat"])

function parseMathAnswerSubpoints(raw: unknown):
  | { ok: true; value: Array<{ label: string; content: string }> }
  | { ok: false; message: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: [] }
  }
  if (!Array.isArray(raw)) {
    return { ok: false, message: "answer_subpoints trebuie să fie un array (max 3 elemente)." }
  }
  if (raw.length > 3) {
    return { ok: false, message: "Cel mult 3 subpuncte pentru răspuns." }
  }
  const value: Array<{ label: string; content: string }> = []
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { ok: false, message: "Fiecare subpunct trebuie să fie un obiect { label, content }." }
    }
    const o = item as Record<string, unknown>
    const label = typeof o.label === "string" ? o.label.trim() : ""
    const content = typeof o.content === "string" ? o.content.trim() : ""
    if (!label || !content) {
      return { ok: false, message: "label și content sunt obligatorii pentru fiecare subpunct." }
    }
    value.push({ label, content })
  }
  return { ok: true, value }
}

type ParsedCodingTest = {
  stdin: string
  expected_stdout: string
  is_sample: boolean
  weight: number
  order_index: number
}

function parseCodingProblemTests(raw: unknown):
  | { ok: true; value: ParsedCodingTest[] }
  | { ok: false; message: string } {
  if (raw === undefined || raw === null) {
    return { ok: false, message: "Adaugă cel puțin un test (stdin + ieșire așteptată)." }
  }
  if (!Array.isArray(raw)) {
    return { ok: false, message: "tests trebuie să fie un array de obiecte." }
  }
  if (raw.length === 0) {
    return { ok: false, message: "Problema trebuie să aibă cel puțin un test pentru judge." }
  }

  const value: ParsedCodingTest[] = []
  let totalWeight = 0

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== "object") {
      return { ok: false, message: `Testul #${i + 1} trebuie să fie un obiect.` }
    }
    const o = item as Record<string, unknown>
    if (typeof o.stdin !== "string" || typeof o.expected_stdout !== "string") {
      return {
        ok: false,
        message: `Testul #${i + 1}: stdin și expected_stdout trebuie să fie stringuri (pot fi goale).`,
      }
    }

    const weightRaw = o.weight
    const weight =
      typeof weightRaw === "number" && Number.isFinite(weightRaw) && weightRaw >= 0
        ? weightRaw
        : typeof weightRaw === "string" && weightRaw.trim()
          ? Number.parseFloat(weightRaw)
          : 1

    if (!Number.isFinite(weight) || weight < 0) {
      return { ok: false, message: `Testul #${i + 1}: weight trebuie să fie un număr ≥ 0.` }
    }

    totalWeight += weight
    value.push({
      stdin: o.stdin,
      expected_stdout: o.expected_stdout,
      is_sample: o.is_sample === true,
      weight,
      order_index: i,
    })
  }

  if (totalWeight <= 0) {
    return { ok: false, message: "Suma ponderilor testelor trebuie să fie mai mare decât 0." }
  }

  return { ok: true, value }
}

function parseCodingTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

function nullableTrimmedString(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const s = raw.trim()
  return s.length ? s : null
}

/** String DB opțional păstrată ca trimisă (ex. intrări/ieșiri), gol → null */
function nullableAsProvidedString(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  return raw.length ? raw : null
}

function normalizeCodingDifficulty(raw: string): string {
  const key = raw.trim().toLowerCase()
  return CODING_DIFFICULTY[key] ?? raw.trim()
}

/**
 * GET ?catalog=physics|informatics|math — listă recentă (dev).
 * POST body: { catalog: "physics"|"informatics"|"math", ... } — adaugă o problemă (fără ștergere).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const catalog = new URL(req.url).searchParams.get("catalog")?.trim()
    if (catalog !== "physics" && catalog !== "informatics" && catalog !== "math") {
      return NextResponse.json(
        { error: "Parametrul catalog trebuie să fie physics, informatics sau math." },
        { status: 400 }
      )
    }

    const service = createServiceClient()

    if (catalog === "math") {
      const { data: rows, error } = await service
        .from("math_problems")
        .select(
          "id, title, difficulty, class, tags, answer_subpoints, image_url, youtube_url, is_active, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(300)

      if (error) {
        logger.error("[dev/problems] math list:", error)
        return NextResponse.json({ error: "Nu am putut încărca problemele de matematică." }, { status: 500 })
      }
      return NextResponse.json({ problems: rows || [] })
    }

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

    if (catalog !== "physics" && catalog !== "informatics" && catalog !== "math") {
      return NextResponse.json({ error: "catalog trebuie să fie physics, informatics sau math." }, { status: 400 })
    }

    const service = createServiceClient()

    if (catalog === "math") {
      const id = typeof body.id === "string" ? body.id.trim() : ""
      const title = typeof body.title === "string" ? body.title.trim() : ""
      const statement = typeof body.statement === "string" ? body.statement.trim() : ""
      const difficulty = typeof body.difficulty === "string" ? body.difficulty.trim() : ""
      const description =
        typeof body.description === "string" && body.description.trim() ? body.description.trim() : ""

      const classRaw = body.class
      const classNum =
        typeof classRaw === "number" && Number.isFinite(classRaw)
          ? Math.floor(classRaw)
          : typeof classRaw === "string"
            ? Number.parseInt(classRaw, 10)
            : NaN

      if (!id || !title || !statement || !difficulty) {
        return NextResponse.json(
          { error: "Câmpuri obligatorii: id, title, statement, difficulty." },
          { status: 400 }
        )
      }

      if (!MATH_DIFFICULTY_SET.has(difficulty)) {
        return NextResponse.json(
          { error: "Dificultate invalidă (Ușor, Mediu sau Avansat)." },
          { status: 400 }
        )
      }

      if (!CLASS_SET.has(classNum)) {
        return NextResponse.json({ error: "class trebuie să fie 9, 10, 11 sau 12." }, { status: 400 })
      }

      const parsedAnswers = parseMathAnswerSubpoints(body.answer_subpoints)
      if (!parsedAnswers.ok) {
        return NextResponse.json({ error: parsedAnswers.message }, { status: 400 })
      }

      const tags = parseCodingTags(body.tags)

      const imageRaw = body.image_url
      const ytRaw = body.youtube_url
      const image_url =
        typeof imageRaw === "string" && imageRaw.trim() ? imageRaw.trim() : null
      const youtube_url =
        typeof ytRaw === "string" && ytRaw.trim() ? ytRaw.trim() : null

      const insertRow: Record<string, unknown> = {
        id,
        title,
        description,
        statement,
        difficulty,
        class: classNum,
        tags,
        answer_subpoints: parsedAnswers.value,
        image_url,
        youtube_url,
        is_active: body.is_active === false ? false : true,
      }

      const { data, error } = await service
        .from("math_problems")
        .insert(insertRow)
        .select("id, title, class, difficulty")
        .single()

      if (error) {
        logger.error("[dev/problems] math insert:", error)
        return NextResponse.json(
          { error: error.message || "Nu am putut crea problema de matematică." },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, problem: data })
    }

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
      body.language === "python" || body.language === "cpp" ? body.language : "python"

    const insertRow: Record<string, unknown> = {
      slug,
      title,
      statement_markdown,
      requirement_markdown: nullableTrimmedString(body.requirement_markdown),
      input_format: nullableTrimmedString(body.input_format),
      output_format: nullableTrimmedString(body.output_format),
      constraints_markdown: nullableTrimmedString(body.constraints_markdown),
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
      tags: parseCodingTags(body.tags),
      is_active: body.is_active === false ? false : true,
      sample_input: nullableAsProvidedString(body.sample_input),
      sample_output: nullableAsProvidedString(body.sample_output),
      explanation_markdown: nullableTrimmedString(body.explanation_markdown),
      boilerplate_cpp: nullableAsProvidedString(body.boilerplate_cpp),
      boilerplate_python: nullableAsProvidedString(body.boilerplate_python),
      language,
    }

    const parsedTests = parseCodingProblemTests(body.tests)
    if (!parsedTests.ok) {
      return NextResponse.json({ error: parsedTests.message }, { status: 400 })
    }

    const { data, error } = await service.from("coding_problems").insert(insertRow).select("id, slug, title").single()
    if (error) {
      logger.error("[dev/problems] coding insert:", error)
      return NextResponse.json({ error: error.message || "Nu am putut crea problema de informatică." }, { status: 500 })
    }

    const testRows = parsedTests.value.map((t) => ({
      problem_id: data.id,
      stdin: t.stdin,
      expected_stdout: t.expected_stdout,
      is_sample: t.is_sample,
      weight: t.weight,
      order_index: t.order_index,
    }))

    const { error: testsError } = await service.from("coding_problem_tests").insert(testRows)
    if (testsError) {
      logger.error("[dev/problems] coding tests insert:", testsError)
      await service.from("coding_problems").delete().eq("id", data.id)
      return NextResponse.json(
        { error: testsError.message || "Nu am putut salva testele problemei." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, problem: data, tests_count: testRows.length })
  } catch (e) {
    logger.error("[dev/problems] POST:", e)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
