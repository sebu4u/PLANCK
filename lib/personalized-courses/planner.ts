import "server-only"

import OpenAI from "openai"
import { z } from "zod"
import type {
  PersonalizedCourseCatalogCandidate,
  PersonalizedCourseGeneratedPlan,
  PersonalizedCourseGeneratedPlanItem,
  PersonalizedCourseGeneratedPlanLesson,
} from "@/lib/personalized-courses/types"
import {
  LEARNING_PATH_INTERACTIVE_ITEM_TYPE_LIST,
  isInteractiveLessonItemType,
  validateInteractiveItemContent,
} from "@/lib/learning-path-interactive-items"
import { validateTestContent } from "@/lib/learning-path-test"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

const PERSONALIZED_ITEM_TYPES = [
  "text",
  "video",
  "grila",
  "problem",
  "math_problem",
  "coding_problem",
  "poll",
  "custom_text",
  "simulation",
  "test",
  ...LEARNING_PATH_INTERACTIVE_ITEM_TYPE_LIST,
] as const satisfies readonly LearningPathLessonType[]

const MIN_ITEMS_PER_LESSON = 20
const MAX_ITEMS_PER_LESSON = 30

const PLANNER_STOP_WORDS = new Set([
  "azi",
  "vreau",
  "doresc",
  "invăț",
  "invat",
  "învaț",
  "despre",
  "pentru",
  "care",
  "cum",
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
  "sau",
  "mai",
  "ale",
  "fara",
  "fără",
])

const personalizedItemTypeSchema = z.enum(PERSONALIZED_ITEM_TYPES)

const planItemSchema = z.object({
  title: z.string().min(2).max(120),
  item_type: personalizedItemTypeSchema,
  source_key: z.string().min(2).max(160).nullable().optional(),
  content_json: z.record(z.unknown()).nullable().optional(),
})

const planLessonSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).nullable().optional(),
  items: z.array(planItemSchema).min(1).max(MAX_ITEMS_PER_LESSON),
})

const planSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(900),
  lessons: z.array(planLessonSchema).min(1).max(8),
})

/**
 * Item types the AI may generate rich content_json for (no external DB row needed).
 * Chosen to match the real distribution of official PLANCK lesson items:
 * custom_text (802), poll (323), match (109), code_trace (95), reveal_steps (90),
 * swipe_classify (73), fill_slot (62), test (53), card_sort (48), table_fill (25),
 * memory_flip (11). Rare/absent official types (slider_explore, speed_round,
 * graph_build, flow_build) are intentionally excluded — generating them made AI
 * lessons *more* varied than official ones in a way that was a tell, and their
 * schemas (SVG paths, mathjs formulas, timed rounds) are the most error-prone.
 */
const GENERATABLE_ITEM_TYPES = [
  "custom_text",
  "match",
  "card_sort",
  "fill_slot",
  "reveal_steps",
  "table_fill",
  "swipe_classify",
  "memory_flip",
  "code_trace",
  "poll",
  "test",
] as const satisfies readonly LearningPathLessonType[]

const GENERATABLE_ITEM_TYPE_SET: ReadonlySet<string> = new Set(GENERATABLE_ITEM_TYPES)

const MAX_CONNECTORS_PER_LESSON = 8

const MIN_CUSTOM_TEXT_BODY_LENGTH = 40

/**
 * Provider config for the personalized-course planner. Supports any OpenAI-compatible
 * endpoint (OpenAI, DeepSeek, OpenRouter, …) via env. DeepSeek is used when
 * DEEPSEEK_API_KEY is present; otherwise falls back to OpenAI.
 *
 *   DEEPSEEK_API_KEY=sk-...                (DeepSeek)
 *   PERSONALIZED_COURSE_OPENAI_MODEL=...   (model id; default deepseek-chat on DeepSeek)
 *   PERSONALIZED_COURSE_BASE_URL=...       (override endpoint, e.g. OpenRouter)
 *   PERSONALIZED_COURSE_API_KEY=...        (override key, takes precedence)
 */
function getPlannerProviderConfig() {
  const overrideKey = process.env.PERSONALIZED_COURSE_API_KEY?.trim()
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim()
  const openaiKey = process.env.OPENAI_API_KEY?.trim()

  const apiKey = overrideKey || deepseekKey || openaiKey
  if (!apiKey) {
    throw new Error(
      "Missing API key for course planner. Set DEEPSEEK_API_KEY (or OPENAI_API_KEY, or PERSONALIZED_COURSE_API_KEY).",
    )
  }

  const isDeepseek = Boolean(deepseekKey && !overrideKey)
  const baseURL =
    process.env.PERSONALIZED_COURSE_BASE_URL?.trim() ||
    (isDeepseek ? "https://api.deepseek.com" : undefined)
  // Default to deepseek-v4-flash: it is fast (~50s) and fits the plan JSON within the
  // token budget. The reasoning model deepseek-v4-pro spends ~20k tokens on hidden
  // reasoning per plan and truncates the output even at max_tokens=32000, so it is NOT
  // suitable for this single-shot generation. Override via PERSONALIZED_COURSE_OPENAI_MODEL.
  const defaultModel = isDeepseek ? "deepseek-v4-flash" : "gpt-4o-mini"
  const model = process.env.PERSONALIZED_COURSE_OPENAI_MODEL?.trim() || defaultModel

  // Reasoning models (deepseek-v4-pro, deepseek-reasoner, o-series) spend part of the
  // max_tokens budget on hidden reasoning before emitting visible content. Give them a
  // much larger shared budget so the JSON output isn't truncated to an empty string.
  const isReasoningModel = /pro|reasoner|\bo[1-9]\b|r1/i.test(model)
  // A full plan (3-5 lessons × 20-25 rich items, with poll/test/interactive content_json)
  // can be large. DeepSeek accepts up to ~8k output for flash by default but honors
  // higher max_tokens; use a generous budget and retry with even more on truncation.
  const maxTokens = isReasoningModel ? 32000 : 24000

  return { apiKey, baseURL, model, provider: isDeepseek ? "deepseek" : "openai", maxTokens, isReasoningModel }
}

function getOpenAIClient() {
  const { apiKey, baseURL } = getPlannerProviderConfig()
  // A full plan (up to ~100 rich items) can take over a minute even on flash; allow 180s.
  const timeout = 180_000
  const opts: Record<string, unknown> = { apiKey, timeout }
  if (baseURL) opts.baseURL = baseURL
  return new OpenAI(opts)
}

export function getPlannerModel(): string {
  return getPlannerProviderConfig().model
}

// Exposed for unit tests in scripts/test-*.mjs. Internal helpers only.
export const _internal = {
  isPlanckCatalogSubject,
  buildPlannerMessages,
}

