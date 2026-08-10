import type { PracticeSubjectId } from "@/lib/practice-subject"

export const PRACTICE_TEST_DIFFICULTIES = ["Ușor", "Mediu", "Avansat"] as const
export type PracticeTestDifficulty = (typeof PRACTICE_TEST_DIFFICULTIES)[number]

export const PRACTICE_TEST_CATALOG_SUBJECTS = ["fizica", "matematica"] as const
export type PracticeTestCatalogSubject = (typeof PRACTICE_TEST_CATALOG_SUBJECTS)[number]

export interface PracticeTestCatalogItem {
  type: "catalog"
  id: string
  subject: PracticeTestCatalogSubject
  problemId: string
}

export interface PracticeTestCustomOption {
  id: string
  label: string
}

export interface PracticeTestCustomValueSubpoint {
  label?: string
  text_before?: string
  text_after?: string
  correct_value: number
}

export interface PracticeTestCustomItem {
  type: "custom"
  id: string
  answerType: "grila" | "value"
  statement: string
  imageUrl?: string | null
  options?: PracticeTestCustomOption[]
  correctOptionId?: string
  valueSubpoints?: PracticeTestCustomValueSubpoint[]
}

export type PracticeTestItem = PracticeTestCatalogItem | PracticeTestCustomItem

