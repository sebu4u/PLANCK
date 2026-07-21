import "server-only"

import OpenAI from "openai"
import { z } from "zod"
import type {
  PersonalizedCourseIntentScope,
  PersonalizedCourseMaterie,
  SupabaseAnyClient,
} from "@/lib/personalized-courses/types"

export interface OfficialChapterRow {
  id: string
  slug: string
  title: string
  materie: string | null
  problem_category: string | null
  description: string | null
}

const MATERIE_VALUES = [
  "matematica",
  "fizica",
  "informatica",
  "biologie",
  "AI",
] as const satisfies readonly PersonalizedCourseMaterie[]

const intentSchema = z.object({
  mode: z.enum(["catalog", "non_catalog"]),
  materie: z.enum(MATERIE_VALUES).nullable().optional(),
  matched_chapter_ids: z.array(z.string()).max(12).optional(),
  matched_chapter_slugs: z.array(z.string()).max(12).optional(),
  topic_summary: z.string().max(400).optional(),
})

const PLANCK_CATALOG_KEYWORDS: ReadonlyArray<string> = [
  "matematica",
  "algebra",
  "geometrie",
  "analiza",
  "trigonometrie",
  "fizica",
  "mecanica",
  "cinematica",
  "dinamica",
  "optica",
  "termodinamica",
  "electricitate",
  "magnetism",
  "biologie",
  "celula",
  "genetica",
  "informatica",
  "algoritm",
  "programare",
  "chimie",
]

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function getClassifierProviderConfig() {
  const overrideKey = process.env.PERSONALIZED_COURSE_API_KEY?.trim()
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim()
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const apiKey = overrideKey || deepseekKey || openaiKey
  if (!apiKey) {
    throw new Error(
      "Missing API key for course classifier. Set DEEPSEEK_API_KEY (or OPENAI_API_KEY, or PERSONALIZED_COURSE_API_KEY).",
    )
  }
  const isDeepseek = Boolean(deepseekKey && !overrideKey)
  const baseURL =
    process.env.PERSONALIZED_COURSE_BASE_URL?.trim() ||
    (isDeepseek ? "https://api.deepseek.com" : undefined)
  const defaultModel = isDeepseek ? "deepseek-v4-flash" : "gpt-4o-mini"
  const model = process.env.PERSONALIZED_COURSE_OPENAI_MODEL?.trim() || defaultModel
  return { apiKey, baseURL, model }
}

function extractJsonObject(raw: string): string {
  let text = raw.trim()
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) text = fenceMatch[1].trim()
  const firstBrace = text.indexOf("{")
  if (firstBrace > 0) text = text.slice(firstBrace)
  const lastBrace = text.lastIndexOf("}")
  if (lastBrace >= 0 && lastBrace < text.length - 1) text = text.slice(0, lastBrace + 1)
  return text.trim()
}

function keywordLooksCatalog(prompt: string): boolean {
  const normalized = normalizeText(prompt)
  return PLANCK_CATALOG_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

function inferMaterieFromPrompt(prompt: string): PersonalizedCourseMaterie | null {
  const n = normalizeText(prompt)
  if (
    /\b(matematic|algebra|geometr|derivat|integral|functi|ecuati|logaritm|matrice)\w*/.test(n)
  ) {
    return "matematica"
  }
  if (/\b(informatic|algoritm|programare|python|java|c\+\+|structuri de date)\w*/.test(n)) {
    return "informatica"
  }
  if (/\b(biolog|celul|genetica|adn|fotosintez|organism|anatom)\w*/.test(n)) {
    return "biologie"
  }
  if (/\b(ai|inteligenta artificiala|machine learning|retea neuron)\w*/.test(n)) {
    return "AI"
  }
  if (
    /\b(fizic|cinematic|dinamic|optic|electric|magnet|mecanica|termodinam|forta|energie|unda)\w*/.test(
      n,
    )
  ) {
    return "fizica"
  }
  return null
}

function matchChaptersByKeywords(
  prompt: string,
  chapters: OfficialChapterRow[],
): OfficialChapterRow[] {
  const terms = normalizeText(prompt)
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 4)
  if (!terms.length) return []

  const scored = chapters
    .map((chapter) => {
      const hay = normalizeText(
        `${chapter.title} ${chapter.slug} ${chapter.description ?? ""} ${chapter.problem_category ?? ""}`,
      )
      let score = 0
      for (const term of terms) {
        if (hay.includes(term)) score += term.length >= 6 ? 3 : 2
      }
      return { chapter, score }
    })
    .filter((row) => row.score >= 3)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 4).map((row) => row.chapter)
}

export async function listOfficialChapters(
  supabase: SupabaseAnyClient,
): Promise<OfficialChapterRow[]> {
  const { data } = await supabase
    .from("learning_path_chapters")
    .select("id, slug, title, materie, problem_category, description")
    .eq("is_active", true)
    .eq("is_personalized", false)
    .order("order_index", { ascending: true })
    .limit(200)

  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    materie: typeof row.materie === "string" ? row.materie : null,
    problem_category: typeof row.problem_category === "string" ? row.problem_category : null,
    description: typeof row.description === "string" ? row.description : null,
  }))
}

