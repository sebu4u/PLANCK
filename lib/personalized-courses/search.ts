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

/**
 * Item titles that have appeared as low-content "template" titles in past
 * personalized courses. We drop these from the catalog search results so the
 * planner doesn't try to reuse them — they're almost always off-topic
 * (e.g. "Exercitiu intelegere" with whatever the AI filled in last time).
 * Mirrors the verifier's GENERIC_LEARNED_ITEM_TITLES set.
 */
const GENERIC_ITEM_TITLES_FOR_SEARCH = new Set([
  "exercitiu intelegere",
  "exercițiu intelegere",
  "grila intelegere",
  "grilă intelegere",
  "obiectivul lectiei",
  "obiectivul lecției",
  "intrebare de control",
  "întrebare de control",
  "mini-recapitulare",
  "pasii de lucru",
  "pașii de lucru",
  "verificare de intelegere",
  "verificare de înțelegere",
  "conexiune cu practica",
  "gresala frecventa",
  "greșeală frecventă",
  "vocabular esential",
  "vocabular esențial",
  "ideea centrala",
  "ideea centrală",
  "intuitie rapida",
  "intuiție rapidă",
  "de ce conteaza",
  "de ce contează",
  "exemplu ghidat",
])

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
    // Require a score of 3+ to include: that's either one 6+ char term (3
    // points) or two 3-5 char terms (2 each). A single 2-point match (one
    // short word like "totul", "tot", "intr", "plm") is not enough — it
    // catches every generic item, which is exactly how the off-topic
    // pollution happens in the first place. If the prompt yielded zero
    // terms, accept everything (we have no signal to filter on).
    .filter((row) => row.score >= 3 || terms.length === 0)
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
  // Drop items whose title is one of the known generic-template titles
  // (e.g. "Exercitiu intelegere", "Pasii de lucru"). These almost always have
  // placeholder content from a previous personalized course and are the #1
  // source of off-topic items in newly-generated courses.
  const normalizedTitle = normalizeText(row.title ?? "")
  if (normalizedTitle && GENERIC_ITEM_TITLES_FOR_SEARCH.has(normalizedTitle)) {
    return
  }
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
      .select("id, slug, title, description, problem_category, materie, is_personalized")
      .eq("is_active", true)
      // Drop personalized chapters — they were AI-generated for a previous
      // user prompt and their items usually have generic titles + random
      // content. Reusing them is the #1 cause of off-topic items sneaking
      // into a new personalized course (e.g. a grammar question inside
      // a Jujutsu Kaisen chapter).
      .eq("is_personalized", false)
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
    if (!lessonRows.length) continue

    // Look up each lesson's chapter to drop items from personalized chapters.
    const chapterIds = Array.from(
      new Set(lessonRows.map((row) => row.chapter_id).filter((id): id is string => Boolean(id))),
    )
    const { data: chapterRows } = chapterIds.length
      ? await supabase
          .from("learning_path_chapters")
          .select("id, is_personalized")
          .in("id", chapterIds)
      : { data: [] as Array<{ id: string; is_personalized: boolean | null }> }
    const personalizedChapters = new Set<string>(
      (chapterRows ?? []).filter((c) => c.is_personalized === true).map((c) => String(c.id)),
    )
    const safeLessonRows = lessonRows.filter(
      (row) => !row.chapter_id || !personalizedChapters.has(String(row.chapter_id)),
    )
    const lessonIds = safeLessonRows.map((row) => String(row.id)).filter(Boolean)
    if (!lessonIds.length) continue

    const lessonById = new Map(safeLessonRows.map((row) => [String(row.id), row]))
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

  // Search lesson items with each term. We must filter out items whose
  // chapter is `is_personalized = true` — otherwise a previous personalized
  // course's items (e.g. an old "Jujutsu Kaisen" run) leak into the
  // candidate pool of a new course on the same topic, polluting it with
  // stale content.
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data: items } = await supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},cursuri_lesson_slug.ilike.${pattern}`)
      .limit(80)

    const itemRows = items ?? []
    if (!itemRows.length) continue

    // Look up each item's lesson + chapter to drop items from personalized
    // chapters. We do a single batched chapter query.
    const lessonIds = Array.from(
      new Set(itemRows.map((row) => row.lesson_id).filter((id): id is string => Boolean(id))),
    )
    const { data: lessonRows } = lessonIds.length
      ? await supabase.from("learning_path_lessons").select("id, chapter_id").in("id", lessonIds)
      : { data: [] as Array<{ id: string; chapter_id: string | null }> }
    const lessonToChapter = new Map(
      (lessonRows ?? []).map((row) => [String(row.id), row.chapter_id]),
    )
    const chapterIds = Array.from(
      new Set(
        (lessonRows ?? [])
          .map((row) => row.chapter_id)
          .filter((id): id is string => Boolean(id)),
      ),
    )
    const { data: chapterRows } = chapterIds.length
      ? await supabase
          .from("learning_path_chapters")
          .select("id, is_personalized")
          .in("id", chapterIds)
      : { data: [] as Array<{ id: string; is_personalized: boolean | null }> }
    const personalizedChapters = new Set<string>(
      (chapterRows ?? []).filter((c) => c.is_personalized === true).map((c) => String(c.id)),
    )
    const safeItemRows = itemRows.filter((row) => {
      const chId = row.lesson_id ? lessonToChapter.get(String(row.lesson_id)) : null
      return !chId || !personalizedChapters.has(String(chId))
    })

    for (const row of safeItemRows) {
      const lesson = row.lesson_id ? lessonToChapter.get(String(row.lesson_id)) : null
      addLearningPathItemCandidate(candidates, row, {
        matched_by: "item",
        chapter_id: lesson ?? null,
      })
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