export interface PracticeTestRow {
  id: string
  title: string
  description: string
  subject: PracticeSubjectId
  class: number
  chapter: string
  difficulty: PracticeTestDifficulty
  time_limit_seconds: number
  items: PracticeTestItem[]
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface PracticeTestListItem {
  id: string
  title: string
  description: string
  subject: PracticeSubjectId
  class: number
  chapter: string
  difficulty: PracticeTestDifficulty
  time_limit_seconds: number
  problem_count: number
  created_at: string
}

export interface PracticeTestPublicValueSubpoint {
  label: string
  text_before: string
  text_after: string
}

export interface PracticeTestPublicItem {
  id: string
  type: "catalog" | "custom"
  answerType: "grila" | "value" | "unknown"
  title: string | null
  statement: string
  imageUrl: string | null
  options: PracticeTestCustomOption[] | null
  valueSubpoints: PracticeTestPublicValueSubpoint[] | null
  catalogSubject?: PracticeTestCatalogSubject
  problemId?: string
}

export type PracticeTestAnswerPayload =
  | { type: "grila"; optionId: string }
  | { type: "value"; values: number[] }

export type PracticeTestAnswersMap = Record<string, PracticeTestAnswerPayload>

export interface PracticeTestItemResult {
  itemId: string
  correct: boolean
  userAnswer: PracticeTestAnswerPayload | null
  correctAnswer: {
    type: "grila"
    optionId: string
    label?: string
  } | {
    type: "value"
    values: number[]
  } | {
    type: "unknown"
  }
}

export interface PracticeTestAttemptRow {
  id: string
  test_id: string
  user_id: string
  started_at: string
  submitted_at: string | null
  exceeded_time: boolean
  score_correct: number | null
  score_total: number | null
  answers: PracticeTestAnswersMap
  results: PracticeTestItemResult[] | null
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

export function isPracticeTestDifficulty(value: unknown): value is PracticeTestDifficulty {
  return typeof value === "string" && (PRACTICE_TEST_DIFFICULTIES as readonly string[]).includes(value)
}

export function isPracticeTestCatalogSubject(value: unknown): value is PracticeTestCatalogSubject {
  return typeof value === "string" && (PRACTICE_TEST_CATALOG_SUBJECTS as readonly string[]).includes(value)
}

export function isWithinTolerance(userValue: number, correctValue: number): boolean {
  if (correctValue === 0) {
    return Math.abs(userValue) <= 0.001
  }
  const tolerance = Math.abs(correctValue) * 0.05
  return Math.abs(userValue - correctValue) <= tolerance
}

function isImageUrl(value: unknown): value is string {
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

function parseCustomOption(value: unknown): PracticeTestCustomOption | null {
  const record = toRecord(value)
  if (!record) return null
  const id = toStringSafe(record.id).trim()
  const label = toStringSafe(record.label)
  if (!id || !label.trim()) return null
  return { id, label }
}

function parseCustomValueSubpoint(value: unknown): PracticeTestCustomValueSubpoint | null {
  const record = toRecord(value)
  if (!record) return null
  const correct_value = Number(record.correct_value)
  if (!Number.isFinite(correct_value)) return null
  return {
    label: toStringSafe(record.label).trim() || undefined,
    text_before: toStringSafe(record.text_before) || undefined,
    text_after: toStringSafe(record.text_after) || undefined,
    correct_value,
  }
}

export function parsePracticeTestItem(value: unknown): PracticeTestItem | null {
  const record = toRecord(value)
  if (!record) return null
  const id = toStringSafe(record.id).trim()
  if (!id) return null

  if (record.type === "catalog") {
    if (!isPracticeTestCatalogSubject(record.subject)) return null
    const problemId = toStringSafe(record.problemId).trim()
    if (!problemId) return null
    return { type: "catalog", id, subject: record.subject, problemId }
  }

  if (record.type === "custom") {
    const answerType = record.answerType === "grila" || record.answerType === "value" ? record.answerType : null
    const statement = toStringSafe(record.statement)
    if (!answerType || !statement.trim()) return null

    const imageUrlRaw = toStringSafe(record.imageUrl).trim()
    const imageUrl = imageUrlRaw && isImageUrl(imageUrlRaw) ? imageUrlRaw : null

    if (answerType === "grila") {
      const rawOptions = Array.isArray(record.options) ? record.options : []
      const options: PracticeTestCustomOption[] = []
      for (const opt of rawOptions) {
        const parsed = parseCustomOption(opt)
        if (parsed) options.push(parsed)
      }
      if (options.length < 2 || options.length > 6) return null
      const correctOptionId = toStringSafe(record.correctOptionId).trim()
      if (!correctOptionId || !options.some((o) => o.id === correctOptionId)) return null
      return { type: "custom", id, answerType, statement, imageUrl, options, correctOptionId }
    }

    const rawSubpoints = Array.isArray(record.valueSubpoints) ? record.valueSubpoints : []
    const valueSubpoints: PracticeTestCustomValueSubpoint[] = []
    for (const sp of rawSubpoints) {
      const parsed = parseCustomValueSubpoint(sp)
      if (parsed) valueSubpoints.push(parsed)
    }
    if (valueSubpoints.length < 1 || valueSubpoints.length > 5) return null
    return { type: "custom", id, answerType, statement, imageUrl, valueSubpoints }
  }

  return null
}

export function parsePracticeTestItems(value: unknown): PracticeTestItem[] {
  if (!Array.isArray(value)) return []
  const items: PracticeTestItem[] = []
  const seenIds = new Set<string>()
  for (const raw of value) {
    const parsed = parsePracticeTestItem(raw)
    if (!parsed) continue
    if (seenIds.has(parsed.id)) continue
    seenIds.add(parsed.id)
    items.push(parsed)
  }
  return items
}

export function validatePracticeTestItems(items: unknown): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return "Testul trebuie să aibă cel puțin o problemă."
  }
  const parsed = parsePracticeTestItems(items)
  if (parsed.length !== items.length) {
    return "Unele probleme din test sunt invalide."
  }
  return null
}

export function toPublicCustomItem(item: PracticeTestCustomItem): PracticeTestPublicItem {
  return {
    id: item.id,
    type: "custom",
    answerType: item.answerType,
    title: null,
    statement: item.statement,
    imageUrl: item.imageUrl ?? null,
    options:
      item.answerType === "grila" && item.options
        ? item.options.map((o) => ({ id: o.id, label: o.label }))
        : null,
    valueSubpoints:
      item.answerType === "value" && item.valueSubpoints
        ? item.valueSubpoints.map((sp) => ({
            label: sp.label ?? "",
            text_before: sp.text_before ?? "",
            text_after: sp.text_after ?? "",
          }))
        : null,
  }
}

export function stripSecretsFromPublicItem(item: PracticeTestPublicItem): PracticeTestPublicItem {
  return item
}

export function formatPracticeTestDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  if (m > 0) {
    return s > 0 ? `${m} min ${s}s` : `${m} min`
  }
  return `${s}s`
}