function buildFallbackScope(
  prompt: string,
  chapters: OfficialChapterRow[],
): PersonalizedCourseIntentScope {
  const looksCatalog = keywordLooksCatalog(prompt)
  if (!looksCatalog) {
    return {
      mode: "non_catalog",
      materie: null,
      chapterIds: [],
      chapterTitles: [],
      topicSummary: prompt.slice(0, 200),
    }
  }

  const matched = matchChaptersByKeywords(prompt, chapters)
  const materie =
    (matched[0]?.materie as PersonalizedCourseMaterie | null) ?? inferMaterieFromPrompt(prompt)

  // Catalog subject but no matching chapter → generate from scratch (no cross-chapter reuse).
  return {
    mode: "catalog",
    materie,
    chapterIds: matched.map((c) => c.id),
    chapterTitles: matched.map((c) => c.title),
    topicSummary: prompt.slice(0, 200),
  }
}

function resolveMatchedChapters(
  parsed: z.infer<typeof intentSchema>,
  chapters: OfficialChapterRow[],
): OfficialChapterRow[] {
  const byId = new Map(chapters.map((c) => [c.id, c]))
  const bySlug = new Map(chapters.map((c) => [c.slug, c]))
  const matched: OfficialChapterRow[] = []
  const seen = new Set<string>()

  for (const id of parsed.matched_chapter_ids ?? []) {
    const chapter = byId.get(id)
    if (chapter && !seen.has(chapter.id)) {
      matched.push(chapter)
      seen.add(chapter.id)
    }
  }
  for (const slug of parsed.matched_chapter_slugs ?? []) {
    const chapter = bySlug.get(slug)
    if (chapter && !seen.has(chapter.id)) {
      matched.push(chapter)
      seen.add(chapter.id)
    }
  }
  return matched.slice(0, 6)
}

/**
 * Classify the user prompt into a reuse scope: which official chapters / materie
 * may supply source_key items. Non-catalog topics (e.g. veterinary medicine) get
 * an empty chapter list so the planner generates everything from scratch.
 */
export async function classifyPromptIntent(
  supabase: SupabaseAnyClient,
  userPrompt: string,
): Promise<PersonalizedCourseIntentScope> {
  const chapters = await listOfficialChapters(supabase)
  const fallback = buildFallbackScope(userPrompt, chapters)

  try {
    const { apiKey, baseURL, model } = getClassifierProviderConfig()
    const opts: Record<string, unknown> = { apiKey, timeout: 45_000 }
    if (baseURL) opts.baseURL = baseURL
    const openai = new OpenAI(opts)

    const catalogList = chapters.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      materie: c.materie,
      problem_category: c.problem_category,
    }))

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `Ești un clasificator pentru cursuri personalizate PLANCK Academy. Răspunzi DOAR cu JSON valid.

Catalogul Planck are capitole oficiale de matematică, fizică, informatică, biologie, AI (și uneori chimie/istorie/gramatică mapate pe aceste materii).
- mode="catalog" DOAR dacă obiectivul utilizatorului se potrivește clar cu unul sau mai multe capitole din listă (ex. "Cinematică", "Derivate", "Celula").
- mode="non_catalog" dacă subiectul NU există pe platformă (ex. medicină veterinară, anime, gătit, hobby). Atunci matched_chapter_ids = [] și materie = null.
- matched_chapter_ids: doar id-uri din lista furnizată, maxim 4, cele mai potrivite TEMATIC (nu toată materia — doar capitolul/capitolele cerute).
- materie: una din matematica|fizica|informatica|biologie|AI, sau null.
- topic_summary: scurt, în română.

REGULĂ: dacă nu există un capitol clar potrivit, preferă mode="catalog" cu matched_chapter_ids=[] (generează de la zero pe materie) DOAR când materia e curriculară Planck; altfel non_catalog.`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              user_learning_goal: userPrompt,
              official_chapters: catalogList,
              required_json_shape: {
                mode: "catalog | non_catalog",
                materie: "matematica | fizica | informatica | biologie | AI | null",
                matched_chapter_ids: ["uuid..."],
                matched_chapter_slugs: ["slug..."],
                topic_summary: "string",
              },
            },
            null,
            2,
          ),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 800,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return fallback

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(extractJsonObject(raw))
    } catch {
      return fallback
    }

    const result = intentSchema.safeParse(parsedJson)
    if (!result.success) return fallback

    const data = result.data
    if (data.mode === "non_catalog") {
      return {
        mode: "non_catalog",
        materie: null,
        chapterIds: [],
        chapterTitles: [],
        topicSummary: data.topic_summary?.trim() || fallback.topicSummary,
      }
    }

    const matched = resolveMatchedChapters(data, chapters)
    const materie =
      (data.materie as PersonalizedCourseMaterie | null | undefined) ??
      (matched[0]?.materie as PersonalizedCourseMaterie | null) ??
      inferMaterieFromPrompt(userPrompt)

    return {
      mode: "catalog",
      materie,
      chapterIds: matched.map((c) => c.id),
      chapterTitles: matched.map((c) => c.title),
      topicSummary: data.topic_summary?.trim() || fallback.topicSummary,
    }
  } catch {
    return fallback
  }
}
