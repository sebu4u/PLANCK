import "server-only"

import type { SupabaseAnyClient, PersonalizedCourseCatalogCandidate } from "@/lib/personalized-courses/types"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"
import { slugify } from "@/lib/slug"

const ROMANIAN_STOP_WORDS = new Set([
  "azi",
  "vreau",
  "doresc",
  "sa",
  "să",
  "invăț",
  "invat",
  "învaț",
  "despre",
  "pentru",
  "care",
  "cum",
  "ce",
  "este",
  "sunt",
  "curs",
  "cursul",
  "lectie",
  "lecție",
  "lectia",
  "lecția",
  "concept",
  "conceptul",
  "notiune",
  "noțiune",
  "notiuni",
  "noțiuni",
  "baza",
  "bază",
  "baze",
  "introducere",
  "aplicare",
  "aplicatii",
  "aplicații",
  "aprofundare",
  "recapitulare",
  "exercitiu",
  "exercițiu",
  "exercitii",
  "exerciții",
  "problema",
  "problemă",
  "probleme",
  "intelegere",
  "înțelegere",
  "din",
  "la",
  "cu",
  "si",
  "și",
  "un",
  "o",
  "de",
  "pe",
])

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function extractTerms(prompt: string): string[] {
  const normalized = normalizeText(prompt)
  const terms = normalized
    .split(/[^a-z0-9]+/g)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !ROMANIAN_STOP_WORDS.has(term))

  return Array.from(new Set(terms)).slice(0, 10)
}

function escapeIlike(value: string): string {
  return value.replace(/[%_]/g, "")
}

function buildOrPattern(terms: string[]): string {
  // Use the longest term for ilike (most specific), plus OR for each term
  if (!terms.length) return "%a%"
  const escaped = terms.map(escapeIlike).filter(Boolean)
  if (!escaped.length) return "%a%"
  // Single broad pattern with the first term
  return `%${escaped[0]}%`
}

function buildMultiOrFilter(column: string, terms: string[]): string {
  const escaped = terms.map(escapeIlike).filter((t) => t.length >= 3)
  if (!escaped.length) return `${column}.ilike.%a%`
  return escaped.map((t) => `${column}.ilike.%${t}%`).join(",")
}

function scoreCandidate(promptTerms: string[], haystack: string): number {
  const normalized = normalizeText(haystack)
  let score = 0
  for (const term of promptTerms) {
    if (normalized.includes(term)) score += term.length >= 6 ? 3 : 2
  }
  return score
}

function compactSummary(...parts: unknown[]): string {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" · ")
    .slice(0, 700)
}

function candidateLimit(limit: number): number {
  return Math.max(4, Math.min(limit, 160))
}

function sortAndLimit(
  candidates: PersonalizedCourseCatalogCandidate[],
  terms: string[],
  limit: number,
): PersonalizedCourseCatalogCandidate[] {
  const deduped = new Map<string, PersonalizedCourseCatalogCandidate>()
  for (const candidate of candidates) {
    if (!deduped.has(candidate.key)) deduped.set(candidate.key, candidate)
  }

  return Array.from(deduped.values())
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(
        terms,
        `${candidate.title} ${candidate.summary} ${Object.values(candidate.metadata ?? {}).join(" ")}`,
      ),
    }))
    .filter((row) => row.score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, candidateLimit(limit))
    .map((row) => row.candidate)
}

type LearningPathItemSearchRow = {
  id: string
  lesson_id: string | null
  item_type: string | null
  title: string | null
  cursuri_lesson_slug: string | null
  youtube_url: string | null
  quiz_question_id: string | null
  problem_id: string | null
  content_json?: unknown
}

