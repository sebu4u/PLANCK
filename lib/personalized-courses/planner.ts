import "server-only"

import OpenAI from "openai"
import { z } from "zod"
import type {
  PersonalizedCourseCatalogCandidate,
  PersonalizedCourseGeneratedPlan,
  PersonalizedCourseGeneratedPlanItem,
  PersonalizedCourseGeneratedPlanLesson,
} from "@/lib/personalized-courses/types"
import { LEARNING_PATH_INTERACTIVE_ITEM_TYPE_LIST } from "@/lib/learning-path-interactive-items"
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
  items: z.array(planItemSchema).min(1).max(30),
})

const planSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(900),
  lessons: z.array(planLessonSchema).min(1).max(8),
})

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY")
  return new OpenAI({ apiKey })
}

function stringifyCandidates(candidates: PersonalizedCourseCatalogCandidate[]): string {
  if (!candidates.length) return "Nu s-a găsit conținut Planck relevant. Generează iteme de legătură (doar custom_text cu explicații scurte)."
  return candidates
    .slice(0, 48)
    .map((candidate, index) => {
      return [
        `#${index + 1}`,
        `source_key: ${candidate.key}`,
        `tip: ${candidate.item_type}`,
        `titlu: ${candidate.title}`,
        `continut: ${candidate.summary}`,
      ].join("\n")
    })
    .join("\n\n")
}

function defaultCustomTextBody(title: string, userPrompt: string): string {
  return `## ${title}\n\nÎn această secțiune lucrăm cu conținut Planck existent pentru obiectivul: **${userPrompt}**.`
}

function makeGeneratedContentJson(
  item: PersonalizedCourseGeneratedPlanItem,
  userPrompt: string,
): Record<string, unknown> {
  const current = item.content_json && typeof item.content_json === "object" && !Array.isArray(item.content_json)
    ? item.content_json
    : null

  if (current && Object.keys(current).length > 0) return current

  // Only generate lightweight connector text — never fake real problems/quizzes/tests
  return { body: defaultCustomTextBody(item.title, userPrompt) }
}

function coerceItem(
  item: PersonalizedCourseGeneratedPlanItem,
  validSourceKeys: Set<string>,
  candidatesByKey: Map<string, PersonalizedCourseCatalogCandidate>,
  userPrompt: string,
): PersonalizedCourseGeneratedPlanItem {
  const sourceKey = item.source_key?.trim() || null
  const hasValidSource = !!sourceKey && validSourceKeys.has(sourceKey)
  const candidate = hasValidSource && sourceKey ? candidatesByKey.get(sourceKey) : undefined
  const itemType = hasValidSource ? candidate?.item_type ?? item.item_type : "custom_text"

  return {
    title: item.title.trim(),
    item_type: itemType,
    source_key: hasValidSource ? sourceKey : null,
    content_json: hasValidSource ? item.content_json ?? null : makeGeneratedContentJson({ ...item, item_type: itemType }, userPrompt),
  }
}

/**
 * Post-process the AI plan: inject unused real Planck candidates that the AI missed.
 * This ensures we maximize real content usage and don't let the AI skip relevant items.
 */
function injectMissedCandidates(
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

  const unused = candidates.filter((c) => !usedKeys.has(c.key))
  if (!unused.length) return plan

  // Group unused candidates by type for balanced injection
  const byType = new Map<string, PersonalizedCourseCatalogCandidate[]>()
  for (const c of unused) {
    const bucket = byType.get(c.item_type) ?? []
    bucket.push(c)
    byType.set(c.item_type, bucket)
  }

  // Inject up to 10 unused real items per lesson (replace generated custom_text items)
  const lessons = plan.lessons.map((lesson) => {
    let injected = 0
    const maxInject = Math.min(10, Math.ceil(unused.length / plan.lessons.length))
    const items = lesson.items.map((item) => {
      if (injected >= maxInject) return item
      // Only replace generated custom_text items (connectors), not real content
      if (item.source_key) return item
      if (item.item_type !== "custom_text") return item

      // Find a suitable unused candidate
      for (const [type, candidatesOfType] of byType) {
        const candidate = candidatesOfType[0]
        if (candidate) {
          candidatesOfType.shift()
          if (candidatesOfType.length === 0) byType.delete(type)
          injected++
          return {
            title: candidate.title,
            item_type: candidate.item_type,
            source_key: candidate.key,
            content_json: null,
          }
        }
      }
      return item
    })

    return { ...lesson, items }
  })

  return { ...plan, lessons }
}

