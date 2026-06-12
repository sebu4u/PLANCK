import type { Problem, ProblemValueSubpoint } from "@/data/problems"

function normalizeValueSubpoints(raw: unknown): ProblemValueSubpoint[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((subpoint) => {
      if (!subpoint || typeof subpoint !== "object") return null
      const o = subpoint as Record<string, unknown>
      const correct_value = Number(o.correct_value)
      if (!Number.isFinite(correct_value)) return null
      return {
        label: String(o.label ?? "").trim(),
        text_before: String(o.text_before ?? ""),
        text_after: String(o.text_after ?? ""),
        correct_value,
      }
    })
    .filter((s): s is ProblemValueSubpoint => s !== null)
    .slice(0, 3)
}

/** Adaptează un rând `math_problems` la forma `Problem` folosită de ProblemSection / EmbeddedProblemContent. */
export function mathProblemRowToProblem(row: {
  id: string
  title: string
  description: string
  statement: string
  tags: unknown
  class: number
  difficulty: string
  chapter?: string | null
  image_url?: string | null
  youtube_url?: string | null
  created_at: string
  answer_type?: string | null
  value_subpoints?: unknown
}): Problem {
  let tagsStr = ""
  if (Array.isArray(row.tags)) {
    tagsStr = row.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", ")
  }

  const yt = typeof row.youtube_url === "string" ? row.youtube_url.trim() : ""
  const valueSubpoints = normalizeValueSubpoints(row.value_subpoints)
  const hasValueAnswer = row.answer_type === "value" && valueSubpoints.length > 0

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    statement: row.statement,
    difficulty: row.difficulty,
    category:
      typeof row.chapter === "string" && row.chapter.trim() ? row.chapter.trim() : "Matematică",
    tags: tagsStr,
    youtube_url: yt,
    created_at: row.created_at,
    class: row.class,
    image_url: row.image_url ?? undefined,
    answer_type: hasValueAnswer ? "value" : null,
    value_subpoints: hasValueAnswer ? valueSubpoints : null,
    grila_options: null,
    grila_correct_index: null,
  }
}