function stringifyCandidates(candidates: PersonalizedCourseCatalogCandidate[]): string {
  if (!candidates.length) return "Nu s-a găsit conținut Planck relevant. Generează iteme de legătură (doar custom_text cu explicații scurte)."
  return candidates
    .slice(0, 100)
    .map((candidate, index) => {
      return [
        `#${index + 1}`,
        `source_key: ${candidate.key}`,
        `tip: ${candidate.item_type}`,
        `titlu: ${candidate.title}`,
        `continut: ${candidate.summary.slice(0, 280)}`,
      ].join("\n")
    })
    .join("\n\n")
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/**
 * Detect whether a user prompt is about a subject the Planck catalog covers.
 * The catalog has quality content for a fixed set of academic / curricular
 * topics (math, physics, chemistry, biology, informatics, language, history,
 * earth science). Anything else — anime, cooking, travel, pop culture,
 * personal finance, hobby — is "off-catalog" and the planner should generate
 * the whole course from scratch instead of trying to reuse source items that
 * don't exist in the catalog.
 *
 * Detection is keyword-based: if the prompt (after stop-word removal)
 * contains any term from PLANCK_CATALOG_SUBJECTS, we treat it as on-catalog.
 * Otherwise we treat it as off-catalog. The list is intentionally inclusive
 * (covers most of the Romanian school curriculum) and is updated as new
 * subject areas are added to the catalog.
 */
const PLANCK_CATALOG_SUBJECTS: ReadonlyArray<string> = [
  // Math
  "matematica", "algebra", "geometrie", "analiza", "trigonometrie", "trigonometri",
  "integrala", "integrale", "derivata", "derivate", "ecuatie", "ecuatii", "ecuați",
  "functie", "functii", "progresie", "progresii", "inegalitate", "inegalitati",
  "logaritm", "logaritmi", "matrice", "matrici", "determinant", "determinanti",
  "vector", "vectori", "polinom", "polinoame", "sir", "siruri", "limita", "limite",
  "probabilitate", "statistica", "combinatorica", "permutare", "combinare",
  // Physics
  "fizica", "mecanica", "termodinamica", "electricitate", "magnetism", "magnet",
  "optica", "unda", "unde", "sunet", "oscilatie", "oscilatii", "cinematica",
  "dinamica", "elastica", "elasticitate", "hooke", "gravitatie", "gravitat",
  "circuit", "circuite", "rezistenta", "tensiune", "curent", "putere", "energie",
  "lucru", "forta", "forte", "moment", "impuls", "presiune", "temperatura",
  "caldura", "calorimetrie", "frecare", "pendul", "lentila", "lentile",
  // Chemistry
  "chimie", "chimi", "atom", "atomi", "molecula", "molecule", "reactie", "reactii",
  "compus", "compusi", "acid", "acizi", "baza", "baze", "ph", "solutie", "solutii",
  "hidrocarbura", "hidrocarburi", "alcool", "alcooli", "polimer", "polimeri",
  "sare", "saruri", "oxizi", "hidroxizi", "tabelul", "periodic", "element", "elemente",
  "ion", "ioni", "cation", "anion", "legaturi", "legatura", "covalenta", "covalent",
  "ionic", "izomeri", "izomerie",
  // Biology
  "biologie", "biolog", "celula", "celule", "tesut", "tesuturi", "organ", "organe",
  "sistem", "sisteme", "fotosinteza", "fotosintez", "clorofila", "cloroplast",
  "respiratie", "reproducere", "genetica", "dna", "adn", "cromozom", "cromozomi",
  "gene", "evolutie", "selectie", "ecosistem", "ecosisteme", "habitat", "biodiversitate",
  "nervos", "neuron", "creier", "digestiv", "circulator", "imunitar", "hormon",
  "virus", "bacterie", "bacterii", "mitocondrie", "ribozom", "membrana", "organita",
  // Informatics / ASD
  "algoritm", "algoritmi", "programare", "program", "structuri de date",
  "complexitate", "graf", "grafuri", "arbore", "arbori", "sortare", "cautare",
  "binar", "liniar", "bubble", "merge", "quick", "hash", "stiva", "coada", "lista",
  "lantuit", "bfs", "dfs", "dijkstra", "binar de cautare", "bst", "recursiv",
  "recursi", "dinamica", "dynamic programming", "memorie", "stiva de apeluri",
  "python", "java", "c++", "javascript", "code", "oop", "clasa", "obiect", "interfata",
  "baza de date", "sql", "retele", "protocol", "api", "os", "sistem de operare",
  "compilator", "interpreto", "regex", "automat", "masina turing",
  // Earth science
  "geografie", "geolog", "geolog", "tectonica", "miner", "roci", "roci sedimentare",
  "atmosfera", "clima", "vreme", "hidro", "ocean", "fluviu", "relief", "munte",
  "campie", "deal", "podis", "populatie", "economie geografica", "mediu",
  // History
  "istorie", "istori", "antic", "evul mediu", "renastere", "revolutie", "industrial",
  "razboi", "razboaie", "imperi", "imperiu", "regat", "republica", "dictatura",
  "democratie", "comunism", "capitalism", "feud", "feudali", "modernitate",
  // Language / grammar / communication
  "romana", "român", "gramatica", "gramatic", "vocabular", "comunicare",
  "redactare", "scriere", "lectura", "literatura", "literar", "poezie", "proză",
  "proz", "roman", "nuvela", "nuvel", "dramaturgie", "teatru", "eseu", "eseuri",
  "ortografie", "ortogram", "lexic", "morfologie", "sintaxa", "stilistica",
  "figura de stil", "retoric", "fonetic", "interjectie", "prepozitie",
  // Other school subjects
  "fizica", "filozofie", "filosofie", "filozo", "psihologie", "sociologie",
  "religie", "economie", "economie", "finante", "contabilitate", "marketing",
  "management", "antreprenoriat", "drept", "legislatie", "constitutie",
]

function isPlanckCatalogSubject(prompt: string): boolean {
  const terms = extractPlannerTerms(prompt)
  if (!terms.length) return false
  // Build a set of catalog stems for fast matching. We use a substring check
  // on the normalized prompt (not per-term) so a phrase like "matematica de
  // clasa a 11-a" still matches.
  const normalized = normalizeText(prompt)
  for (const keyword of PLANCK_CATALOG_SUBJECTS) {
    if (normalized.includes(keyword)) return true
  }
  return false
}

function extractPlannerTerms(value: string): string[] {
  const normalized = normalizeText(value)
  return Array.from(
    new Set(
      normalized
        .split(/[^a-z0-9]+/g)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3 && !PLANNER_STOP_WORDS.has(term)),
    ),
  )
}

function scoreTextByTerms(terms: string[], haystack: string): number {
  if (!terms.length) return 1
  const normalized = normalizeText(haystack)
  let score = 0
  for (const term of terms) {
    if (normalized.includes(term)) score += term.length >= 6 ? 3 : 2
  }
  return score
}

function getLessonFocusTerms(
  lesson: Pick<PersonalizedCourseGeneratedPlanLesson, "title" | "description">,
  userPrompt: string,
): string[] {
  const lessonTerms = extractPlannerTerms(`${lesson.title} ${lesson.description ?? ""}`)
  const promptTerms = extractPlannerTerms(userPrompt)
  return Array.from(new Set([...lessonTerms, ...promptTerms]))
}

function scoreCandidateForLesson(
  candidate: PersonalizedCourseCatalogCandidate,
  lesson: Pick<PersonalizedCourseGeneratedPlanLesson, "title" | "description">,
  userPrompt: string,
): number {
  const terms = getLessonFocusTerms(lesson, userPrompt)
  return scoreTextByTerms(
    terms,
    `${candidate.title} ${candidate.summary} ${Object.values(candidate.metadata ?? {}).join(" ")}`,
  )
}

function makeRichCustomTextBody(title: string, userPrompt: string, lessonTitle?: string): string {
  const lessonLine = lessonTitle ? `\n\n**În lecția:** ${lessonTitle}.` : ""
  return [
    `## ${title}${lessonLine}`,
    "",
    `Ideea centrală a acestui pas sprijină direct obiectivul tău: **${userPrompt}**.`,
    "",
    "Parcurge explicația în ritm propriu, apoi continuă cu următorul item din lecție pentru a fixa noțiunea prin practică.",
  ].join("\n")
}

/**
 * Validate poll content_json the same way the renderer's parsePollContent does:
 * question + correctAnswerId + options[{id,label,feedback}], correctAnswerId must
 * match an option id, no empty options. Returns an error string or null when valid.
 */
function validatePollContent(content: Record<string, unknown> | null): string | null {
  if (!content) return "poll: content_json obligatoriu."
  if (typeof content.question !== "string" || !content.question.trim()) {
    return "poll: question (string nevid) obligatoriu."
  }
  if (typeof content.correctAnswerId !== "string" || !content.correctAnswerId.trim()) {
    return "poll: correctAnswerId (string nevid) obligatoriu."
  }
  const rawOptions = content.options
  if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
    return "poll: options trebuie să fie un array cu minim 2 elemente."
  }
  const ids = new Set<string>()
  for (let i = 0; i < rawOptions.length; i += 1) {
    const opt = rawOptions[i]
    if (!opt || typeof opt !== "object") return `poll: opțiunea #${i + 1} invalidă.`
    const o = opt as Record<string, unknown>
    if (typeof o.id !== "string" || !o.id.trim()) return `poll: opțiunea #${i + 1} are id lipsă.`
    if (typeof o.label !== "string" || !o.label.trim()) return `poll: opțiunea #${i + 1} are label lipsă.`
    if (typeof o.feedback !== "string" || !o.feedback.trim()) {
      return `poll: opțiunea #${i + 1} are feedback lipsă (explicație afișată după răspuns).`
    }
    if (ids.has(o.id)) return `poll: id opțiune duplicat (${o.id}).`
    ids.add(o.id)
  }
  if (!ids.has(content.correctAnswerId)) {
    return "poll: correctAnswerId trebuie să fie unul dintre id-urile opțiunilor."
  }
  return null
}

/**
 * fill_slot latexTemplate must use {{id}} placeholders — NEVER the rendered output
 * (\htmlId{fill-slot-...}{\boxed{\text{?}}}, \color{#...}). The AI occasionally emits
 * the renderer's output format, which produces malformed KaTeX. Reject such templates so
 * they fall back to rich custom_text instead of rendering as garbage.
 */
