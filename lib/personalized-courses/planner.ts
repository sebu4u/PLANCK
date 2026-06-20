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
  items: z.array(planItemSchema).min(2).max(10),
})

const planSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(900),
  lessons: z.array(planLessonSchema).min(2).max(8),
})

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY")
  return new OpenAI({ apiKey })
}

function stringifyCandidates(candidates: PersonalizedCourseCatalogCandidate[]): string {
  if (!candidates.length) return "Nu s-a găsit conținut Planck relevant. Generează toate itemele lipsă."
  return candidates
    .slice(0, 32)
    .map((candidate, index) => {
      return [
        `#${index + 1}`,
        `source_key: ${candidate.key}`,
        `source_type: ${candidate.source_type}`,
        `source_table: ${candidate.source_table}`,
        `item_type: ${candidate.item_type}`,
        `title: ${candidate.title}`,
        `summary: ${candidate.summary}`,
      ].join("\n")
    })
    .join("\n\n")
}

function defaultCustomTextBody(title: string, userPrompt: string): string {
  return `## ${title}\n\nÎn această secțiune construim pas cu pas obiectivul tău: **${userPrompt}**.\n\nVom lega intuiția de exerciții scurte, astfel încât să poți verifica imediat ce ai înțeles.`
}

function makeGeneratedContentJson(
  item: PersonalizedCourseGeneratedPlanItem,
  userPrompt: string,
): Record<string, unknown> {
  const current = item.content_json && typeof item.content_json === "object" && !Array.isArray(item.content_json)
    ? item.content_json
    : null

  if (current && Object.keys(current).length > 0) return current

  if (item.item_type === "poll") {
    return {
      question: `Care este următorul pas cel mai util pentru obiectivul „${userPrompt}”?`,
      correctAnswerId: "aplica",
      imageSrc: "",
      imageAlt: "",
      options: [
        { id: "aplica", label: "Aplic ce am învățat într-un exercițiu", feedback: "Exact — aplicarea imediată fixează ideea." },
        { id: "memorez", label: "Memorez definițiile fără exemple", feedback: "Definițiile ajută, dar fără exemple rămân fragile." },
        { id: "sar", label: "Sar direct la testul final", feedback: "Mai întâi ai nevoie de o verificare mică." },
        { id: "aman", label: "Revin mai târziu", feedback: "Mai bine faci un pas mic acum." },
      ],
    }
  }

  if (item.item_type === "grila") {
    return {
      question: `Ce descrie cel mai bine obiectivul acestui pas din curs?`,
      correctAnswerId: "A",
      options: [
        { id: "A", label: "Înțeleg ideea și o verific printr-un exemplu", feedback: "Corect — acesta este ritmul cursului." },
        { id: "B", label: "Să sar peste partea practică", feedback: "Practica este necesară pentru fixare." },
        { id: "C", label: "Să memorez fără context", feedback: "Contextul face ideea utilizabilă." },
        { id: "D", label: "Să aleg răspunsuri la întâmplare", feedback: "Încearcă să legi fiecare răspuns de o idee." },
      ],
    }
  }

  if (item.item_type === "test") {
    return {
      icon: "clipboard-list",
      description: `Mini-test pentru obiectivul: ${userPrompt}`,
      difficulty: 2,
      timeLimitSeconds: 600,
      problems: [
        {
          id: "p1",
          statement: `Care este cel mai bun semn că ai înțeles lecția „${item.title}”?`,
          imageUrl: null,
          options: [
            { id: "A", label: "Pot explica ideea cu propriile cuvinte" },
            { id: "B", label: "Am citit titlul" },
            { id: "C", label: "Am sărit peste exemple" },
            { id: "D", label: "Am memorat un cuvânt izolat" },
          ],
          correctOptionId: "A",
        },
      ],
    }
  }

  if (item.item_type === "reveal_steps") {
    return {
      instructions: "Parcurge ideea pe pași și oprește-te la verificarea scurtă.",
      steps: [
        { kind: "markdown", content: defaultCustomTextBody(item.title, userPrompt) },
        {
          kind: "quiz",
          content: "De ce alternăm explicațiile cu exerciții?",
          options: ["Pentru feedback rapid", "Pentru decor", "Ca să fie mai greu", "Ca să evităm exemplele"],
          correctIndex: 0,
        },
      ],
    }
  }

  return { body: defaultCustomTextBody(item.title, userPrompt) }
}

