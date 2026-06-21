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
  const maxTokens = isReasoningModel ? 32000 : 20000

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
  return /(\\htmlId|fill-slot-|\\boxed|\\text\{\?\}|\\color\{#)/.test(template)
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

const GENERATED_CONTENT_GUIDE = `TIPURI DE ITEMI GENERAȚI (fără source_key) și conținutul content_json EXACT (validat strict). Folosește DOAR aceste tipuri pentru itemi generați — ele reflectă frecvența tipurilor din lecțiile oficiale Planck:

- custom_text: {"body": "markdown substancial — titlu ##, 2-4 paragrafe, exemple, $formule LaTeX$. Minim ~80 de cuvinte."}. Pentru sublinieri folosește shortcode-urile oficiale: [IMPORTANT]...[/IMPORTANT] pentru idei-cheie, [FORMULA]$$...$$[/FORMULA] pentru formule evidențiate, [ENUNT]...[/ENUNT] pentru enunțuri de probleme, [CODINLINE]...[/CODINLINE] pentru cod inline, [DEFINITIE]...[/DEFINITIE] pentru definiții, [EXEMPLU]...[/EXEMPLU] pentru exemple. Aceste shortcode-uri sunt stilizate special în Planck — folosește-le ca în lecțiile oficiale.
- poll: {"imageSrc": "" (sau URL imagine, opțional), "imageAlt": "" (opțional), "question": "...?", "correctAnswerId": "id_răspuns_corect", "options": [{"id":"a","label":"...","feedback":"explicație afișată după răspuns"}]} — minim 2 opțiuni; FIECARE opțiune trebuie să aibă feedback (explicație scurtă, educativă); correctAnswerId trebuie să fie unul dintre id-urile opțiunilor. Folosește poll pentru verificări de înțelegere cu explicații.
- match: {"instructions": "...opțional", "left": [{"id":"l1","text":"..."}], "right": [{"id":"r1","text":"..."}], "pairs": [{"leftId":"l1","rightId":"r1"}]} — left și right au aceeași lungime (2-6); pairs asociază fiecare element o singură dată. Bine pentru termen↔definiție.
- card_sort: {"instructions": "...opțional", "cards": [{"id":"a","text":"..."}], "correctOrder": ["a",...]} — correctOrder este o permutare a id-urilor (4 carduri). Bine pentru ordonare de pași/nivele.
- fill_slot: {"instructions": "...opțional", "latexTemplate": "F = {{m}} \\cdot a", "slots": [{"id":"m","answer":"2"}], "chips": ["1","2","5","10"]}. FORMAT CRITIC pentru latexTemplate: locurile goale se marchază cu placeholder-e {{id}} sau {{{id}}}, EXACT ca în exemple. Exemple corecte: "F = {{m}} \\cdot a", "v = \\frac{{{d}}}{{{t}}}", "P = {{{U}}} \\cdot {{{I}}}", "a^2 + b^2 = {{c}}^2". Pentru fracții folosește {{{id}}} (triple acolade) ca argument: \\frac{{{num}}}{{{den}}}. FIECARE {{id}} din slots trebuie să apară în latexTemplate; chips include toate answer-urile + distractoare. INTERZIS STRICT în latexTemplate: \htmlId, fill-slot-, \boxed, \text{?}, \color{#...} — acestea sunt OUTPUT-ul randat de Planck, NU formatul de intrare. Dacă le scrii, formula se strică. Folosești DOAR {{id}} ca placeholder.
- reveal_steps: {"instructions": "...opțional", "steps": [{"kind":"markdown","content":"..."},{"kind":"quiz","content":"...?","options":["a","b","c"],"correctIndex":0}]} — minim 3 pași. Bine pentru exerciții rezolvate pas cu pas: folosește [ENUNT]...[/ENUNT] la primul pas, [FORMULA]$$...$$[/FORMULA] în pașii de calcul, [IMPORTANT]...[/IMPORTANT] la concluzie.
- table_fill: {"instructions": "...opțional", "headers": ["Mărime","Unitate"], "rows": [{"cells": [{"text":"Forță"},{"blank":true,"answer":"N"}]}]} — cells.length === headers.length; celulele blank au {"blank":true,"answer":"..."}.
- swipe_classify: {"prompt": "...opțional", "leftLabel": "Adevărat", "rightLabel": "Fals", "cards": [{"text":"...","side":"left"}]} — 4-8 carduri; side "left" sau "right".
- memory_flip: {"instructions": "...opțional", "pairs": [{"a":"$\\vec{F}$","b":"Forță"}]} — 3 perechi; a/b markdown sau LaTeX.
- code_trace: {"language": "python", "lines": ["x = 1","y = x + 2"], "steps": [{"lineIndex":1,"prompt":"Ce valoare are y?","inputMode":"text","answer":"3"}]} — pentru inputMode "choice", answer trebuie să fie printre options și minim 2 opțiuni; lineIndex în raza lines (0..len-1). Preferă inputMode "text" ca în lecțiile oficiale. Folosește [CODINLINE]...[/CODINLINE] în prompt pentru variabile.
- test: {"icon": "Zap", "description": "...", "difficulty": 1-5, "timeLimitSeconds": 300, "problems": [{"id":"q1","statement":"...?","imageUrl":null,"options":[{"id":"q1_a","label":"..."}],"correctOptionId":"q1_a"}]} — minim 2 probleme, fiecare cu 2-4 opțiuni și correctOptionId printre ele; id-uri unice; imageUrl null sau URL http(s). Bine pentru mini-test de recapitulare la final de lecție.

REGULI PENTRU ITEMI GENERAȚI:
- Fiecare lecție trebuie să conțină un MIX VARIAT, ca în lecțiile oficiale Planck: minim 2 itemi custom_text cu explicații substaniale ȘI minim 4 itemi interactivi/de verificare de tipuri DIFERITE din lista de mai sus (poll, match, card_sort, fill_slot, reveal_steps, table_fill, swipe_classify, memory_flip, code_trace). NU folosi doar custom_text.
- Ponderie naturală: folosește des poll (verificări cu feedback), match, code_trace, reveal_steps, swipe_classify, fill_slot, card_sort; mai rar memory_flip și table_fill. NU genera tipurile care nu sunt în lista de mai sus (flow_build, graph_build, slider_explore, speed_round).
- La finalul ultimei lecții adaugă de obicei un item test (mini-test de recapitulare).
- Conținutul generat trebuie să fie relevant pentru TITLUL lecției și obiectivul userului, calitate de manual, NU text generic de legătură.
- Pentru matematică folosește LaTeX ($...$, $$...$$). NU folosi caractere < > & în câmpuri afișate ca text simplu (lines, options, answer, chips, label, statement, feedback).
- Pentru itemii cu source_key, content_json = null. Nu inventa source_key — folosește doar cheile din listă sau null.`

const SYSTEM_PROMPT = `Ești plannerul de cursuri personalizate PLANCK Academy.
Răspunzi DOAR cu JSON valid, fără Markdown în afara valorilor din content_json.

REGULA PRINCIPALĂ: Folosește cât mai mult conținut real din Planck (via source_key). Nu inventa probleme, grile, teste sau lecții care deja există în lista de mai jos.

Pentru itemii cu source_key: content_json = null, item_type = tipul din listă. Nu repeta niciun source_key în curs — fiecare item real apare o singură dată.

Pentru itemii FĂRĂ source_key (generați): creează conținut rich și variat, exact ca în lecțiile oficiale Planck. Urmează ghidul de mai jos. Fiecare item generat trebuie să aibă un item_type permis și un content_json valid complet — nu lăsa câmpuri goale.

${GENERATED_CONTENT_GUIDE}

Creează un traseu complet, cu 3-5 lecții. FIECARE lecție trebuie să aibă 20-25 itemi relevanți pentru titlul lecției. Folosește întâi itemele reale relevante din listă (fără duplicate), apoi completează cu itemi generați rich și variați (explicații custom_text + itemi interactivi), NU cu text generic de legătură.

Distribuie itemii pe lecții în ordine logică: prima lecție = introducere/baze, ultimele = aplicare/probleme. Fiecare lecție trebuie să arate ca o lecție oficială Planck: explicații clare urmate de practică interactivă.

Minim 50% din itemi trebuie să aibă source_key valid când există conținut relevant. Restul sunt itemi generați rich și variați (nu doar custom_text).`

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

export async function planPersonalizedCourse(
  userPrompt: string,
  candidates: PersonalizedCourseCatalogCandidate[],
): Promise<PersonalizedCourseGeneratedPlan> {
  const openai = getOpenAIClient()
  const { model, maxTokens, isReasoningModel } = getPlannerProviderConfig()
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify(
          {
            user_learning_goal: userPrompt,
            available_planck_content: stringifyCandidates(candidates),
            instruction: "Alege iteme prin source_key din lista de mai sus (fără duplicate). Fiecare lecție trebuie să aibă 20-25 itemi. Completează restul cu itemi GENERAȚI rich și variați — minim 2 custom_text cu explicații substaniale ȘI minim 4 itemi interactivi/de verificare de tipuri diferite per lecție (poll, match, card_sort, fill_slot, reveal_steps, table_fill, swipe_classify, memory_flip, code_trace), cu content_json valid conform ghidului. La finalul ultimei lecții adaugă un item test. Nu genera doar custom_text și nu genera tipurile care nu sunt în ghid (flow_build, graph_build, slider_explore, speed_round).",
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
                      source_key: "exact un source_key din listă sau null",
                      content_json: "null dacă ai source_key; altfel obiectul content_json complet pentru tipul ales, conform ghidului",
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
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: maxTokens,
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error("AI did not return course JSON")

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    throw new Error("AI returned invalid JSON")
  }

  parsed = normalizeParsedPlan(parsed)

  const validated = planSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error(`AI course JSON failed validation: ${validated.error.message}`)
  }

  return normalizePlan(validated.data, candidates, userPrompt)
}