function hasForbiddenFillSlotMarkers(
  itemType: string,
  content: Record<string, unknown>,
): boolean {
  if (itemType !== "fill_slot") return false
  const template = typeof content.latexTemplate === "string" ? content.latexTemplate : ""
  // Rendered-output constructs (the AI confusing input format with renderer output).
  if (/(\\htmlId|fill-slot-|\\boxed|\\text\{\?\}|\\color\{#)/.test(template)) return true
  // Bare "?" is always a placeholder mistake — the AI wrote \frac{?}{?} instead of
  // \frac{{{id1}}}{{{id2}}}. A literal ? in a formula template is never legitimate.
  if (template.includes("?")) return true
  // The number of {{id}} placeholders must equal the number of slots, otherwise some
  // boxes are unanswerable (extra {{id}} with no slot) or slots have no box in the template.
  const placeholderIds = template.match(/\{\{(\w+)\}\}/g) ?? []
  const rawSlots = Array.isArray(content.slots) ? content.slots : []
  const slotIds = rawSlots
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => (typeof s.id === "string" ? s.id.trim() : ""))
    .filter(Boolean)
  // Extract unique placeholder ids from template ({{{id}}} also matches {{id}}).
  const uniquePlaceholderIds = new Set(placeholderIds.map((m) => m.replace(/\{\{|\}\}/g, "")))
  const uniqueSlotIds = new Set(slotIds)
  if (uniquePlaceholderIds.size !== uniqueSlotIds.size) return true
  for (const id of uniquePlaceholderIds) {
    if (!uniqueSlotIds.has(id)) return true
  }
  // Chips must include every slot answer (otherwise the student can't fill a slot).
  const chips = Array.isArray(content.chips)
    ? content.chips.filter((c): c is string => typeof c === "string").map((c) => c.trim())
    : []
  const chipSet = new Set(chips)
  for (const s of rawSlots) {
    if (s && typeof s === "object" && typeof s.answer === "string") {
      if (!chipSet.has(s.answer.trim())) return true
    }
  }
  return false
}

/**
 * Build a generated (non-source) item, preserving the AI-chosen type when its
 * content_json validates against the real parsers (interactive types, poll, test).
 * Falls back to a rich custom_text explanation when the content is missing or invalid —
 * never to a broken item or a one-line connector.
 */
function buildGeneratedItem(
  item: PersonalizedCourseGeneratedPlanItem,
  userPrompt: string,
  lessonTitle?: string,
): PersonalizedCourseGeneratedPlanItem {
  const title = item.title.trim()
  const requestedType = item.item_type
  const rawContent =
    item.content_json && typeof item.content_json === "object" && !Array.isArray(item.content_json)
      ? (item.content_json as Record<string, unknown>)
      : null

  if (isInteractiveLessonItemType(requestedType) && rawContent) {
    const validationError = validateInteractiveItemContent(requestedType, rawContent)
    if (!validationError && !hasForbiddenFillSlotMarkers(requestedType, rawContent)) {
      return { title, item_type: requestedType, source_key: null, content_json: rawContent }
    }
    // Invalid interactive content (or fill_slot template using rendered-output format)
    // → fall back to rich custom_text (do not store a broken item).
  } else if (requestedType === "poll" && rawContent) {
    if (!validatePollContent(rawContent)) {
      return { title, item_type: "poll", source_key: null, content_json: rawContent }
    }
  } else if (requestedType === "test" && rawContent) {
    if (!validateTestContent(rawContent, { minProblems: 2 })) {
      return { title, item_type: "test", source_key: null, content_json: rawContent }
    }
  }

  const body =
    typeof rawContent?.body === "string" && rawContent.body.trim().length >= MIN_CUSTOM_TEXT_BODY_LENGTH
      ? rawContent.body.trim()
      : makeRichCustomTextBody(title, userPrompt, lessonTitle)

  return { title, item_type: "custom_text", source_key: null, content_json: { body } }
}

function coerceItem(
  item: PersonalizedCourseGeneratedPlanItem,
  validSourceKeys: Set<string>,
  candidatesByKey: Map<string, PersonalizedCourseCatalogCandidate>,
  userPrompt: string,
  lessonTitle?: string,
): PersonalizedCourseGeneratedPlanItem {
  const sourceKey = item.source_key?.trim() || null
  const hasValidSource = !!sourceKey && validSourceKeys.has(sourceKey)

  if (hasValidSource && sourceKey) {
    const candidate = candidatesByKey.get(sourceKey)
    return {
      title: item.title.trim(),
      item_type: candidate?.item_type ?? item.item_type,
      source_key: sourceKey,
      content_json: item.content_json ?? null,
    }
  }

  // Non-source item: only generatable types are allowed; anything else becomes rich text.
  const generatableItem: PersonalizedCourseGeneratedPlanItem = GENERATABLE_ITEM_TYPE_SET.has(item.item_type)
    ? item
    : { ...item, item_type: "custom_text" }

  return buildGeneratedItem(generatableItem, userPrompt, lessonTitle)
}

function candidateToPlanItem(candidate: PersonalizedCourseCatalogCandidate): PersonalizedCourseGeneratedPlanItem {
  return {
    title: candidate.title,
    item_type: candidate.item_type,
    source_key: candidate.key,
    content_json: null,
  }
}

function replaceDuplicateSourceKeys(
  plan: PersonalizedCourseGeneratedPlan,
): PersonalizedCourseGeneratedPlan {
  const usedKeys = new Set<string>()

  const lessons = plan.lessons.map((lesson) => {
    const items: PersonalizedCourseGeneratedPlanItem[] = []

    for (const item of lesson.items) {
      const sourceKey = item.source_key?.trim() || null
      if (!sourceKey) {
        items.push(item)
        continue
      }

      if (!usedKeys.has(sourceKey)) {
        usedKeys.add(sourceKey)
        items.push({ ...item, source_key: sourceKey })
        continue
      }

      // Drop duplicates; the lesson-aware filler below chooses the best replacement.
    }

    return { ...lesson, items }
  })

  return { ...plan, lessons }
}

function removeIrrelevantSourceItems(
  plan: PersonalizedCourseGeneratedPlan,
  candidatesByKey: Map<string, PersonalizedCourseCatalogCandidate>,
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const lessons = plan.lessons.map((lesson) => {
    const items = lesson.items.filter((item) => {
      const sourceKey = item.source_key?.trim() || null
      if (!sourceKey) return true

      const candidate = candidatesByKey.get(sourceKey)
      if (!candidate) return false

      return scoreCandidateForLesson(candidate, lesson, userPrompt) > 0
    })

    return { ...lesson, items }
  })

  return { ...plan, lessons }
}

const FALLBACK_ITEM_TITLES = [
  "Obiectivul lecției",
  "Ideea centrală",
  "Vocabular esențial",
  "Intuiție rapidă",
  "De ce contează",
  "Exemplu ghidat",
  "Pașii de lucru",
  "Verificare de înțelegere",
  "Greșeală frecventă",
  "Conexiune cu practica",
  "Mini-recapitulare",
  "Întrebare de control",
] as const

function makeGeneratedConnectorItem(
  title: string,
  userPrompt: string,
  lessonTitle?: string,
): PersonalizedCourseGeneratedPlanItem {
  return {
    title,
    item_type: "custom_text",
    source_key: null,
    content_json: {
      body: [
        `## ${title}`,
        lessonTitle ? `**În lecția ${lessonTitle}** continuăm să fixăm ideile pentru obiectivul: **${userPrompt}**.` : `Continuăm să fixăm ideile pentru obiectivul: **${userPrompt}**.`,
        "",
        "Recapitulează punctele cheie parcursse până aici, apoi mergi mai departe pentru a aplica noțiunea într-un nou context.",
      ].join("\n"),
    },
  }
}

function makeFallbackItemTitle(index: number): string {
  const stage = Math.floor(index / FALLBACK_ITEM_TITLES.length) + 1
  const suffix = stage > 1 ? ` (${stage})` : ""
  return `${FALLBACK_ITEM_TITLES[index % FALLBACK_ITEM_TITLES.length]}${suffix}`
}

function ensureMinimumItemsPerLesson(
  plan: PersonalizedCourseGeneratedPlan,
  candidates: PersonalizedCourseCatalogCandidate[],
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const usedKeys = new Set<string>()
  for (const lesson of plan.lessons) {
    for (const item of lesson.items) {
      if (item.source_key) usedKeys.add(item.source_key)
    }
  }

  function takeBestCandidateForLesson(
    lesson: PersonalizedCourseGeneratedPlanLesson,
  ): PersonalizedCourseGeneratedPlanItem | null {
    const best = candidates
      .filter((candidate) => !usedKeys.has(candidate.key))
      .map((candidate) => ({
        candidate,
        score: scoreCandidateForLesson(candidate, lesson, userPrompt),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))[0]

    if (!best) return null
    usedKeys.add(best.candidate.key)
    return candidateToPlanItem(best.candidate)
  }

  return {
    ...plan,
    lessons: plan.lessons.map((lesson) => {
      const items = lesson.items.slice(0, MAX_ITEMS_PER_LESSON)
      let connectorCount = items.filter((item) => !item.source_key && item.item_type === "custom_text").length

      while (items.length < MIN_ITEMS_PER_LESSON) {
        const sourceItem = takeBestCandidateForLesson({ ...lesson, items })
        if (sourceItem) {
          items.push(sourceItem)
          continue
        }

        if (connectorCount >= MAX_CONNECTORS_PER_LESSON) break
        connectorCount += 1

        const fallbackIndex = items.length
        items.push(
          makeGeneratedConnectorItem(
            makeFallbackItemTitle(fallbackIndex),
            userPrompt,
            lesson.title,
          ),
        )
      }

      return { ...lesson, items }
    }),
  }
}

function finalizePlan(
  plan: PersonalizedCourseGeneratedPlan,
  candidates: PersonalizedCourseCatalogCandidate[],
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]))
  const withoutDuplicates = replaceDuplicateSourceKeys(plan)
  const withoutIrrelevantSources = removeIrrelevantSourceItems(
    withoutDuplicates,
    candidatesByKey,
    userPrompt,
  )

  return ensureMinimumItemsPerLesson(withoutIrrelevantSources, candidates, userPrompt)
}