function coerceItem(
  item: PersonalizedCourseGeneratedPlanItem,
  validSourceKeys: Set<string>,
  userPrompt: string,
): PersonalizedCourseGeneratedPlanItem {
  const sourceKey = item.source_key?.trim() || null
  const hasValidSource = !!sourceKey && validSourceKeys.has(sourceKey)
  const itemType = hasValidSource ? item.item_type : item.item_type === "text" ? "custom_text" : item.item_type

  return {
    title: item.title.trim(),
    item_type: itemType,
    source_key: hasValidSource ? sourceKey : null,
    content_json: hasValidSource ? item.content_json ?? null : makeGeneratedContentJson({ ...item, item_type: itemType }, userPrompt),
  }
}

function normalizePlan(
  plan: PersonalizedCourseGeneratedPlan,
  candidates: PersonalizedCourseCatalogCandidate[],
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const validSourceKeys = new Set(candidates.map((candidate) => candidate.key))
  const lessons: PersonalizedCourseGeneratedPlanLesson[] = plan.lessons.slice(0, 8).map((lesson) => {
    const items = lesson.items.slice(0, 10).map((item) => coerceItem(item, validSourceKeys, userPrompt))
    if (items.length >= 2) {
      return { ...lesson, title: lesson.title.trim(), description: lesson.description?.trim() || null, items }
    }
    return {
      ...lesson,
      title: lesson.title.trim(),
      description: lesson.description?.trim() || null,
      items: [
        ...items,
        coerceItem({ title: `Explicație: ${lesson.title}`, item_type: "custom_text" }, validSourceKeys, userPrompt),
        coerceItem({ title: `Verificare: ${lesson.title}`, item_type: "grila" }, validSourceKeys, userPrompt),
      ],
    }
  })

  if (lessons.length >= 2) {
    return { title: plan.title.trim(), description: plan.description.trim(), lessons }
  }

  return {
    title: plan.title.trim() || `Curs personalizat: ${userPrompt.slice(0, 48)}`,
    description: plan.description.trim() || `Un traseu personalizat generat pentru: ${userPrompt}`,
    lessons: [
      {
        title: "Start rapid",
        description: "Clarificăm obiectivul și construim baza.",
        items: [
          coerceItem({ title: "Imaginea de ansamblu", item_type: "custom_text" }, validSourceKeys, userPrompt),
          coerceItem({ title: "Verificare rapidă", item_type: "grila" }, validSourceKeys, userPrompt),
        ],
      },
      {
        title: "Aplicare ghidată",
        description: "Fixăm ideile prin exerciții și un mini-test.",
        items: [
          coerceItem({ title: "Pași de rezolvare", item_type: "reveal_steps" }, validSourceKeys, userPrompt),
          coerceItem({ title: "Mini-test final", item_type: "test" }, validSourceKeys, userPrompt),
        ],
      },
    ],
  }
}

const SYSTEM_PROMPT = `Ești plannerul de cursuri personalizate PLANCK Academy.
Răspunzi DOAR cu JSON valid, fără Markdown.
Construiești cursuri în română, clare, aplicate și potrivite stilului Planck: explicații scurte, exerciții, verificări și lecții progresive.
Reutilizează conținutul existent doar prin source_key când este relevant. Generează iteme noi doar unde acoperirea este insuficientă.
Nu inventa source_key-uri. Dacă nu folosești un source_key valid, pune source_key null și content_json complet.
Pentru content_json generat folosește structuri compatibile:
- custom_text: {"body":"markdown educațional"}
- grila: {"question":"...","correctAnswerId":"A","options":[{"id":"A","label":"...","feedback":"..."}, ... 4 opțiuni]}
- poll: {"question":"...","correctAnswerId":"...","imageSrc":"","imageAlt":"","options":[{"id":"...","label":"...","feedback":"..."}, ... 4 opțiuni]}
- reveal_steps: {"instructions":"...","steps":[{"kind":"markdown","content":"..."},{"kind":"quiz","content":"...","options":["..."],"correctIndex":0}]}
- test: {"icon":"clipboard-list","description":"...","difficulty":1-5,"timeLimitSeconds":600,"problems":[{"id":"p1","statement":"...","imageUrl":null,"options":[{"id":"A","label":"..."}],"correctOptionId":"A"}]}
Preferă 3-5 lecții, fiecare cu 3-6 iteme. Include minim două tipuri de iteme.`

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
                      item_type: PERSONALIZED_ITEM_TYPES,
                      source_key: "one valid source_key or null",
                      content_json: "object required when source_key is null",
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
    temperature: 0.35,
    max_tokens: 3600,
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) throw new Error("AI did not return course JSON")

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch (error) {
    throw new Error("AI returned invalid JSON")
  }

  const validated = planSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error(`AI course JSON failed validation: ${validated.error.message}`)
  }

  return normalizePlan(validated.data, candidates, userPrompt)
}
