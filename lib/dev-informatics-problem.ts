export const CODING_DIFFICULTIES = ["Inițiere", "Ușor", "Mediu", "Avansat", "Concurs"] as const

export const CLASS_SET = new Set([9, 10, 11, 12])

const CODING_DIFFICULTY: Record<string, string> = {
  "inițiere": "Inițiere",
  initiere: "Inițiere",
  "ușor": "Ușor",
  usor: "Ușor",
  mediu: "Mediu",
  avansat: "Avansat",
  concurs: "Concurs",
}

export type ParsedCodingTest = {
  stdin: string
  expected_stdout: string
  is_sample: boolean
  weight: number
  order_index: number
}

export function parseCodingProblemTests(raw: unknown):
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

export function parseCodingTags(raw: unknown): string[] {
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

export function nullableTrimmedString(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const s = raw.trim()
  return s.length ? s : null
}

export function nullableAsProvidedString(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  return raw.length ? raw : null
}

export function normalizeCodingDifficulty(raw: string): string {
  const key = raw.trim().toLowerCase()
  return CODING_DIFFICULTY[key] ?? raw.trim()
}

export function parseClassNumber(raw: unknown, fallback = 9): number | null {
  const classNum =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.floor(raw)
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : fallback
  return CLASS_SET.has(classNum) ? classNum : null
}

export function buildInformaticsProblemRow(body: Record<string, unknown>): {
  ok: true
  row: Record<string, unknown>
  tests: ParsedCodingTest[]
} | { ok: false; message: string } {
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const statement_markdown = typeof body.statement_markdown === "string" ? body.statement_markdown.trim() : ""
  const chapter =
    typeof body.chapter === "string" && body.chapter.trim() ? body.chapter.trim() : "Capitol neclasificat"

  const classNum = parseClassNumber(body.class)
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      message: "slug obligatoriu (litere mici, cifre și cratime, ex: suma-cifrelor).",
    }
  }
  if (!title || !statement_markdown) {
    return { ok: false, message: "title și statement_markdown sunt obligatorii." }
  }
  if (classNum === null) {
    return { ok: false, message: "class trebuie să fie 9, 10, 11 sau 12." }
  }

  const diffRaw = typeof body.difficulty === "string" ? body.difficulty.trim() : "Ușor"
  const difficulty = normalizeCodingDifficulty(diffRaw)
  const language = body.language === "python" || body.language === "cpp" ? body.language : "python"

  const parsedTests = parseCodingProblemTests(body.tests)
  if (!parsedTests.ok) {
    return { ok: false, message: parsedTests.message }
  }

  const row: Record<string, unknown> = {
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

  return { ok: true, row, tests: parsedTests.value }
}