export function computeExceededTime(startedAtIso: string, timeLimitSeconds: number, now = new Date()): boolean {
  const started = Date.parse(startedAtIso)
  if (!Number.isFinite(started)) return false
  const elapsedMs = now.getTime() - started
  return elapsedMs > timeLimitSeconds * 1000
}

export function secondsRemaining(startedAtIso: string, timeLimitSeconds: number, now = new Date()): number {
  const started = Date.parse(startedAtIso)
  if (!Number.isFinite(started)) return timeLimitSeconds
  const elapsed = Math.floor((now.getTime() - started) / 1000)
  return Math.max(0, timeLimitSeconds - elapsed)
}

export function parseAnswerPayload(value: unknown): PracticeTestAnswerPayload | null {
  const record = toRecord(value)
  if (!record) return null
  if (record.type === "grila") {
    const optionId = toStringSafe(record.optionId).trim()
    if (!optionId) return null
    return { type: "grila", optionId }
  }
  if (record.type === "value") {
    if (!Array.isArray(record.values)) return null
    const values = record.values.map((v) => Number(v))
    if (values.some((v) => !Number.isFinite(v))) return null
    return { type: "value", values }
  }
  return null
}

export function parseAnswersMap(value: unknown): PracticeTestAnswersMap {
  const record = toRecord(value)
  if (!record) return {}
  const out: PracticeTestAnswersMap = {}
  for (const [key, raw] of Object.entries(record)) {
    const parsed = parseAnswerPayload(raw)
    if (parsed) out[key] = parsed
  }
  return out
}

export function gradeCustomItem(
  item: PracticeTestCustomItem,
  answer: PracticeTestAnswerPayload | null,
): PracticeTestItemResult {
  if (item.answerType === "grila") {
    const correctOptionId = item.correctOptionId ?? ""
    const label = item.options?.find((o) => o.id === correctOptionId)?.label
    const correct =
      answer?.type === "grila" && Boolean(correctOptionId) && answer.optionId === correctOptionId
    return {
      itemId: item.id,
      correct,
      userAnswer: answer,
      correctAnswer: { type: "grila", optionId: correctOptionId, label },
    }
  }

  const correctValues = (item.valueSubpoints ?? []).map((sp) => sp.correct_value)
  const correct =
    answer?.type === "value" &&
    answer.values.length === correctValues.length &&
    answer.values.every((v, i) => isWithinTolerance(v, correctValues[i]))

  return {
    itemId: item.id,
    correct,
    userAnswer: answer,
    correctAnswer: { type: "value", values: correctValues },
  }
}

export function gradeCatalogPhysics(
  itemId: string,
  problem: {
    answer_type?: string | null
    grila_correct_index?: number | null
    grila_options?: string[] | null
    value_subpoints?: Array<{ correct_value?: number }> | null
  },
  answer: PracticeTestAnswerPayload | null,
): PracticeTestItemResult {
  if (problem.answer_type === "grila") {
    const correctIndex = Number(problem.grila_correct_index ?? -1)
    const optionId = String(correctIndex)
    const label =
      Array.isArray(problem.grila_options) && correctIndex >= 0
        ? String(problem.grila_options[correctIndex] ?? "")
        : undefined
    const correct = answer?.type === "grila" && answer.optionId === optionId
    return {
      itemId,
      correct,
      userAnswer: answer,
      correctAnswer: { type: "grila", optionId, label },
    }
  }

  if (problem.answer_type === "value") {
    const correctValues = Array.isArray(problem.value_subpoints)
      ? problem.value_subpoints
          .map((sp) => Number(sp?.correct_value))
          .filter((v) => Number.isFinite(v))
      : []
    const correct =
      answer?.type === "value" &&
      answer.values.length === correctValues.length &&
      answer.values.every((v, i) => isWithinTolerance(v, correctValues[i]))
    return {
      itemId,
      correct,
      userAnswer: answer,
      correctAnswer: { type: "value", values: correctValues },
    }
  }

  return {
    itemId,
    correct: false,
    userAnswer: answer,
    correctAnswer: { type: "unknown" },
  }
}

