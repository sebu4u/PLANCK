import type { LearningPathItemPayload } from "@/lib/learning-path-item-loader"
import {
  isInteractiveLessonItemType,
  parseInteractiveItemContent,
  type LearningPathInteractiveItemType,
} from "@/lib/learning-path-interactive-items"
import { ITEM_TYPE_LABEL } from "@/components/invata/learning-path-item-body"

const MAX_TEXT_CHARS = 4000

function truncate(text: string, max = MAX_TEXT_CHARS): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function stripMarkdownForContext(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "[cod]")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "[imagine]")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_~`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function parseCustomTextBody(content: Record<string, unknown> | null | undefined): string | null {
  if (!content || typeof content !== "object") return null
  const body = content.body
  return typeof body === "string" && body.trim() ? body.trim() : null
}

function parsePollQuestion(content: Record<string, unknown> | null | undefined): string | null {
  if (!content || typeof content !== "object") return null
  const question = content.question
  return typeof question === "string" && question.trim() ? question.trim() : null
}

function formatInteractiveSummary(
  itemType: LearningPathInteractiveItemType,
  contentJson: Record<string, unknown> | null | undefined,
): string | null {
  const parsed = parseInteractiveItemContent(itemType, contentJson ?? null)
  if (!parsed.ok) return null
  const value = parsed.value as Record<string, unknown>
  const instructions =
    typeof value.instructions === "string" && value.instructions.trim()
      ? value.instructions.trim()
      : null
  if (instructions) return instructions
  if (itemType === "card_sort" && Array.isArray(value.cards)) {
    const cards = (value.cards as { text?: string }[])
      .map((c, i) => `${i + 1}. ${String(c.text ?? "").trim()}`)
      .filter((line) => line.length > 3)
    return cards.length ? `Carduri:\n${cards.join("\n")}` : null
  }
  if (itemType === "fill_slot" && typeof value.latexTemplate === "string") {
    return `Ecuație: ${value.latexTemplate.trim()}`
  }
  if (itemType === "reveal_steps" && Array.isArray(value.steps)) {
    return `Demonstrație în ${(value.steps as unknown[]).length} pași.`
  }
  return null
}

export function buildLearningPathItemBaseAiContext(payload: LearningPathItemPayload): string {
  const { item, chapter, lesson, sourceLesson, sourceProblem, sourceQuizQuestion, sourceCodingProblem } =
    payload
  const typeLabel = ITEM_TYPE_LABEL[item.item_type] ?? item.item_type
  const parts: string[] = [
    "Context exercițiu (learning path — Planck).",
    `Tip: ${typeLabel}.`,
    `Capitol: ${chapter.title}.`,
    `Lecție: ${lesson.title}.`,
    item.title?.trim() ? `Titlu item: ${item.title.trim()}.` : "",
    `Index pas: ${payload.itemIndex} din ${payload.items.length}.`,
  ]

  if (item.item_type === "text" && sourceLesson) {
    parts.push("", "Conținut lecție (extras):", truncate(stripMarkdownForContext(sourceLesson.content ?? "")))
  } else if (item.item_type === "custom_text") {
    const body = parseCustomTextBody(item.content_json ?? null)
    if (body) parts.push("", "Text:", truncate(stripMarkdownForContext(body)))
  } else if (item.item_type === "video") {
    parts.push("", item.youtube_url ? `Video YouTube: ${item.youtube_url}.` : "Lecție video.")
  } else if (item.item_type === "grila" && sourceQuizQuestion) {
    parts.push(
      "",
      "Enunț grilă:",
      sourceQuizQuestion.statement.trim(),
      sourceQuizQuestion.title?.trim() ? `Titlu: ${sourceQuizQuestion.title.trim()}.` : "",
    )
  } else if (
    (item.item_type === "problem" || item.item_type === "math_problem") &&
    sourceProblem
  ) {
    parts.push("", "Enunț problemă:", String(sourceProblem.statement ?? "").trim())
  } else if (item.item_type === "coding_problem" && sourceCodingProblem) {
    parts.push(
      "",
      "Enunț problemă informatică:",
      String(sourceCodingProblem.statement_markdown ?? sourceCodingProblem.title ?? "").trim(),
    )
  } else if (item.item_type === "poll") {
    const question = parsePollQuestion(item.content_json ?? null)
    if (question) parts.push("", "Întrebare sondaj:", question)
  } else if (item.item_type === "simulation") {
    parts.push("", "Simulare interactivă.")
  } else if (isInteractiveLessonItemType(item.item_type)) {
    const summary = formatInteractiveSummary(item.item_type, item.content_json ?? null)
    if (summary) parts.push("", summary)
  }

  return parts.filter((line) => line !== "").join("\n")
}

export function mergeLearningPathAiContext(base: string, dynamic: string | null | undefined): string {
  const dynamicTrimmed = dynamic?.trim()
  if (!dynamicTrimmed) return base.trim()
  if (!base.trim()) return dynamicTrimmed
  return `${base.trim()}\n\n--- Stare curentă ---\n${dynamicTrimmed}`
}