function normalizePlan(
  plan: PersonalizedCourseGeneratedPlan,
  candidates: PersonalizedCourseCatalogCandidate[],
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const validSourceKeys = new Set(candidates.map((candidate) => candidate.key))
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]))

  const lessons: PersonalizedCourseGeneratedPlanLesson[] = plan.lessons.slice(0, 8).map((lesson) => {
    const items = lesson.items.slice(0, 30).map((item) => coerceItem(item, validSourceKeys, candidatesByKey, userPrompt))
    if (items.length >= 2) {
      return { ...lesson, title: lesson.title.trim(), description: lesson.description?.trim() || null, items }
    }
    return {
      ...lesson,
      title: lesson.title.trim(),
      description: lesson.description?.trim() || null,
      items: [
        ...items,
        coerceItem({ title: `Explicație: ${lesson.title}`, item_type: "custom_text" }, validSourceKeys, candidatesByKey, userPrompt),
      ],
    }
  })

  if (lessons.length >= 2) {
    const finalPlan = { title: plan.title.trim(), description: plan.description.trim(), lessons }
    return injectMissedCandidates(finalPlan, candidates, userPrompt)
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
      return injectMissedCandidates(finalPlan, candidates, userPrompt)
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

    // Pad with custom_text connectors to reach 15+ per lesson
    const lessons: PersonalizedCourseGeneratedPlanLesson[] = []
    const itemsPerLesson = Math.max(15, Math.ceil(allItems.length / 3))
    for (let i = 0; i < 3; i++) {
      const slice: PersonalizedCourseGeneratedPlanItem[] = allItems.slice(i * Math.ceil(allItems.length / 3), (i + 1) * Math.ceil(allItems.length / 3))
      // Pad with connectors
      while (slice.length < itemsPerLesson) {
        slice.push(coerceItem(
          { title: `Recapitulare ${i + 1}`, item_type: "custom_text" },
          validSourceKeys, candidatesByKey, userPrompt,
        ))
      }
      lessons.push({
        title: i === 0 ? "Baze și introducere" : i === 1 ? "Aprofundare" : "Aplicare și probleme",
        description: i === 0 ? "Noțiuni fundamentale și intuiție." : i === 1 ? "Aprofundare și exemple." : "Probleme și aplicare.",
        items: slice.slice(0, 30),
      })
    }

    return {
      title: plan.title.trim() || `Curs personalizat: ${userPrompt.slice(0, 48)}`,
      description: plan.description.trim() || `Un traseu personalizat pentru: ${userPrompt}`,
      lessons,
    }
  }

  // Last resort: minimal generated content
  return {
    title: plan.title.trim() || `Curs personalizat: ${userPrompt.slice(0, 48)}`,
    description: plan.description.trim() || `Un traseu personalizat pentru: ${userPrompt}`,
    lessons: [
      {
        title: "Start rapid",
        description: "Clarificăm obiectivul și construim baza.",
        items: [
          coerceItem({ title: "Imaginea de ansamblu", item_type: "custom_text" }, validSourceKeys, candidatesByKey, userPrompt),
        ],
      },
      {
        title: "Aplicare ghidată",
        description: "Fixăm ideile prin exerciții.",
        items: [
          coerceItem({ title: "Pași de rezolvare", item_type: "custom_text" }, validSourceKeys, candidatesByKey, userPrompt),
        ],
      },
    ],
  }
}

const SYSTEM_PROMPT = `Ești plannerul de cursuri personalizate PLANCK Academy.
Răspunzi DOAR cu JSON valid, fără Markdown.

REGULA PRINCIPALĂ: Folosește cât mai mult conținut real din Planck (via source_key). Nu inventa probleme, grile, teste sau lecții care deja există în lista de mai jos.

Prioritizează itemele cu source_key valid. Generează iteme noi DOAR ca text de legătură (custom_text) între itemele reale — nu inventa exerciții noi dacă există deja în listă.

Dacă lista de conținut are probleme/grile/lecții relevante, folosește-le pe acelea cu source_key. Nu le recrea cu content_json.

Pentru itemele cu source_key, pune content_json null.
Pentru itemele fără source_key (doar custom_text de legătură), folosește: {"body":"text markdown scurt"}

Nu inventa source_key-uri. Folosește doar cheile din lista de mai jos sau null.

Creează un traseu complet, cu 3-5 lecții, FIECARE cu 15-25 itemi. Folosește TOATE itemele relevante din listă. Dacă sunt mai puține iteme reale, repetă/combina itemii reali disponibili și adaugă custom_text scurt ca legături pentru a ajunge la minim 15 itemi per lecție.

Distribuie itemii pe lecții în ordine logică: prima lecție = introducere/baze, ultimele = aplicare/probleme.

Minim 60% din itemi trebuie să aibă source_key valid când există conținut relevant.`

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
  const completion = await openai.chat.completions.create({
    model: process.env.PERSONALIZED_COURSE_OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify(
          {
            user_learning_goal: userPrompt,
            available_planck_content: stringifyCandidates(candidates),
            instruction: "Folosește maxim itemele cu source_key din lista above. Generează doar custom_text scurt ca legături între ele.",
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
                      item_type: "text | grila | problem | ...",
                      source_key: "exact un source_key din listă sau null",
                      content_json: "null dacă ai source_key, {\"body\":\"text\"} dacă nu",
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
    temperature: 0.3,
    max_tokens: 8000,
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