function normalizePlan(
  plan: PersonalizedCourseGeneratedPlan,
  candidates: PersonalizedCourseCatalogCandidate[],
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const validSourceKeys = new Set(candidates.map((candidate) => candidate.key))
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]))

  const lessons: PersonalizedCourseGeneratedPlanLesson[] = plan.lessons.slice(0, 8).map((lesson) => {
    const items = lesson.items.slice(0, MAX_ITEMS_PER_LESSON).map((item) => coerceItem(item, validSourceKeys, candidatesByKey, userPrompt, lesson.title))
    if (items.length >= 2) {
      return { ...lesson, title: lesson.title.trim(), description: lesson.description?.trim() || null, items }
    }
    return {
      ...lesson,
      title: lesson.title.trim(),
      description: lesson.description?.trim() || null,
      items: [
        ...items,
        coerceItem({ title: `Explicație: ${lesson.title}`, item_type: "custom_text" }, validSourceKeys, candidatesByKey, userPrompt, lesson.title),
      ],
    }
  })

  if (lessons.length >= 2) {
    const finalPlan = { title: plan.title.trim(), description: plan.description.trim(), lessons }
    return finalizePlan(finalPlan, candidates, userPrompt)
  }

  // AI returned only 1 lesson — add a second from real candidates
  if (lessons.length === 1 && candidates.length >= 2) {
    const usedKeys = new Set<string>()
    for (const item of lessons[0].items) {
      if (item.source_key) usedKeys.add(item.source_key)
    }
    const unused = candidates.filter((c) => !usedKeys.has(c.key))
    const secondLessonItems = unused.slice(0, 5).map((c) => ({
      title: c.title,
      item_type: c.item_type,
      source_key: c.key,
      content_json: null as Record<string, unknown> | null,
    }))
    if (secondLessonItems.length >= 1) {
      const finalPlan = {
        title: plan.title.trim(),
        description: plan.description.trim(),
        lessons: [
          ...lessons,
          {
            title: "Aplicare și aprofundare",
            description: "Continuăm cu restul conținutului Planck relevant.",
            items: secondLessonItems,
          },
        ],
      }
      return finalizePlan(finalPlan, candidates, userPrompt)
    }
  }

  // Fallback: build entirely from real candidates if AI failed
  if (candidates.length >= 2) {
    // Distribute all candidates across 3 lessons
    const allItems = candidates.map((c) => ({
      title: c.title,
      item_type: c.item_type,
      source_key: c.key,
      content_json: null as Record<string, unknown> | null,
    }))

    const lessons: PersonalizedCourseGeneratedPlanLesson[] = []
    for (let i = 0; i < 3; i++) {
      const slice: PersonalizedCourseGeneratedPlanItem[] = allItems.slice(i * Math.ceil(allItems.length / 3), (i + 1) * Math.ceil(allItems.length / 3))
      lessons.push({
        title: i === 0 ? "Baze și introducere" : i === 1 ? "Aprofundare" : "Aplicare și probleme",
        description: i === 0 ? "Noțiuni fundamentale și intuiție." : i === 1 ? "Aprofundare și exemple." : "Probleme și aplicare.",
        items: slice.slice(0, 30),
      })
    }

    return finalizePlan({
      title: plan.title.trim() || `Curs personalizat: ${userPrompt.slice(0, 48)}`,
      description: plan.description.trim() || `Un traseu personalizat pentru: ${userPrompt}`,
      lessons,
    }, candidates, userPrompt)
  }

  // Last resort: minimal generated content
  return finalizePlan({
    title: plan.title.trim() || `Curs personalizat: ${userPrompt.slice(0, 48)}`,
    description: plan.description.trim() || `Un traseu personalizat pentru: ${userPrompt}`,
    lessons: [
      {
        title: "Start rapid",
        description: "Clarificăm obiectivul și construim baza.",
        items: [
          coerceItem({ title: "Imaginea de ansamblu", item_type: "custom_text" }, validSourceKeys, candidatesByKey, userPrompt, "Start rapid"),
        ],
      },
      {
        title: "Aplicare ghidată",
        description: "Fixăm ideile prin exerciții.",
        items: [
          coerceItem({ title: "Pași de rezolvare", item_type: "custom_text" }, validSourceKeys, candidatesByKey, userPrompt, "Aplicare ghidată"),
        ],
      },
    ],
  }, candidates, userPrompt)
}

// ===================== VERIFIER PIPELINE =====================
// After normalizePlan, every item has already passed schema validation (interactive
// parsers, poll/test validators, fill_slot guard). The verifier is a SECOND pass that
// catches QUALITY issues which pass schema validation but still produce a broken or
// low-quality learning experience — the things a human reviewer would reject:
//   - fill_slot with answer leaked in instructions (student gets the answer for free)
//   - multiple-choice items with ≠ 4 options (too easy / not exam-quality)
//   - answer text appearing in the question/statement/prompt (answer leaked)
//   - structural inconsistencies the parsers tolerate (e.g. match pairs not covering)
// Broken items are replaced with a safe custom_text connector so the lesson keeps its
// length and variety without shipping a broken interaction. The report is stored in
// generation_metadata so quality is observable.

export interface VerificationIssue {
  lessonIndex: number
  itemIndex: number
  itemType: string
  title: string
  reason: string
}

export interface VerificationReport {
  totalItems: number
  replaced: number
  byType: Record<string, number>
  issues: VerificationIssue[]
  bareMathFlags: number
  /** Source-keyed items that the on-topic check rejected and converted to generated items. */
  offTopicSourceDrops: number
  passed: boolean
}

/** Strip LaTeX delimiters and whitespace for answer-leak substring matching. */
function normalizeForLeakCheck(value: string): string {
  return value
    .replace(/\$\$|\$|\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Detect bare math (subscripts/superscripts) outside $...$ — a rendering glitch. */
function countBareMath(text: string): number {
  // Split out math spans, then look for letter/digit + _ or ^ + letter/digit in non-math parts.
  // NOTE: the middle character class is [_^] only — NOT [_^a-zA-Z0-9] which would match every
  // adjacent letter pair in normal prose.
  const parts = text.split(/\$\$[^$]+\$\$|\$[^$]+\$/g)
  let count = 0
  for (const part of parts) {
    const matches = part.match(/[a-zA-Z0-9)][_^][a-zA-Z0-9]/g)
    if (matches) count += matches.length
  }
  return count
}

/**
 * Auto-repair: wrap bare subscript/superscript tokens (e.g. L_0, x^2, v_0, a_n) in
 * $...$ so KaTeX renders them. Only wraps single-letter-variable + _/^ + single
 * alnum, not preceded/followed by letters (avoids matching words like "not_verb").
 * Preserves existing $...$ / $$...$$ spans. Applied to custom_text bodies and
 * reveal_steps markdown content — the most common source of formatting errors.
 */
function wrapBareMathTokens(text: string): string {
  if (!text) return text
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)
  return parts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$")) return part
      if (part.startsWith("$") && part.endsWith("$") && part.length > 1) return part
      // Single letter + _/^ + single alnum, not part of a larger word.
      return part.replace(
        /(?<![a-zA-Z])([a-zA-Z])([_^])([a-zA-Z0-9])(?![a-zA-Z])/g,
        (_m, letter: string, op: string, sub: string) => `$${letter}${op}${sub}$`,
      )
    })
    .join("")
}