function addLearningPathItemCandidate(
  candidates: PersonalizedCourseCatalogCandidate[],
  row: LearningPathItemSearchRow,
  context: Record<string, unknown> = {},
) {
  candidates.push({
    key: `learning_path_item:${row.id}`,
    source_type: "learning_path_item",
    source_id: String(row.id),
    source_table: "learning_path_lesson_items",
    item_type: (row.item_type || "custom_text") as LearningPathLessonType,
    title: String(row.title ?? `Item ${row.item_type ?? "Planck"}`),
    summary: compactSummary(
      context.chapter_title,
      context.lesson_title,
      row.cursuri_lesson_slug,
      row.youtube_url,
      row.quiz_question_id,
      row.problem_id,
      JSON.stringify(row.content_json ?? {}).slice(0, 300),
    ),
    url: null,
    metadata: {
      ...context,
      lesson_id: row.lesson_id,
      cursuri_lesson_slug: row.cursuri_lesson_slug,
      youtube_url: row.youtube_url,
      quiz_question_id: row.quiz_question_id,
      problem_id: row.problem_id,
    },
  })
}

async function fetchLearningPathCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const candidates: PersonalizedCourseCatalogCandidate[] = []

  // If a prompt matches a chapter, offer that chapter's concrete lesson items.
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data: chapters } = await supabase
      .from("learning_path_chapters")
      .select("id, slug, title, description, problem_category, materie")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},description.ilike.${pattern},problem_category.ilike.${pattern}`)
      .limit(20)

    const chapterRows = chapters ?? []
    const chapterIds = chapterRows.map((row) => String(row.id)).filter(Boolean)
    if (!chapterIds.length) continue

    const chapterById = new Map(chapterRows.map((row) => [String(row.id), row]))
    const { data: lessons } = await supabase
      .from("learning_path_lessons")
      .select("id, chapter_id, title, description")
      .eq("is_active", true)
      .in("chapter_id", chapterIds)
      .order("order_index", { ascending: true })
      .limit(80)

    const lessonRows = lessons ?? []
    const lessonIds = lessonRows.map((row) => String(row.id)).filter(Boolean)
    if (!lessonIds.length) continue

    const lessonById = new Map(lessonRows.map((row) => [String(row.id), row]))
    const { data: items } = await supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json")
      .eq("is_active", true)
      .in("lesson_id", lessonIds)
      .order("order_index", { ascending: true })
      .limit(120)

    for (const row of items ?? []) {
      const lesson = row.lesson_id ? lessonById.get(String(row.lesson_id)) : null
      const chapter = lesson?.chapter_id ? chapterById.get(String(lesson.chapter_id)) : null
      addLearningPathItemCandidate(candidates, row, {
        matched_by: "chapter",
        chapter_id: chapter?.id ?? null,
        chapter_title: chapter?.title ?? null,
        lesson_title: lesson?.title ?? null,
      })
    }
  }

  // If a prompt matches a lesson, offer that lesson's concrete items.
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data: lessons } = await supabase
      .from("learning_path_lessons")
      .select("id, slug, chapter_id, title, description")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(25)

    const lessonRows = lessons ?? []
    const lessonIds = lessonRows.map((row) => String(row.id)).filter(Boolean)
    if (!lessonIds.length) continue

    const lessonById = new Map(lessonRows.map((row) => [String(row.id), row]))
    const { data: items } = await supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json")
      .eq("is_active", true)
      .in("lesson_id", lessonIds)
      .order("order_index", { ascending: true })
      .limit(80)

    for (const row of items ?? []) {
      const lesson = row.lesson_id ? lessonById.get(String(row.lesson_id)) : null
      addLearningPathItemCandidate(candidates, row, {
        matched_by: "lesson",
        chapter_id: lesson?.chapter_id ?? null,
        lesson_title: lesson?.title ?? null,
      })
    }
  }

  // Search lesson items with each term
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data: items } = await supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},cursuri_lesson_slug.ilike.${pattern}`)
      .limit(30)
    for (const row of items ?? []) {
      addLearningPathItemCandidate(candidates, row, { matched_by: "item" })
    }
  }

  return candidates
}

