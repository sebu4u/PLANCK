import type { Problem } from "@/data/problems"

/** Adaptează un rând `math_problems` la forma `Problem` folosită de ProblemSection / EmbeddedProblemContent. */
export function mathProblemRowToProblem(row: {
  id: string
  title: string
  description: string
  statement: string
  tags: unknown
  class: number
  difficulty: string
  image_url?: string | null
  youtube_url?: string | null
  created_at: string
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

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    statement: row.statement,
    difficulty: row.difficulty,
    category: "Matematică",
    tags: tagsStr,
    youtube_url: yt,
    created_at: row.created_at,
    class: row.class,
    image_url: row.image_url ?? undefined,
    answer_type: null,
    value_subpoints: null,
    grila_options: null,
    grila_correct_index: null,
  }
}