/** Returns a reason string if the item is broken (should be replaced), else null. */
function findItemIssue(
  item: PersonalizedCourseGeneratedPlanItem,
): { reason: string; bareMath: boolean } {
  const cj =
    item.content_json && typeof item.content_json === "object" && !Array.isArray(item.content_json)
      ? (item.content_json as Record<string, unknown>)
      : {}
  const t = item.item_type

  if (t === "fill_slot") {
    const template = typeof cj.latexTemplate === "string" ? cj.latexTemplate : ""
    const instructions = typeof cj.instructions === "string" ? cj.instructions : ""
    if (template.includes("?")) return { reason: "fill_slot: „?” în template (folosește {{id}})", bareMath: false }
    // Answer leaked in instructions: instructions contain a full formula (has \frac or =)
    if (instructions.length > 60 && /(\\frac|\=)/.test(instructions)) {
      return { reason: "fill_slot: formula rezolvată în instructions (răspuns dezvăluit)", bareMath: false }
    }
    // Slot answer appears in instructions (for answers ≥ 2 chars to avoid false positives)
    const slots = Array.isArray(cj.slots) ? cj.slots : []
    const instrNorm = normalizeForLeakCheck(instructions)
    for (const s of slots) {
      if (s && typeof s === "object" && typeof s.answer === "string" && s.answer.trim().length >= 2) {
        if (instrNorm.includes(normalizeForLeakCheck(s.answer))) {
          return { reason: "fill_slot: răspuns în instructions (răspuns dezvăluit)", bareMath: false }
        }
      }
    }
  }

  if (t === "poll") {
    const options = Array.isArray(cj.options) ? cj.options : []
    if (options.length !== 4) return { reason: `poll: ${options.length} opțiuni (trebuie 4)`, bareMath: false }
    const question = typeof cj.question === "string" ? cj.question : ""
    const correctId = typeof cj.correctAnswerId === "string" ? cj.correctAnswerId : ""
    const correctOpt = options.find((o: any) => o?.id === correctId)
    if (correctOpt && typeof correctOpt.label === "string") {
      const qNorm = normalizeForLeakCheck(question)
      const aNorm = normalizeForLeakCheck(correctOpt.label)
      if (aNorm.length >= 3 && qNorm.includes(aNorm)) {
        return { reason: "poll: răspunsul corect apare în întrebare (răspuns dezvăluit)", bareMath: false }
      }
    }
  }

  if (t === "test") {
    const problems = Array.isArray(cj.problems) ? cj.problems : []
    for (let i = 0; i < problems.length; i++) {
      const prob = problems[i] as Record<string, unknown> | undefined
      if (!prob) continue
      const opts = Array.isArray(prob.options) ? prob.options : []
      if (opts.length !== 4) return { reason: `test: problema #${i + 1} are ${opts.length} opțiuni (trebuie 4)`, bareMath: false }
      const stmt = typeof prob.statement === "string" ? prob.statement : ""
      const correctId = typeof prob.correctOptionId === "string" ? prob.correctOptionId : ""
      const correctOpt = opts.find((o: any) => o?.id === correctId)
      if (correctOpt && typeof correctOpt.label === "string") {
        const sNorm = normalizeForLeakCheck(stmt)
        const aNorm = normalizeForLeakCheck(correctOpt.label)
        if (aNorm.length >= 3 && sNorm.includes(aNorm)) {
          return { reason: `test: problema #${i + 1} dezvăluie răspunsul în enunț`, bareMath: false }
        }
      }
    }
  }

  if (t === "code_trace") {
    const lines = Array.isArray(cj.lines) ? cj.lines : []
    const steps = Array.isArray(cj.steps) ? cj.steps : []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i] as Record<string, unknown> | undefined
      if (!step) continue
      const inputMode = typeof step.inputMode === "string" ? step.inputMode : "text"
      const answer = typeof step.answer === "string" ? step.answer : ""
      const prompt = typeof step.prompt === "string" ? step.prompt : ""
      const lineIndex = typeof step.lineIndex === "number" ? step.lineIndex : -1
      if (lineIndex < 0 || lineIndex >= lines.length) {
        return { reason: `code_trace: pasul #${i + 1} lineIndex în afara razei`, bareMath: false }
      }
      if (inputMode === "choice") {
        const opts = Array.isArray(step.options) ? step.options : []
        if (opts.length !== 4) return { reason: `code_trace: pasul #${i + 1} are ${opts.length} opțiuni (trebuie 4)`, bareMath: false }
      }
      // Answer leaked in prompt
      if (answer.trim().length >= 2) {
        const pNorm = normalizeForLeakCheck(prompt)
        const aNorm = normalizeForLeakCheck(answer)
        if (aNorm.length >= 2 && pNorm.includes(aNorm)) {
          return { reason: `code_trace: pasul #${i + 1} dezvăluie răspunsul în prompt`, bareMath: false }
        }
      }
    }
  }

  if (t === "reveal_steps") {
    const steps = Array.isArray(cj.steps) ? cj.steps : []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i] as Record<string, unknown> | undefined
      if (!step) continue
      if (step.kind === "quiz") {
        const opts = Array.isArray(step.options) ? step.options : []
        if (opts.length !== 4) return { reason: `reveal_steps: pasul quiz #${i + 1} are ${opts.length} opțiuni (trebuie 4)`, bareMath: false }
      }
    }
  }

  if (t === "match") {
    const left = Array.isArray(cj.left) ? cj.left : []
    const right = Array.isArray(cj.right) ? cj.right : []
    const pairs = Array.isArray(cj.pairs) ? cj.pairs : []
    if (left.length !== right.length || left.length !== pairs.length) {
      return { reason: `match: left/right/pairs lungimi inegale (${left.length}/${right.length}/${pairs.length})`, bareMath: false }
    }
  }

  if (t === "card_sort") {
    const cards = Array.isArray(cj.cards) ? cj.cards : []
    const order = Array.isArray(cj.correctOrder) ? cj.correctOrder : []
    const cardIds = new Set(cards.map((c: any) => c?.id).filter(Boolean))
    if (order.length !== cards.length) {
      return { reason: `card_sort: correctOrder lungime ≠ cards`, bareMath: false }
    }
    for (const id of order) {
      if (!cardIds.has(id)) return { reason: "card_sort: correctOrder conține id inexistent", bareMath: false }
    }
  }

  if (t === "table_fill") {
    const headers = Array.isArray(cj.headers) ? cj.headers : []
    const rows = Array.isArray(cj.rows) ? cj.rows : []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, unknown> | undefined
      const cells = row && Array.isArray(row.cells) ? row.cells : []
      if (cells.length !== headers.length) {
        return { reason: `table_fill: rând #${i + 1} cells.length ≠ headers.length`, bareMath: false }
      }
    }
  }

  if (t === "memory_flip") {
    const pairs = Array.isArray(cj.pairs) ? cj.pairs : []
    if (pairs.length < 2) return { reason: `memory_flip: ${pairs.length} perechi (minim 2)`, bareMath: false }
  }

  if (t === "custom_text") {
    const body = typeof cj.body === "string" ? cj.body : ""
    if (body.trim().length < MIN_CUSTOM_TEXT_BODY_LENGTH) {
      return { reason: "custom_text: body prea scurt", bareMath: false }
    }
  }

  // Soft check: bare math outside $...$ (flag, don't replace unless severe)
  if (t === "custom_text") {
    const text = typeof cj.body === "string" ? cj.body : ""
    const bare = countBareMath(text)
    if (bare >= 6) return { reason: `custom_text: ${bare} expresii matematice neîncadrate în $...$`, bareMath: true }
  }

  return { reason: "", bareMath: false }
}

/**
 * Apply bare-math auto-wrap repair to a generated item's text fields (custom_text
 * body, reveal_steps markdown step content). Returns a new item with repaired content.
 */
function applyBareMathWrap(item: PersonalizedCourseGeneratedPlanItem): PersonalizedCourseGeneratedPlanItem {
  if (!item.content_json || typeof item.content_json !== "object" || Array.isArray(item.content_json)) {
    return item
  }
  const cj = item.content_json as Record<string, unknown>
  if (item.item_type === "custom_text" && typeof cj.body === "string") {
    return { ...item, content_json: { ...cj, body: wrapBareMathTokens(cj.body) } }
  }
  if (item.item_type === "reveal_steps" && Array.isArray(cj.steps)) {
    const steps = cj.steps.map((step) => {
      if (step && typeof step === "object" && (step as Record<string, unknown>).kind === "markdown") {
        const content = (step as Record<string, unknown>).content
        if (typeof content === "string") {
          return { ...step, content: wrapBareMathTokens(content) }
        }
      }
      return step
    })
    return { ...item, content_json: { ...cj, steps } }
  }
  return item
}

/**
 * Generic / template item titles that have appeared in past personalized courses
 * with random, off-topic content. The planner loves to emit "Exercitiu intelegere",
 * "Pasii de lucru" etc. for any subject — including anime, cooking, history — and
 * then fill them with whatever the model invents (often grammar, fake math, etc.).
 * For these titles we apply a stricter relevance check: the actual content must
 * contain at least one of the prompt's non-stop terms, otherwise we treat the item
 * as off-topic and drop the source_key.
 */
