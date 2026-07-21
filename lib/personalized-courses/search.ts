import "server-only"

import type {
  PersonalizedCourseCatalogCandidate,
  PersonalizedCourseIntentScope,
  PersonalizedCourseMaterie,
  SupabaseAnyClient,
} from "@/lib/personalized-courses/types"
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

function scoreCandidate(promptTerms: string[], haystack: string): number {
  const normalized = normalizeText(haystack)
  let score = 0
  for (const term of promptTerms) {
    if (normalized.includes(term)) score += term.length >= 6 ? 3 : 2
  }
  return score
}

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
  /** When true, keep all in-scope candidates even with low term score (chapter already matched). */
  relaxTermScore = false,
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
    .filter((row) => relaxTermScore || row.score >= 3 || terms.length === 0)
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
  order_index?: number | null
}

function addLearningPathItemCandidate(
  candidates: PersonalizedCourseCatalogCandidate[],
  row: LearningPathItemSearchRow,
  context: Record<string, unknown> = {},
) {
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
      item_order_index: typeof row.order_index === "number" ? row.order_index : 0,
      cursuri_lesson_slug: row.cursuri_lesson_slug,
      youtube_url: row.youtube_url,
      quiz_question_id: row.quiz_question_id,
      problem_id: row.problem_id,
    },
  })
}

/**
 * Fetch all active lesson items from the given official chapter IDs.
 * Used when intent classification already pinned the topic to specific chapters.
 */
async function fetchLearningPathCandidatesForChapters(
  supabase: SupabaseAnyClient,
  chapterIds: string[],
): Promise<PersonalizedCourseCatalogCandidate[]> {
  if (!chapterIds.length) return []

  const candidates: PersonalizedCourseCatalogCandidate[] = []

  const { data: chapters } = await supabase
    .from("learning_path_chapters")
    .select("id, slug, title, description, problem_category, materie, is_personalized, order_index")
    .eq("is_active", true)
    .eq("is_personalized", false)
    .in("id", chapterIds)

  const chapterRows = chapters ?? []
  if (!chapterRows.length) return []

  const chapterById = new Map(chapterRows.map((row) => [String(row.id), row]))
  const safeChapterIds = chapterRows.map((row) => String(row.id))

  const { data: lessons } = await supabase
    .from("learning_path_lessons")
    .select("id, chapter_id, title, description, order_index")
    .eq("is_active", true)
    .in("chapter_id", safeChapterIds)
    .order("order_index", { ascending: true })
    .limit(200)

  const lessonRows = lessons ?? []
  const lessonIds = lessonRows.map((row) => String(row.id)).filter(Boolean)
  if (!lessonIds.length) return []

  const lessonById = new Map(lessonRows.map((row) => [String(row.id), row]))

  // Batch in chunks of 80 to stay within PostgREST URL limits.
  for (let i = 0; i < lessonIds.length; i += 80) {
    const chunk = lessonIds.slice(i, i + 80)
    const { data: items } = await supabase
      .from("learning_path_lesson_items")
      .select(
        "id, lesson_id, item_type, title, cursuri_lesson_slug, youtube_url, quiz_question_id, problem_id, content_json, order_index",
      )
      .eq("is_active", true)
      .in("lesson_id", chunk)
      .order("order_index", { ascending: true })
      .limit(400)

    for (const row of items ?? []) {
      const lesson = row.lesson_id ? lessonById.get(String(row.lesson_id)) : null
      const chapter = lesson?.chapter_id ? chapterById.get(String(lesson.chapter_id)) : null
      addLearningPathItemCandidate(candidates, row, {
        matched_by: "chapter_scope",
        chapter_id: chapter?.id ?? null,
        chapter_title: chapter?.title ?? null,
        chapter_order_index: typeof chapter?.order_index === "number" ? chapter.order_index : 0,
        materie: chapter?.materie ?? null,
        lesson_title: lesson?.title ?? null,
        lesson_order_index: typeof lesson?.order_index === "number" ? lesson.order_index : 0,
      })
    }
  }

  return candidates
}

async function fetchProblemCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
  materie: PersonalizedCourseMaterie | null,
): Promise<PersonalizedCourseCatalogCandidate[]> {
  // Physics problems live in `problems`. Only allow when materie is fizica (or unset catalog).
  if (materie && materie !== "fizica") return []

  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("problems")
      .select("id, title, description, statement, difficulty, category, tags, class")
      .or(
        `title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},category.ilike.${pattern},tags.ilike.${pattern}`,
      )
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
        metadata: {
          difficulty: row.difficulty,
          category: row.category,
          class: row.class,
          tags: row.tags,
          materie: "fizica",
        },
      })
    }
  }
  return candidates
}