async function fetchProblemCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("problems")
      .select("id, title, description, statement, difficulty, category, tags, class")
      .or(`title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},category.ilike.${pattern},tags.ilike.${pattern}`)
      .limit(30)
    for (const row of data ?? []) {
      candidates.push({
        key: `problem:${row.id}`,
        source_type: "problem",
        source_id: String(row.id),
        source_table: "problems",
        item_type: "problem",
        title: String(row.title ?? row.id),
        summary: compactSummary(row.description, row.statement, row.category, row.difficulty, row.tags),
        url: `/probleme/${row.id}`,
        metadata: { difficulty: row.difficulty, category: row.category, class: row.class, tags: row.tags },
      })
    }
  }
  return candidates
}

async function fetchQuizCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("quiz_questions")
      .select("id, question_id, title, description, statement, difficulty, class, materie, tags")
      .or(`title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},question_id.ilike.${pattern}`)
      .limit(30)
    for (const row of data ?? []) {
      candidates.push({
        key: `quiz_question:${row.id}`,
        source_type: "quiz_question",
        source_id: String(row.id),
        source_table: "quiz_questions",
        item_type: "grila",
        title: String(row.title ?? row.question_id ?? "Întrebare grilă"),
        summary: compactSummary(row.description, row.statement, row.difficulty, row.class, row.materie, Array.isArray(row.tags) ? row.tags.join(", ") : ""),
        url: `/grile?question=${row.id}`,
        metadata: { question_id: row.question_id, difficulty: row.difficulty, class: row.class, materie: row.materie },
      })
    }
  }
  return candidates
}

async function fetchMathCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("math_problems")
      .select("id, title, description, statement, tags, class, difficulty, chapter, is_active")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},chapter.ilike.${pattern}`)
      .limit(30)
    for (const row of data ?? []) {
      candidates.push({
        key: `math_problem:${row.id}`,
        source_type: "math_problem",
        source_id: String(row.id),
        source_table: "math_problems",
        item_type: "math_problem",
        title: String(row.title ?? row.id),
        summary: compactSummary(row.description, row.statement, row.chapter, row.difficulty, Array.isArray(row.tags) ? row.tags.join(", ") : ""),
        url: `/matematica/probleme/${row.id}`,
        metadata: { difficulty: row.difficulty, class: row.class, chapter: row.chapter, tags: row.tags },
      })
    }
  }
  return candidates
}

async function fetchCodingCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("coding_problems")
      .select("id, slug, title, statement_markdown, difficulty, class, chapter, tags, is_active, language")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},statement_markdown.ilike.${pattern},chapter.ilike.${pattern},slug.ilike.${pattern}`)
      .limit(30)
    for (const row of data ?? []) {
      candidates.push({
        key: `coding_problem:${row.id}`,
        source_type: "coding_problem",
        source_id: String(row.id),
        source_table: "coding_problems",
        item_type: "coding_problem",
        title: String(row.title ?? row.slug ?? row.id),
        summary: compactSummary(row.statement_markdown, row.chapter, row.difficulty, row.language, Array.isArray(row.tags) ? row.tags.join(", ") : ""),
        url: `/informatica/probleme/${row.slug ?? slugify(String(row.title ?? row.id))}`,
        metadata: { slug: row.slug, difficulty: row.difficulty, class: row.class, chapter: row.chapter, language: row.language, tags: row.tags },
      })
    }
  }
  return candidates
}

export async function searchPlanckContentForPrompt(
  supabase: SupabaseAnyClient,
  prompt: string,
  limit = 80,
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const terms = extractTerms(prompt)
  if (!terms.length) return []

  const results = await Promise.allSettled([
    fetchLearningPathCandidates(supabase, terms),
    fetchProblemCandidates(supabase, terms),
    fetchQuizCandidates(supabase, terms),
    fetchMathCandidates(supabase, terms),
    fetchCodingCandidates(supabase, terms),
  ])

  const candidates = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
  return sortAndLimit(candidates, terms, limit)
}