const GENERIC_LEARNED_ITEM_TITLES = new Set([
  "exercitiu intelegere",
  "exercițiu intelegere",
  "grila intelegere",
  "grilă intelegere",
  "obiectivul lectiei",
  "obiectivul lecției",
  "obiectivul lectiei (2)",
  "obiectivul lecției (2)",
  "intrebare de control",
  "întrebare de control",
  "mini-recapitulare",
  "pasii de lucru",
  "pașii de lucru",
  "pasii de lucru (2)",
  "pașii de lucru (2)",
  "verificare de intelegere",
  "verificare de înțelegere",
  "verificare de intelegere (2)",
  "verificare de înțelegere (2)",
  "conexiune cu practica",
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

function extractItemHaystack(
  item: PersonalizedCourseGeneratedPlanItem,
  contentJson: Record<string, unknown>,
): string {
  // Concatenate every text field of the item so we can score it against the user prompt.
  const parts: string[] = [item.title]
  for (const v of Object.values(contentJson)) {
    if (typeof v === "string") parts.push(v)
    else if (Array.isArray(v)) {
      for (const entry of v) {
        if (typeof entry === "string") parts.push(entry)
        else if (entry && typeof entry === "object") {
          for (const ev of Object.values(entry as Record<string, unknown>)) {
            if (typeof ev === "string") parts.push(ev)
          }
        }
      }
    } else if (v && typeof v === "object") {
      for (const ev of Object.values(v as Record<string, unknown>)) {
        if (typeof ev === "string") parts.push(ev)
      }
    }
  }
  return parts.filter(Boolean).join(" ")
}

/**
 * Decide whether an item is on-topic for the user's prompt.
 *
 *   - Returns a positive score when the item's haystack mentions the same terms
 *     as the prompt.
 *   - Returns 0 when there's NO term overlap and the item is clearly off-topic
 *     (used for items with generic titles like "Exercitiu intelegere" which the
 *     AI happily fills with random subjects).
 *   - For items with a SPECIFIC, non-generic title, we trust the title (the AI
 *     would not name a chapter-specific concept in a generic way).
 *
 * The function is intentionally lenient: an item about a directly-related
 * concept (e.g. "cursed energy" for a Jujutsu Kaisen prompt) scores positive
 * even if it doesn't share exact nouns. An item about a completely unrelated
 * concept (e.g. a Romanian grammar question) scores 0.
 */
function scoreItemOnTopic(
  item: PersonalizedCourseGeneratedPlanItem,
  userPrompt: string,
  contentJson: Record<string, unknown>,
): number {
  const promptTerms = extractPlannerTerms(userPrompt)
  // If the user prompt is generic / couldn't extract terms, accept everything.
  if (!promptTerms.length) return 1

  const normalizedTitle = normalizeText(item.title)
  // Generic-template items need content matching the prompt.
  if (GENERIC_LEARNED_ITEM_TITLES.has(normalizedTitle)) {
    return scoreTextByTerms(promptTerms, extractItemHaystack(item, contentJson))
  }
  // Specific-title items: the title itself is the proof. Score any overlap.
  return scoreTextByTerms(promptTerms, extractItemHaystack(item, contentJson))
}

/**
 * Verify every item in the plan. For GENERATED items, we check structural
 * validity (existing checks). For SOURCE-KEYED items, we now ALSO check that
 * the resolved content (from the route handler) is on-topic — if not, we drop
 * the source_key and let the post-verification filler replace it with an
 * on-topic generated item. The route handler is responsible for actually
 * passing the source content; when it isn't available, we conservatively
 * trust source items.
 */
function verifyGeneratedPlan(
  plan: PersonalizedCourseGeneratedPlan,
  userPrompt: string,
  sourceContentByKey?: Map<string, Record<string, unknown> | null>,
): { plan: PersonalizedCourseGeneratedPlan; report: VerificationReport } {
  const issues: VerificationIssue[] = []
  const byType: Record<string, number> = {}
  let replaced = 0
  let bareMathFlags = 0
  let offTopicSourceDrops = 0

  const lessons = plan.lessons.map((lesson, lessonIndex) => ({
    ...lesson,
    items: lesson.items.map((item, itemIndex) => {
      byType[item.item_type] = (byType[item.item_type] ?? 0) + 1

      // ON-TOPIC CHECK for source-keyed items. The route handler hands us the
      // actual content of each source item; if the item's content has no term
      // overlap with the user prompt (and the title is one of the known
      // generic template titles), we drop the source_key so the post-verification
      // filler / next round can replace it with a generated item.
      if (item.source_key) {
        const sourceContent = sourceContentByKey?.get(item.source_key)
        if (sourceContent !== undefined) {
          const score = scoreItemOnTopic(item, userPrompt, sourceContent ?? {})
          const isGeneric = GENERIC_LEARNED_ITEM_TITLES.has(normalizeText(item.title))
          if (isGeneric && score === 0) {
            offTopicSourceDrops += 1
            issues.push({
              lessonIndex,
              itemIndex,
              itemType: item.item_type,
              title: item.title,
              reason: "source off-topic (generic title, no content overlap with prompt)",
            })
            const dropped = { ...item, source_key: null, content_json: null }
            return buildGeneratedItem(
              dropped,
              userPrompt,
              lesson.title,
            )
          }
        }
        return item
      }

      // Generated item: repair + structural validation as before.
      const repairedItem = applyBareMathWrap(item)
      const issue = findItemIssue(repairedItem)
      if (issue.bareMath) {
        bareMathFlags += 1
        return repairedItem
      }
      if (!issue.reason) return repairedItem

      issues.push({
        lessonIndex,
        itemIndex,
        itemType: repairedItem.item_type,
        title: repairedItem.title,
        reason: issue.reason,
      })
      replaced += 1
      return makeGeneratedConnectorItem(
        makeFallbackItemTitle(itemIndex),
        userPrompt,
        lesson.title,
      )
    }),
  }))

  const totalItems = lessons.reduce((total, l) => total + l.items.length, 0)
  const report: VerificationReport = {
    totalItems,
    replaced,
    byType,
    issues,
    bareMathFlags,
    passed: issues.length === 0,
    offTopicSourceDrops,
  }
  return { plan: { ...plan, lessons }, report }
}

const GENERATED_CONTENT_GUIDE = `TIPURI DE ITEMI GENERAȚI (fără source_key) și conținutul content_json EXACT (validat strict). Folosește DOAR aceste tipuri pentru itemi generați — ele reflectă frecvența tipurilor din lecțiile oficiale Planck:

- custom_text: {"body": "markdown substancial — titlu ##, 2-4 paragrafe, exemple, $formule LaTeX$. Minim ~80 de cuvinte."}. Pentru sublinieri folosește shortcode-urile oficiale: [IMPORTANT]...[/IMPORTANT] pentru idei-cheie, [FORMULA]$$...$$[/FORMULA] pentru formule evidențiate, [ENUNT]...[/ENUNT] pentru enunțuri de probleme, [CODINLINE]...[/CODINLINE] pentru cod inline, [DEFINITIE]...[/DEFINITIE] pentru definiții, [EXEMPLU]...[/EXEMPLU] pentru exemple. Aceste shortcode-uri sunt stilizate special în Planck — folosește-le ca în lecțiile oficiale.
- poll: {"imageSrc": "" (sau URL imagine, opțional), "imageAlt": "" (opțional), "question": "...?", "correctAnswerId": "id_răspuns_corect", "options": [{"id":"a","label":"...","feedback":"explicație afișată după răspuns"},{"id":"b","label":"...","feedback":"..."},{"id":"c","label":"...","feedback":"..."},{"id":"d","label":"...","feedback":"..."}]} — EXACT 4 opțiuni (niciodată 3 sau 5); FIECARE opțiune trebuie să aibă feedback (explicație scurtă, educativă); correctAnswerId trebuie să fie unul dintre id-urile opțiunilor. Întrebarea NU trebuie să conțină răspunsul corect sau să-l dezvăluie. Folosește poll pentru verificări de înțelegere cu explicații.
- match: {"instructions": "...opțional", "left": [{"id":"l1","text":"..."}], "right": [{"id":"r1","text":"..."}], "pairs": [{"leftId":"l1","rightId":"r1"}]} — left și right au aceeași lungime (2-6); pairs asociază fiecare element o singură dată. Bine pentru termen↔definiție.
- card_sort: {"instructions": "...opțional", "cards": [{"id":"a","text":"..."}], "correctOrder": ["a",...]} — correctOrder este o permutare a id-urilor (4 carduri). Bine pentru ordonare de pași/nivele.
- fill_slot: {"instructions": "...opțional, SCURT — fără formula rezolvată", "latexTemplate": "F = {{m}} \\cdot a", "slots": [{"id":"m","answer":"2"}], "chips": ["1","2","5","10"]}. FORMAT CRITIC: locurile goale se marchează EXCLUSIV cu {{id}} sau {{{id}}}. Exemple corecte: "F = {{m}} \\cdot a", "v = \\frac{{{d}}}{{{t}}}", "P = {{{U}}} \\cdot {{{I}}}", "a^2 + b^2 = {{c}}^2". Pentru fracții: \\frac{{{num}}}{{{den}}} (triple acolade). FIECARE {{id}} din slots trebuie să apară în latexTemplate; chips include toate answer-urile + minim 2 distractoare. INTERZIS STRICT în latexTemplate: caracterul ?, \\htmlId, fill-slot-, \\boxed, \\text{?}, \\color{#...}. Folosești DOAR {{id}} — NICIODATĂ ?. Numărul de {{id}} din template trebuie să fie exact egal cu numărul de slots. INSTRUCTIONS nu trebuie să conțină formula rezolvată sau răspunsul — studentul completează blanks-urile; dacă pui formula cu răspunsuri în instructions, îi dai răspunsul gratuit.
- reveal_steps: {"instructions": "...opțional", "steps": [{"kind":"markdown","content":"..."},{"kind":"quiz","content":"...?","options":["a","b","c","d"],"correctIndex":0}]} — minim 3 pași. Pentru pașii quiz: EXACT 4 opțiuni. Bine pentru exerciții rezolvate pas cu pas: [ENUNT]...[/ENUNT] la primul pas, [FORMULA]$$...$$[/FORMULA] în calcule, [IMPORTANT]...[/IMPORTANT] la concluzie. Conținutul unui pas markdown NU trebuie să dezvăluie răspunsul unui pas quiz anterior.
- table_fill: {"instructions": "...opțional", "headers": ["Mărime","Unitate"], "rows": [{"cells": [{"text":"Forță"},{"blank":true,"answer":"N"}]}]} — cells.length === headers.length; celulele blank au {"blank":true,"answer":"..."}.
- swipe_classify: {"prompt": "...opțional", "leftLabel": "Adevărat", "rightLabel": "Fals", "cards": [{"text":"...","side":"left"}]} — 4-8 carduri; side "left" sau "right".
- memory_flip: {"instructions": "...opțional", "pairs": [{"a":"$\\vec{F}$","b":"Forță"}]} — 3 perechi; a/b markdown sau LaTeX.
- code_trace: {"language": "python", "lines": ["x = 1","y = x + 2","while i <= 4:"], "steps": [{"lineIndex":1,"prompt":"Ce valoare are y?","inputMode":"text","answer":"3"}]} — pentru inputMode "choice": EXACT 4 opțiuni și answer printre ele; lineIndex în raza lines (0..len-1). Preferă inputMode "text" ca în lecțiile oficiale. În lines poți folosi < > <= >= (monospaced). [CODINLINE]...[/CODINLINE] în prompt pentru variabile; nu $...$ în lines. Promptul NU trebuie să conțină răspunsul.
- test: {"icon": "Zap", "description": "...", "difficulty": 1-5, "timeLimitSeconds": 300, "problems": [{"id":"q1","statement":"...?","imageUrl":null,"options":[{"id":"q1_a","label":"..."},{"id":"q1_b","label":"..."},{"id":"q1_c","label":"..."},{"id":"q1_d","label":"..."}],"correctOptionId":"q1_a"}]} — minim 2 probleme, FIECARE cu EXACT 4 opțiuni și correctOptionId printre ele; id-uri unice; imageUrl null sau URL http(s). Enunțul NU trebuie să conțină răspunsul corect. Bine pentru mini-test de recapitulare la final de lecție.

REGULI PENTRU ITEMI GENERAȚI:
- Fiecare lecție trebuie să conțină un MIX VARIAT, ca în lecțiile oficiale Planck: minim 2 itemi custom_text cu explicații substaniale ȘI minim 4 itemi interactivi/de verificare de tipuri DIFERITE din lista de mai sus (poll, match, card_sort, fill_slot, reveal_steps, table_fill, swipe_classify, memory_flip, code_trace). NU folosi doar custom_text.
- Ponderie naturală: folosește des poll (verificări cu feedback), match, code_trace, reveal_steps, swipe_classify, fill_slot, card_sort; mai rar memory_flip și table_fill. NU genera tipurile care nu sunt în lista de mai sus (flow_build, graph_build, slider_explore, speed_round).
- La finalul ultimei lecții adaugă de obicei un item test (mini-test de recapitulare).
- Conținutul generat trebuie să fie relevant pentru TITLUL lecției și obiectivul userului, calitate de manual, NU text generic de legătură.
- RĂSPUNS CORECT NU SE DEZVĂLUI: întrebarea/enunțul/instrucțiunile/promptul NU trebuie să conțină răspunsul corect sau formula rezolvată. La fill_slot, instructions e doar un scurt context („Completează formula alungirii”), NU formula cu valori puse. La poll/test, enunțul nu conține textul opțiunii corectă. La code_trace, promptul nu conține valoarea answer.
- 4 OPȚIUNI: toate itemile cu variante (poll, test problems, code_trace choice, reveal_steps quiz) trebuie să aibă EXACT 4 opțiuni/variante — niciodată 3, niciodată 5. Patru opțiuni = calitate de bacalaureat/examen.

FORMAT MATEMATIC (CRITIC — fără excepții):
- ORICE matematică (variabile, indici, exponenți, formule, fracții, inegalități, prime) TREBUIE încadrată cu delimitatori LaTeX: $...$ pentru matematică inline (în text) și $$...$$ pentru formule pe rând propriu (display). EXEMPLE CORECTE: „Derivata funcției $f$ în punctul $x_0$...”, „pentru $f(x)=x^2$, derivata în $x=3$ este $f'(3)=6$”, „dacă $f'(x_0)>0$ funcția este crescătoare”, „$$f'(x_0)=\\lim_{h\\to 0}\\frac{f(x_0+h)-f(x_0)}{h}$$”.
- INTERZIS să scrii matematică ca text simplu: niciodată „x_0”, „f(x)=x^2”, „f'(x_0) > 0”, „x^2” în afara delimitatorilor $...$. Acestea se randează stricat (indici/exponenți nu se formatează, < > devin entități HTML). Scrie ÎNTOTDEAUNA $x_0$, $f(x)=x^2$, $f'(x_0)>0$, $x^2$.
- În interiorul $...$ folosește sintaxa LaTeX: indici cu _ (x_0, a_1), exponenți cu ^ (x^2, 10^5), fracții cu \\frac{num}{den}, radicali cu \\sqrt{x}, limite cu \\lim_{h\\to 0}, prime cu ' (f'(x), f'').
- În interiorul $...$ folosește \\lt și \\gt pentru inegalități (nu caracterele < >), sau scrie inegalitatea ca text inline natural ($f'(x_0)>0$ e acceptat și randează corect). NU folosi < > ca atare în text simplu în afara $...$.
- Nu folosi delimitatori \(...\) sau \[...\]; folosește doar $...$ și $$...$$.
- Pentru cod (code_trace.lines, [CODINLINE]...) poți folosi < > <= >= (codul se afișează ca text monospaced, nu se interpretează HTML).
- Pentru itemii cu source_key, content_json = null. Nu inventa source_key — folosește doar cheile din listă sau null.`

/**
 * Subject-specific on-topic rules. Selected at planner-call time based on
 * isPlanckCatalogSubject(userPrompt). The non-catalog variant is much stricter
 * because the source-item path is the #1 way off-topic content sneaks into
 * a non-STEM course.
 */
const ON_TOPIC_RULES_CATALOG = `DECIZIA source_key vs GENERAT (subiect din CATALOG):
- O sursă Planck se folosește DOAR dacă e o potrivire evidentă: titlul ei specific se referă la un concept central al lecției (de ex. o problemă de fizică cu titlu specific se potrivește cu o lecție de fizică).
- Pentru itemi de umplutură, itemi introductivi sau recapitulare, folosește GENERAT nu sursă.`

const ON_TOPIC_RULES_NON_CATALOG = `DECIZIA source_key vs GENERAT (subiect NON-CATALOG):
- ACEST SUBIECT NU FACE PARTE DIN CATALOGUL PLANCK. Catalogul conține DOAR conținut pentru matematică, fizică, chimie, biologie, informatică, gramatică și istorie. Orice alt subiect (anime, filme, sport, bucătărie, călătorii, hobby-uri, muzică, jocuri, manhwa, seriale, parenting, fitness, orice cultură pop, orice domeniu non-academic) este NON-CATALOG.
- REGULĂ ABSOLUTĂ: NU FOLOSI source_key. Setează întotdeauna source_key: null. Chiar dacă vezi surse în available_planck_content (sunt candidate nepotrivite rămase din căutare), NU le folosi. Itemii trebuie să fie 100% GENERAȚI pe acest subiect.
- Orice încercare de a reutiliza un source_key pentru un subiect non-catalog produce conținut off-topic (itemi generici de legătură, probleme de matematică fabricate, exerciții de gramatică străine de subiect) și va fi respinsă de validator.`

const SYSTEM_PROMPT = `Ești plannerul de cursuri personalizate PLANCK Academy.
Răspunzi DOAR cu JSON valid, fără Markdown în afara valorilor din content_json.

REGULA PRINCIPALĂ: Folosește cât mai mult conținut real din Planck (via source_key). Nu inventa probleme, grile, teste sau lecții care deja există în lista de mai jos.

Pentru itemii cu source_key: content_json = null, item_type = tipul din listă. Nu repeta niciun source_key în curs — fiecare item real apare o singură dată.

Pentru itemii FĂRĂ source_key (generați): creează conținut rich și variat, exact ca în lecțiile oficiale Planck. Urmează ghidul de mai jos. Fiecare item generat trebuie să aibă un item_type permis și un content_json valid complet — nu lăsa câmpuri goale.

${GENERATED_CONTENT_GUIDE}

REGULI ON-TOPIC (FOARTE IMPORTANTE — fără excepții):
- OBIECTIVUL utilizatorului este descris în mesajul user mai jos (câmpul user_learning_goal). FIE CARE item din curs (cu sau fără source_key) TREBUIE să fie despre acest subiect. Nu introduce itemi despre alte domenii (de ex. matematică, gramatică, probleme de logică abstractă) decât dacă fac parte natural din subiect.
- {{ON_TOPIC_RULES}}
- Dacă folosești o sursă și titlul ei e generic ("Exercitiu intelegere", "Obiectivul lectiei", "Grila intelegere", "Mini-recapitulare", "Intrebare de control", "Pasii de lucru", "Verificare de intelegere", "Conexiune cu practica", "Gresala frecventa", "Vocabular esential", "Ideea centrala", "Intuitie rapida", "De ce conteaza", "Exemplu ghidat"), verifică dacă conținutul ei (din summary) se potrivește cu subiectul. Dacă nu se potrivește, NU folosi sursa — generează în schimb un item propriu pe subiect.
- Pentru itemii cu schemă matematică (fill_slot, table_fill) folosește-i DOAR dacă subiectul este unul în care formulele au sens natural (matematică, fizică, chimie, informatică). Pentru orice alt subiect, folosește în schimb match, swipe_classify, custom_text cu explicație, sau alt tip non-matematic. Inventarea de formule pentru subiecte unde matematica nu e naturală (ex. "P_Gojo = E × k" pe un curs despre anime) este INTERZISĂ.
- ID-uri HALUCINATE INTERZISE: nu inventa niciodată ID-uri precum problem_id, quiz_question_id, cursuri_lesson_slug. Schema itemului conține DOAR source_key (unul din lista de mai sus sau null) și content_json (null dacă ai source_key; altfel obiectul complet). Orice referință la ID-uri externe va fi respinsă de validator.

Creează un traseu complet, cu 3-5 lecții. FIECARE lecție trebuie să aibă 20-25 itemi relevanți pentru titlul lecției. Pentru surse Planck folosește cele care sunt potriviri clare (fără duplicate), apoi completează cu itemi generați rich și variați (explicații custom_text + itemi interactivi), NU cu text generic de legătură.

Distribuie itemii pe lecții în ordine logică: prima lecție = introducere/baze, ultimele = aplicare/probleme. Fiecare lecție trebuie să arate ca o lecție oficială Planck: explicații clare urmate de practică interactivă.

Ponderi orientative (nu sunt reguli dure, urmărește calitatea conținutului pe subiect):
- Subiect din catalog Planck (matematică, fizică, chimie, biologie, informatică, gramatică, istorie): include câteva surse Planck reale pentru itemi concreți (definiții, probleme, exerciții din lecțiile oficiale), restul generează.
- Subiect non-catalog (anime, filme, sport, bucătărie, călătorii, hobby, orice cultură pop): 100% generat, nicio sursă. Itemii trebuie să fie creați din zero pe subiect.
- Itemii generați trebuie să fie un MIX VARIAT, exact ca în lecțiile oficiale: minim 2 custom_text cu explicații substanțiale + minim 4 itemi interactivi/de verificare de tipuri DIFERITE per lecție (poll, match, card_sort, reveal_steps, swipe_classify, memory_flip, code_trace, test). NU genera doar custom_text.`

function normalizeParsedPlan(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeParsedPlan)
  }
  if (value && typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      if (key === "item_type" && Array.isArray(obj[key])) {
        const first = obj[key][0]
        result[key] = typeof first === "string" ? first : "custom_text"
      } else {
        result[key] = normalizeParsedPlan(obj[key])
      }
    }
    return result
  }
  return value
}

