export interface TestProblemOption {
  id: string
  label: string
}

export interface TestProblem {
  id: string
  statement: string
  imageUrl: string | null
  options: TestProblemOption[]
  correctOptionId: string
}

export interface TestPublicProblem {
  id: string
  statement: string
  imageUrl: string | null
  options: TestProblemOption[]
}

export interface TestContent {
  icon: string | null
  description: string
  difficulty: number
  timeLimitSeconds: number
  problems: TestProblem[]
}

export interface TestPublicContent {
  icon: string | null
  description: string
  difficulty: number
  timeLimitSeconds: number
  problems: TestPublicProblem[]
}

const PASS_THRESHOLD = 0.8 as const

export function getTestPassThreshold(): number {
  return PASS_THRESHOLD
}

export function isTestImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function toIntInRange(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Math.floor(value)))
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return Math.max(min, Math.min(max, parsed))
  }
  return fallback
}

function parseProblemOption(value: unknown): TestProblemOption | null {
  const record = toRecord(value)
  if (!record) return null
  const id = toStringSafe(record.id).trim()
  const label = toStringSafe(record.label)
  if (!id || !label.trim()) return null
  return { id, label }
}

function parseProblem(value: unknown): TestProblem | null {
  const record = toRecord(value)
  if (!record) return null
  const id = toStringSafe(record.id).trim()
  const statement = toStringSafe(record.statement)
  if (!id || !statement.trim()) return null

  const rawOptions = Array.isArray(record.options) ? record.options : []
  const options: TestProblemOption[] = []
  for (const opt of rawOptions) {
    const parsed = parseProblemOption(opt)
    if (parsed) options.push(parsed)
  }
  if (options.length < 2 || options.length > 4) return null

  const correctOptionId = toStringSafe(record.correctOptionId).trim()
  if (!correctOptionId || !options.some((o) => o.id === correctOptionId)) return null

  const imageUrlRaw = toStringSafe(record.imageUrl).trim()
  const imageUrl = imageUrlRaw && isTestImageUrl(imageUrlRaw) ? imageUrlRaw : null

  return { id, statement, imageUrl, options, correctOptionId }
}

export function parseTestContent(content: Record<string, unknown> | null | undefined): TestContent | null {
  const record = toRecord(content)
  if (!record) return null

  const description = toStringSafe(record.description)
  const difficulty = toIntInRange(record.difficulty, 1, 5, 1)
  const timeLimitSeconds = toIntInRange(record.timeLimitSeconds, 30, 4 * 60 * 60, 600)

  const rawIcon = toStringSafe(record.icon).trim()
  const icon = rawIcon ? rawIcon : null

  const rawProblems = Array.isArray(record.problems) ? record.problems : []
  const problems: TestProblem[] = []
  for (const problem of rawProblems) {
    const parsed = parseProblem(problem)
    if (parsed) problems.push(parsed)
  }
  if (problems.length === 0) return null

  return { icon, description, difficulty, timeLimitSeconds, problems }
}

export function toPublicTestContent(content: TestContent): TestPublicContent {
  return {
    icon: content.icon,
    description: content.description,
    difficulty: content.difficulty,
    timeLimitSeconds: content.timeLimitSeconds,
    problems: content.problems.map((p) => ({
      id: p.id,
      statement: p.statement,
      imageUrl: p.imageUrl,
      options: p.options.map((o) => ({ id: o.id, label: o.label })),
    })),
  }
}

/**
 * Strip `correctOptionId` from a raw `content_json` object so we don't leak the
 * answers when serializing items to client components. Only mutates the
 * structure for `test` items; non-test content_json passes through untouched.
 */
export function sanitizeTestContentJson(
  itemType: string,
  contentJson: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (itemType !== "test") return contentJson ?? null
  const parsed = parseTestContent(contentJson ?? null)
  if (!parsed) return contentJson ?? null
  const publicContent = toPublicTestContent(parsed)
  return publicContent as unknown as Record<string, unknown>
}

export interface TestValidationOptions {
  minProblems?: number
}

export function validateTestContent(
  content: unknown,
  options: TestValidationOptions = {}
): string | null {
  const minProblems = Math.max(1, options.minProblems ?? 1)
  const record = toRecord(content)
  if (!record) return "content_json este obligatoriu pentru testul de tip test."

  if (!Array.isArray(record.problems) || record.problems.length < minProblems) {
    return `Testul trebuie să aibă cel puțin ${minProblems} ${minProblems === 1 ? "problemă" : "probleme"}.`
  }
  const difficulty = toIntInRange(record.difficulty, 1, 5, -1)
  if (difficulty === -1) return "Dificultatea testului trebuie să fie un întreg între 1 și 5."

  const timeLimit = toIntInRange(record.timeLimitSeconds, 30, 4 * 60 * 60, -1)
  if (timeLimit === -1) {
    return "Timpul testului trebuie să fie între 30 secunde și 4 ore."
  }

  const seenProblemIds = new Set<string>()
  for (let i = 0; i < record.problems.length; i++) {
    const problem = record.problems[i]
    const parsed = parseProblem(problem)
    if (!parsed) {
      return `Problema #${i + 1} este invalidă (verifică enunțul, 2-4 variante și răspunsul corect).`
    }
    if (seenProblemIds.has(parsed.id)) {
      return `Problema #${i + 1} are un id duplicat (${parsed.id}).`
    }
    seenProblemIds.add(parsed.id)

    const optionIds = new Set<string>()
    for (const opt of parsed.options) {
      if (optionIds.has(opt.id)) {
        return `Problema #${i + 1} are id-uri duplicate de variante (${opt.id}).`
      }
      optionIds.add(opt.id)
    }

    const rawProblem = toRecord(problem)
    const rawImage = toStringSafe(rawProblem?.imageUrl).trim()
    if (rawImage && !isTestImageUrl(rawImage)) {
      return `Problema #${i + 1}: URL-ul imaginii trebuie să fie http(s) valid.`
    }
  }

  return null
}
