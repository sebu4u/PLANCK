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

  return Array.from(new Set(terms)).slice(0, 8)
}

function escapeIlike(value: string): string {
  return value.replace(/[%_]/g, "")
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
  return Math.max(4, Math.min(limit, 40))
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

async function fetchLearningPathCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const pattern = `%${escapeIlike(terms[0] ?? "")}%`
  const { data: chapters } = await supabase
    .from("learning_path_chapters")
    .select("id, slug, title, description, problem_category, materie")
    .eq("is_active", true)
    .or(`title.ilike.${pattern},description.ilike.${pattern},problem_category.ilike.${pattern}`)
    .limit(12)

  const { data: lessons } = await supabase
    .from("learning_path_lessons")
    .select("id, slug, chapter_id, title, description, lesson_type, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id")
    .eq("is_active", true)
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .limit(16)

  const { data: items } = await supabase
    .from("learning_path_lesson_items")
    .select("id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json")
    .eq("is_active", true)
    .or(`title.ilike.${pattern},cursuri_lesson_slug.ilike.${pattern},youtube_url.ilike.${pattern},problem_id.ilike.${pattern}`)
    .limit(20)

  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const row of chapters ?? []) {
    candidates.push({
      key: `lesson:${row.id}`,
      source_type: "lesson",
      source_id: String(row.id),
      source_table: "learning_path_chapters",
      item_type: "custom_text",
      title: String(row.title ?? "Traseu Planck"),
      summary: compactSummary(row.description, row.problem_category, row.materie),
      url: row.slug ? `/invata/${row.slug}` : `/invata/${row.id}`,
      metadata: { problem_category: row.problem_category, materie: row.materie },
    })
  }

  for (const row of lessons ?? []) {
    const itemType = (row.lesson_type || "custom_text") as LearningPathLessonType
    candidates.push({
      key: `lesson:${row.id}`,
      source_type: "lesson",
      source_id: String(row.id),
      source_table: "learning_path_lessons",
      item_type: itemType === "text" ? "custom_text" : itemType,
      title: String(row.title ?? "Lecție Planck"),
      summary: compactSummary(row.description, row.cursuri_lesson_slug, row.youtube_url, row.problem_id),
      url: null,
      metadata: {
        chapter_id: row.chapter_id,
        cursuri_lesson_slug: row.cursuri_lesson_slug,
        quiz_question_id: row.quiz_question_id,
        problem_id: row.problem_id,
      },
    })
  }

  for (const row of items ?? []) {
    candidates.push({
      key: `learning_path_item:${row.id}`,
      source_type: "learning_path_item",
      source_id: String(row.id),
      source_table: "learning_path_lesson_items",
      item_type: (row.item_type || "custom_text") as LearningPathLessonType,
      title: String(row.title ?? `Item ${row.item_type ?? "Planck"}`),
      summary: compactSummary(row.cursuri_lesson_slug, row.youtube_url, row.quiz_question_id, row.problem_id, JSON.stringify(row.content_json ?? {}).slice(0, 300)),
      url: null,
      metadata: {
        lesson_id: row.lesson_id,
        quiz_question_id: row.quiz_question_id,
        problem_id: row.problem_id,
      },
    })
  }

  return candidates
}

async function fetchProblemCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const pattern = `%${escapeIlike(terms[0] ?? "")}%`
  const { data } = await supabase
    .from("problems")
    .select("id, title, description, statement, difficulty, category, tags, class")
    .or(`title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},category.ilike.${pattern},tags.ilike.${pattern}`)
    .limit(24)

  return (data ?? []).map((row) => ({
    key: `problem:${row.id}`,
    source_type: "problem",
    source_id: String(row.id),
    source_table: "problems",
    item_type: "problem",
    title: String(row.title ?? row.id),
    summary: compactSummary(row.description, row.statement, row.category, row.difficulty, row.tags),
    url: `/probleme/${row.id}`,
    metadata: { difficulty: row.difficulty, category: row.category, class: row.class, tags: row.tags },
  }))
}

async function fetchQuizCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const pattern = `%${escapeIlike(terms[0] ?? "")}%`
  const { data } = await supabase
    .from("quiz_questions")
    .select("id, question_id, title, description, statement, difficulty, class, materie, tags")
    .or(`title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},question_id.ilike.${pattern}`)
    .limit(24)

  return (data ?? []).map((row) => ({
    key: `quiz_question:${row.id}`,
    source_type: "quiz_question",
    source_id: String(row.id),
    source_table: "quiz_questions",
    item_type: "grila",
    title: String(row.title ?? row.question_id ?? "Întrebare grilă"),
    summary: compactSummary(row.description, row.statement, row.difficulty, row.class, row.materie, Array.isArray(row.tags) ? row.tags.join(", ") : ""),
    url: `/grile?question=${row.id}`,
    metadata: { question_id: row.question_id, difficulty: row.difficulty, class: row.class, materie: row.materie },
  }))
}

async function fetchMathCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const pattern = `%${escapeIlike(terms[0] ?? "")}%`
  const { data } = await supabase
    .from("math_problems")
    .select("id, title, description, statement, tags, class, difficulty, chapter, is_active")
    .eq("is_active", true)
    .or(`title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},chapter.ilike.${pattern}`)
    .limit(24)

  return (data ?? []).map((row) => ({
    key: `math_problem:${row.id}`,
    source_type: "math_problem",
    source_id: String(row.id),
    source_table: "math_problems",
    item_type: "math_problem",
    title: String(row.title ?? row.id),
    summary: compactSummary(row.description, row.statement, row.chapter, row.difficulty, Array.isArray(row.tags) ? row.tags.join(", ") : ""),
    url: `/matematica/probleme/${row.id}`,
    metadata: { difficulty: row.difficulty, class: row.class, chapter: row.chapter, tags: row.tags },
  }))
}

async function fetchCodingCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  const pattern = `%${escapeIlike(terms[0] ?? "")}%`
  const { data } = await supabase
    .from("coding_problems")
    .select("id, slug, title, statement_markdown, difficulty, class, chapter, tags, is_active, language")
    .eq("is_active", true)
    .or(`title.ilike.${pattern},statement_markdown.ilike.${pattern},chapter.ilike.${pattern},slug.ilike.${pattern}`)
    .limit(24)

  return (data ?? []).map((row) => ({
    key: `coding_problem:${row.id}`,
    source_type: "coding_problem",
    source_id: String(row.id),
    source_table: "coding_problems",
    item_type: "coding_problem",
    title: String(row.title ?? row.slug ?? row.id),
    summary: compactSummary(row.statement_markdown, row.chapter, row.difficulty, row.language, Array.isArray(row.tags) ? row.tags.join(", ") : ""),
    url: `/informatica/probleme/${row.slug ?? slugify(String(row.title ?? row.id))}`,
    metadata: { slug: row.slug, difficulty: row.difficulty, class: row.class, chapter: row.chapter, language: row.language, tags: row.tags },
  }))
}

export async function searchPlanckContentForPrompt(
  supabase: SupabaseAnyClient,
  prompt: string,
  limit = 32,
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