function buildPlannerMessages(
  userPrompt: string,
  candidates: PersonalizedCourseCatalogCandidate[],
  repairNote: string | null,
): { role: "system" | "user"; content: string }[] {
  const isCatalogSubject = isPlanckCatalogSubject(userPrompt)
  // For non-catalog subjects (anime, cooking, pop culture, etc.), explicitly
  // tell the planner NOT to use source items. The catalog has no relevant
  // content for those topics and any candidate it found is a false positive
  // (e.g. a previous personalized course's items). The planner should
  // generate 100% of the items from scratch.
  const subjectKind = isCatalogSubject ? "catalog" : "non-catalog"
  const systemPrompt = SYSTEM_PROMPT.replace(
    "{{ON_TOPIC_RULES}}",
    isCatalogSubject ? ON_TOPIC_RULES_CATALOG : ON_TOPIC_RULES_NON_CATALOG,
  )
  const base: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          user_learning_goal: userPrompt,
          subject_kind: subjectKind,
          // For non-catalog subjects, omit the candidate list entirely so the
          // planner doesn't try to reuse items from unrelated past courses.
          available_planck_content: isCatalogSubject
            ? stringifyCandidates(candidates)
            : "Nu există conținut Planck relevant. Generează toți itemii de la zero pe acest subiect.",
          instruction: isCatalogSubject
            ? "Alege iteme prin source_key din lista de mai sus (fără duplicate) DOAR pentru itemi unde titlul sursei e o potrivire evidentă cu conceptul central al lecției (de ex. o problemă de fizică cu titlu specific se potrivește cu o lecție de fizică). Pentru itemi de umplutură, itemi introductivi, sau itemi de recapitulare, folosește GENERAT nu sursă. Fiecare lecție trebuie să aibă 20-25 itemi. Completează cu itemi GENERAȚI rich și variați — minim 2 custom_text cu explicații substanțiale ȘI minim 4 itemi interactivi/de verificare de tipuri diferite per lecție (poll, match, card_sort, reveal_steps, swipe_classify, memory_flip, code_trace, test), cu content_json valid conform ghidului. La finalul ultimei lecții adaugă un item test. Nu genera doar custom_text."
            : "NU folosi surse Planck. Generează toți itemii de la zero pe acest subiect. Fiecare lecție trebuie să aibă 20-25 itemi — minim 2 custom_text cu explicații substanțiale ȘI minim 4 itemi interactivi/de verificare de tipuri diferite per lecție (poll, match, card_sort, reveal_steps, swipe_classify, memory_flip, code_trace, test), cu content_json valid conform ghidului. La finalul ultimei lecții adaugă un item test. Nu genera doar custom_text și nu genera tipurile care nu sunt în ghid (flow_build, graph_build, slider_explore, speed_round). IMPORTANT: pentru acest subiect, folosește DOAR tipuri non-matematice (custom_text, poll, match, card_sort, reveal_steps, swipe_classify, memory_flip, test, code_trace). NU folosi fill_slot sau table_fill deoarece subiectul nu e unul în care formulele matematice au sens.",
          required_json_shape: {
            title: "string",
            description: "string",
            lessons: [
              {
                title: "string",
                description: "string",
                items: [
                  {
                    title: "string",
                    item_type: "custom_text | poll | match | card_sort | fill_slot | reveal_steps | table_fill | swipe_classify | memory_flip | code_trace | test | text | grila | problem | ...",
                    source_key: isCatalogSubject
                      ? "exact un source_key din listă sau null"
                      : "întotdeauna null (subiect non-catalog — nu folosi surse)",
                    content_json: isCatalogSubject
                      ? "null dacă ai source_key; altfel obiectul content_json complet pentru tipul ales, conform ghidului"
                      : "mereu obiectul content_json complet (nu folosi source_key)",
                  },
                ],
              },
            ],
          },
        },
        null,
        2,
      ),
    },
  ]
  if (repairNote) base.push({ role: "user", content: repairNote })
  return base
}