async function fetchQuizCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
  materie: PersonalizedCourseMaterie | null,
): Promise<PersonalizedCourseCatalogCandidate[]> {
  // quiz_questions.materie is only fizica | biologie.
  if (materie && materie !== "fizica" && materie !== "biologie") return []

  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    let query = supabase
      .from("quiz_questions")
      .select("id, question_id, title, description, statement, difficulty, class, materie, tags")
      .or(
        `title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},question_id.ilike.${pattern}`,
      )
      .limit(30)

    if (materie === "biologie") {
      query = query.eq("materie", "biologie")
    } else if (materie === "fizica") {
      query = query.or("materie.eq.fizica,materie.is.null")
    }

    const { data } = await query
    for (const row of data ?? []) {
      const rowMaterie = typeof row.materie === "string" ? row.materie : "fizica"
      candidates.push({
        key: `quiz_question:${row.id}`,
        source_type: "quiz_question",
        source_id: String(row.id),
        source_table: "quiz_questions",
        item_type: "grila",
        title: String(row.title ?? row.question_id ?? "Întrebare grilă"),
        summary: compactSummary(
          row.description,
          row.statement,
          row.difficulty,
          row.class,
          rowMaterie,
          Array.isArray(row.tags) ? row.tags.join(", ") : "",
        ),
        url: `/grile?question=${row.id}`,
        metadata: {
          question_id: row.question_id,
          difficulty: row.difficulty,
          class: row.class,
          materie: rowMaterie,
        },
      })
    }
  }
  return candidates
}

async function fetchMathCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
  materie: PersonalizedCourseMaterie | null,
): Promise<PersonalizedCourseCatalogCandidate[]> {
  if (materie && materie !== "matematica") return []

  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("math_problems")
      .select("id, title, description, statement, tags, class, difficulty, chapter, is_active")
      .eq("is_active", true)
      .or(
        `title.ilike.${pattern},description.ilike.${pattern},statement.ilike.${pattern},chapter.ilike.${pattern}`,
      )
      .limit(30)
    for (const row of data ?? []) {
      candidates.push({
        key: `math_problem:${row.id}`,
        source_type: "math_problem",
        source_id: String(row.id),
        source_table: "math_problems",
        item_type: "math_problem",
        title: String(row.title ?? row.id),
        summary: compactSummary(
          row.description,
          row.statement,
          row.chapter,
          row.difficulty,
          Array.isArray(row.tags) ? row.tags.join(", ") : "",
        ),
        url: `/matematica/probleme/${row.id}`,
        metadata: {
          difficulty: row.difficulty,
          class: row.class,
          chapter: row.chapter,
          tags: row.tags,
          materie: "matematica",
        },
      })
    }
  }
  return candidates
}

async function fetchCodingCandidates(
  supabase: SupabaseAnyClient,
  terms: string[],
  materie: PersonalizedCourseMaterie | null,
): Promise<PersonalizedCourseCatalogCandidate[]> {
  if (materie && materie !== "informatica" && materie !== "AI") return []

  const candidates: PersonalizedCourseCatalogCandidate[] = []
  for (const term of terms.slice(0, 4)) {
    const pattern = `%${escapeIlike(term)}%`
    const { data } = await supabase
      .from("coding_problems")
      .select("id, slug, title, statement_markdown, difficulty, class, chapter, tags, is_active, language")
      .eq("is_active", true)
      .or(
        `title.ilike.${pattern},statement_markdown.ilike.${pattern},chapter.ilike.${pattern},slug.ilike.${pattern}`,
      )
      .limit(30)
    for (const row of data ?? []) {
      candidates.push({
        key: `coding_problem:${row.id}`,
        source_type: "coding_problem",
        source_id: String(row.id),
        source_table: "coding_problems",
        item_type: "coding_problem",
        title: String(row.title ?? row.slug ?? row.id),
        summary: compactSummary(
          row.statement_markdown,
          row.chapter,
          row.difficulty,
          row.language,
          Array.isArray(row.tags) ? row.tags.join(", ") : "",
        ),
        url: `/informatica/probleme/${row.slug ?? slugify(String(row.title ?? row.id))}`,
        metadata: {
          slug: row.slug,
          difficulty: row.difficulty,
          class: row.class,
          chapter: row.chapter,
          language: row.language,
          tags: row.tags,
          materie: "informatica",
        },
      })
    }
  }
  return candidates
}

/**
 * Search Planck catalog content for a personalized course, constrained by intent scope.
 *
 * - non_catalog or empty chapterIds → [] (force full generation)
 * - catalog with chapterIds → learning-path items only from those chapters + materie-aligned problems/quizzes
 */
export async function searchPlanckContentForPrompt(
  supabase: SupabaseAnyClient,
  prompt: string,
  limit = 80,
  scope?: PersonalizedCourseIntentScope | null,
): Promise<PersonalizedCourseCatalogCandidate[]> {
  if (scope?.mode === "non_catalog") return []
  if (scope && scope.chapterIds.length === 0) return []

  const terms = extractTerms(prompt)
  const materie = scope?.materie ?? null

  if (scope?.chapterIds.length) {
    const learningPath = await fetchLearningPathCandidatesForChapters(supabase, scope.chapterIds)
    const sideResults = await Promise.allSettled([
      terms.length ? fetchProblemCandidates(supabase, terms, materie) : Promise.resolve([]),
      terms.length ? fetchQuizCandidates(supabase, terms, materie) : Promise.resolve([]),
      terms.length ? fetchMathCandidates(supabase, terms, materie) : Promise.resolve([]),
      terms.length ? fetchCodingCandidates(supabase, terms, materie) : Promise.resolve([]),
    ])
    const side = sideResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    // Chapter-scoped LP items are already on-topic; relax term score so we don't drop them.
    return sortAndLimit([...learningPath, ...side], terms, limit, true)
  }

  // No scope passed (legacy / tests): return empty rather than unfiltered cross-subject search.
  // Callers should always pass a scope from classifyPromptIntent.
  if (!scope) return []

  return []
}