export function gradeCatalogMath(
  itemId: string,
  problem: {
    answer_type?: string | null
    value_subpoints?: Array<{ correct_value?: number }> | null
  },
  answer: PracticeTestAnswerPayload | null,
): PracticeTestItemResult {
  if (problem.answer_type === "value") {
    const correctValues = Array.isArray(problem.value_subpoints)
      ? problem.value_subpoints
          .map((sp) => Number(sp?.correct_value))
          .filter((v) => Number.isFinite(v))
      : []
    const correct =
      answer?.type === "value" &&
      answer.values.length === correctValues.length &&
      answer.values.every((v, i) => isWithinTolerance(v, correctValues[i]))
    return {
      itemId,
      correct,
      userAnswer: answer,
      correctAnswer: { type: "value", values: correctValues },
    }
  }

  return {
    itemId,
    correct: false,
    userAnswer: answer,
    correctAnswer: { type: "unknown" },
  }
}

export function catalogPhysicsToPublicItem(
  item: PracticeTestCatalogItem,
  problem: {
    title?: string | null
    statement?: string | null
    image_url?: string | null
    answer_type?: string | null
    grila_options?: string[] | null
    value_subpoints?: Array<{
      label?: string
      text_before?: string
      text_after?: string
    }> | null
  },
): PracticeTestPublicItem {
  const answerType =
    problem.answer_type === "grila" || problem.answer_type === "value" ? problem.answer_type : "unknown"

  return {
    id: item.id,
    type: "catalog",
    answerType,
    title: problem.title ?? null,
    statement: problem.statement ?? "",
    imageUrl: problem.image_url ?? null,
    options:
      answerType === "grila" && Array.isArray(problem.grila_options)
        ? problem.grila_options.map((label, index) => ({ id: String(index), label: String(label) }))
        : null,
    valueSubpoints:
      answerType === "value" && Array.isArray(problem.value_subpoints)
        ? problem.value_subpoints.map((sp) => ({
            label: String(sp?.label ?? ""),
            text_before: String(sp?.text_before ?? ""),
            text_after: String(sp?.text_after ?? ""),
          }))
        : null,
    catalogSubject: item.subject,
    problemId: item.problemId,
  }
}

export function catalogMathToPublicItem(
  item: PracticeTestCatalogItem,
  problem: {
    title?: string | null
    statement?: string | null
    image_url?: string | null
    answer_type?: string | null
    value_subpoints?: Array<{
      label?: string
      text_before?: string
      text_after?: string
    }> | null
  },
): PracticeTestPublicItem {
  const answerType = problem.answer_type === "value" ? "value" : "unknown"
  return {
    id: item.id,
    type: "catalog",
    answerType,
    title: problem.title ?? null,
    statement: problem.statement ?? "",
    imageUrl: problem.image_url ?? null,
    options: null,
    valueSubpoints:
      answerType === "value" && Array.isArray(problem.value_subpoints)
        ? problem.value_subpoints.map((sp) => ({
            label: String(sp?.label ?? ""),
            text_before: String(sp?.text_before ?? ""),
            text_after: String(sp?.text_after ?? ""),
          }))
        : null,
    catalogSubject: item.subject,
    problemId: item.problemId,
  }
}

export function normalizeTestRow(row: Record<string, unknown>): PracticeTestRow | null {
  const id = toStringSafe(row.id).trim()
  const title = toStringSafe(row.title).trim()
  const subject = toStringSafe(row.subject).trim()
  if (!id || !title) return null
  if (subject !== "fizica" && subject !== "matematica" && subject !== "informatica") return null
  const difficulty = row.difficulty
  if (!isPracticeTestDifficulty(difficulty)) return null
  const classNum = toIntInRange(row.class, 9, 12, -1)
  if (classNum === -1) return null

  return {
    id,
    title,
    description: toStringSafe(row.description),
    subject,
    class: classNum,
    chapter: toStringSafe(row.chapter),
    difficulty,
    time_limit_seconds: toIntInRange(row.time_limit_seconds, 30, 14400, 600),
    items: parsePracticeTestItems(row.items),
    is_published: Boolean(row.is_published),
    created_at: toStringSafe(row.created_at),
    updated_at: toStringSafe(row.updated_at),
  }
}

export function toListItem(row: PracticeTestRow): PracticeTestListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    class: row.class,
    chapter: row.chapter,
    difficulty: row.difficulty,
    time_limit_seconds: row.time_limit_seconds,
    problem_count: row.items.length,
    created_at: row.created_at,
  }
}