/**
 * Some providers/models occasionally wrap JSON in markdown code fences or emit stray
 * text around it despite `response_format: json_object`. Strip a leading ```json / ```
 * fence and trim to the outermost { ... } so JSON.parse has a clean shot.
 */
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

/**
 * Tolerant JSON parse: tries direct parse, then common LLM repairs (trailing commas),
 * then progressive truncation to recover a partial plan (better than failing entirely).
 */
function parseJsonTolerant(raw: string): unknown | null {
  const cleaned = extractJsonObject(raw)
  // Attempt 1: direct parse.
  try { return JSON.parse(cleaned) } catch { /* continue */ }
  // Attempt 2: remove trailing commas before } or ] (most common LLM JSON error).
  try { return JSON.parse(cleaned.replace(/,\s*([}\]])/g, "$1")) } catch { /* continue */ }
  // Attempt 3: progressive truncation — find the last valid closing brace that produces
  // a parseable object. Accepts a partial plan (e.g. 2 of 3 lessons) rather than failing.
  let text = cleaned
  while (text.length > 100) {
    const lastBrace = text.lastIndexOf("}")
    if (lastBrace < 0) break
    text = text.slice(0, lastBrace + 1)
    // If we cut mid-array, close the array and object.
    const attempt = text + "]}".repeat(text.split("{").length - text.split("}").length)
    try { return JSON.parse(attempt.replace(/,\s*([}\]])/g, "$1")) } catch { /* continue */ }
  }
  return null
}

export async function planPersonalizedCourse(
  userPrompt: string,
  candidates: PersonalizedCourseCatalogCandidate[],
  sourceContentByKey?: Map<string, Record<string, unknown> | null>,
): Promise<{ plan: PersonalizedCourseGeneratedPlan; verification: VerificationReport }> {
  const openai = getOpenAIClient()
  const { model, maxTokens } = getPlannerProviderConfig()

  // Hard total deadline: 5 minutes across all attempts. Prevents "runs forever" if the
  // model hangs or the retry loop stalls. The route runs this detached (afterResponse),
  // but we still cap it so a stuck generation flips to "failed" rather than hanging.
  const deadline = Date.now() + 5 * 60 * 1000

  let lastError: Error | null = null
  let validated: { success: true; data: PersonalizedCourseGeneratedPlan } | null = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (Date.now() >= deadline) {
      lastError = lastError ?? new Error("Course generation timed out.")
      break
    }
    const repairNote =
      attempt === 0
        ? null
        : "Răspunsul trecut NU a fost JSON valid sau a fost trunchiat. Răspunde din nou cu JSON-ul complet și valid, fără text în afara obiectului JSON, fără ```cod fences```. Asigură-te că obiectul JSON este complet închis. Redă planul întreg (3-5 lecții, 20-25 itemi fiecare)."
    // On retry, raise the token budget in case the first attempt was truncated.
    const attemptMaxTokens = attempt === 0 ? maxTokens : maxTokens + 8000

    let completion: Awaited<ReturnType<typeof openai.chat.completions.create>>
    try {
      completion = await openai.chat.completions.create({
        model,
        messages: buildPlannerMessages(userPrompt, candidates, repairNote),
        response_format: { type: "json_object" },
        temperature: attempt === 0 ? 0.4 : 0.2,
        max_tokens: attemptMaxTokens,
      })
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }

    const choice = completion.choices[0]
    const rawContent = choice?.message?.content
    const finishReason = choice?.finish_reason ?? null

    if (!rawContent) {
      lastError = new Error(
        `AI did not return course JSON (finish_reason=${finishReason ?? "unknown"}).`,
      )
      continue
    }

    let parsed: unknown
    const tolerantResult = parseJsonTolerant(rawContent)
    if (tolerantResult === null) {
      const preview = rawContent.slice(0, 200).replace(/\s+/g, " ")
      lastError = new Error(
        `AI returned invalid JSON (attempt ${attempt + 1}, finish_reason=${finishReason ?? "unknown"}, len=${rawContent.length}): ${preview}`,
      )
      // Truncation (finish_reason=length) or stray text → retry with repair note + more tokens.
      continue
    }
    parsed = tolerantResult

    parsed = normalizeParsedPlan(parsed)
    const result = planSchema.safeParse(parsed)
    if (!result.success) {
      lastError = new Error(`AI course JSON failed validation: ${result.error.message}`)
      continue
    }

    validated = result as { success: true; data: PersonalizedCourseGeneratedPlan }
    break
  }

  if (!validated) throw lastError ?? new Error("AI course generation failed")

  const normalizedPlan = normalizePlan(validated.data, candidates, userPrompt)
  const { plan: verifiedPlan, report } = verifyGeneratedPlan(normalizedPlan, userPrompt, sourceContentByKey)
  return { plan: verifiedPlan, verification: report }
}
