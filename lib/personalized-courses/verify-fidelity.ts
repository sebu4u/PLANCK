import "server-only"

import OpenAI from "openai"
import { z } from "zod"
import type {
  PersonalizedCourseGeneratedPlan,
  PersonalizedCourseGeneratedPlanItem,
  PersonalizedCourseGeneratedPlanLesson,
} from "@/lib/personalized-courses/types"
import {
  isInteractiveLessonItemType,
  validateInteractiveItemContent,
} from "@/lib/learning-path-interactive-items"
import { validateTestContent } from "@/lib/learning-path-test"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

const FIDELITY_INTERACTIVE_TYPES = new Set<LearningPathLessonType>([
  "poll",
  "match",
  "card_sort",
  "fill_slot",
  "reveal_steps",
  "table_fill",
  "swipe_classify",
  "memory_flip",
  "code_trace",
])

export interface FidelityReport {
  checked: number
  rewritten: number
  skippedSource: number
  failed: number
}

function getProviderConfig() {
  const overrideKey = process.env.PERSONALIZED_COURSE_API_KEY?.trim()
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim()
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const apiKey = overrideKey || deepseekKey || openaiKey
  if (!apiKey) {
    throw new Error("Missing API key for fidelity verifier.")
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

function validatePollContent(content: Record<string, unknown> | null): string | null {
  if (!content) return "poll: content_json obligatoriu."
  if (typeof content.question !== "string" || !content.question.trim()) {
    return "poll: question obligatoriu."
  }
  if (typeof content.correctAnswerId !== "string" || !content.correctAnswerId.trim()) {
    return "poll: correctAnswerId obligatoriu."
  }
  const rawOptions = content.options
  if (!Array.isArray(rawOptions) || rawOptions.length !== 4) {
    return "poll: exact 4 opțiuni."
  }
  const ids = new Set<string>()
  for (const opt of rawOptions) {
    if (!opt || typeof opt !== "object") return "poll: opțiune invalidă."
    const o = opt as Record<string, unknown>
    if (typeof o.id !== "string" || !o.id.trim()) return "poll: id lipsă."
    if (typeof o.label !== "string" || !o.label.trim()) return "poll: label lipsă."
    if (typeof o.feedback !== "string" || !o.feedback.trim()) return "poll: feedback lipsă."
    if (ids.has(o.id)) return "poll: id duplicat."
    ids.add(o.id)
  }
  if (!ids.has(content.correctAnswerId as string)) return "poll: correctAnswerId invalid."
  return null
}

function isValidGeneratedContent(
  itemType: LearningPathLessonType,
  content: Record<string, unknown>,
): boolean {
  if (itemType === "poll") return !validatePollContent(content)
  if (itemType === "test") return !validateTestContent(content, { minProblems: 2 })
  if (isInteractiveLessonItemType(itemType)) {
    return !validateInteractiveItemContent(itemType, content)
  }
  return false
}

function explanationText(item: PersonalizedCourseGeneratedPlanItem): string {
  const cj = item.content_json
  if (cj && typeof cj === "object" && typeof (cj as Record<string, unknown>).body === "string") {
    return String((cj as Record<string, unknown>).body).slice(0, 1200)
  }
  return item.title
}

function needsFidelityCheck(item: PersonalizedCourseGeneratedPlanItem): boolean {
  if (item.source_key) return false
  if (!FIDELITY_INTERACTIVE_TYPES.has(item.item_type)) return false
  return true
}

function hasForceRewriteFlag(item: PersonalizedCourseGeneratedPlanItem): boolean {
  return Boolean(
    item.content_json &&
      typeof item.content_json === "object" &&
      (item.content_json as Record<string, unknown>)._needs_fidelity_rewrite,
  )
}

const lessonRewriteSchema = z.object({
  rewrites: z
    .array(
      z.object({
        index: z.number().int().nonnegative(),
        ok: z.boolean(),
        content_json: z.record(z.unknown()).optional(),
      }),
    )
    .max(40),
})

/**
 * One AI call per lesson: rewrite generated interactives that introduce new facts
 * or are rhythm placeholders. Source-keyed items are never rewritten.
 */
async function rewriteLessonInteractives(
  openai: OpenAI,
  model: string,
  lesson: PersonalizedCourseGeneratedPlanLesson,
  userPrompt: string,
): Promise<{
  items: PersonalizedCourseGeneratedPlanItem[]
  checked: number
  rewritten: number
  failed: number
  skippedSource: number
}> {
  const explanations: string[] = []
  const checkTargets: Array<{ index: number; item: PersonalizedCourseGeneratedPlanItem }> = []
  let skippedSource = 0

  for (let i = 0; i < lesson.items.length; i += 1) {
    const item = lesson.items[i]
    if (item.item_type === "custom_text" || item.item_type === "text") {
      explanations.push(explanationText(item))
      continue
    }
    if (item.source_key) {
      skippedSource += 1
      continue
    }
    if (needsFidelityCheck(item) && explanations.length > 0) {
      checkTargets.push({ index: i, item })
    }
  }

  if (!checkTargets.length) {
    return {
      items: lesson.items,
      checked: 0,
      rewritten: 0,
      failed: 0,
      skippedSource,
    }
  }

  // Cap per lesson to keep latency bounded.
  const targets = checkTargets.slice(0, 12)

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `Ești un verifier pedagogic PLANCK. Răspunzi DOAR cu JSON: {"rewrites":[{"index":0,"ok":true},{"index":1,"ok":false,"content_json":{...}}]}.
Regula: itemii interactivi trebuie să testeze DOAR fapte din prior_explanations. NU noțiuni noi.
- ok:true dacă itemul e deja fidel.
- ok:false + content_json rescris dacă introduce info nouă SAU e placeholder (_needs_fidelity_rewrite).
Pentru poll: question, correctAnswerId, exact 4 options cu id/label/feedback. Limbă: română.`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              user_learning_goal: userPrompt,
              lesson_title: lesson.title,
              prior_explanations: explanations.slice(0, 8),
              items_to_check: targets.map(({ index, item }) => ({
                index,
                title: item.title,
                item_type: item.item_type,
                force_rewrite: hasForceRewriteFlag(item),
                content_json: item.content_json,
              })),
            },
            null,
            2,
          ),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 8000,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return {
        items: stripFlags(lesson.items),
        checked: targets.length,
        rewritten: 0,
        failed: targets.length,
        skippedSource,
      }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(extractJsonObject(raw))
    } catch {
      return {
        items: stripFlags(lesson.items),
        checked: targets.length,
        rewritten: 0,
        failed: targets.length,
        skippedSource,
      }
    }

    const result = lessonRewriteSchema.safeParse(parsed)
    if (!result.success) {
      return {
        items: stripFlags(lesson.items),
        checked: targets.length,
        rewritten: 0,
        failed: targets.length,
        skippedSource,
      }
    }

    const byIndex = new Map(result.data.rewrites.map((r) => [r.index, r]))
    const next = lesson.items.slice()
    let rewritten = 0
    let failed = 0

    for (const { index, item } of targets) {
      const rewrite = byIndex.get(index)
      const force = hasForceRewriteFlag(item)

      if (!rewrite || (rewrite.ok && !force)) {
        next[index] = stripItemFlag(item)
        continue
      }

      const newContent = rewrite.content_json
      if (!newContent || typeof newContent !== "object") {
        next[index] = stripItemFlag(item)
        failed += 1
        continue
      }

      const cleaned = { ...newContent }
      delete cleaned._needs_fidelity_rewrite

      if (!isValidGeneratedContent(item.item_type, cleaned)) {
        next[index] = stripItemFlag(item)
        failed += 1
        continue
      }

      next[index] = { ...item, source_key: null, content_json: cleaned }
      rewritten += 1
    }

    return {
      items: next,
      checked: targets.length,
      rewritten,
      failed,
      skippedSource,
    }
  } catch {
    return {
      items: stripFlags(lesson.items),
      checked: targets.length,
      rewritten: 0,
      failed: targets.length,
      skippedSource,
    }
  }
}

function stripItemFlag(item: PersonalizedCourseGeneratedPlanItem): PersonalizedCourseGeneratedPlanItem {
  if (
    item.content_json &&
    typeof item.content_json === "object" &&
    "_needs_fidelity_rewrite" in item.content_json
  ) {
    const { _needs_fidelity_rewrite: _, ...rest } = item.content_json as Record<string, unknown>
    return { ...item, content_json: rest }
  }
  return item
}

function stripFlags(items: PersonalizedCourseGeneratedPlanItem[]): PersonalizedCourseGeneratedPlanItem[] {
  return items.map(stripItemFlag)
}

/**
 * AI pass: ensure generated interactive items only test concepts from prior custom_text
 * explanations in the same lesson. One model call per lesson (bounded).
 */
export async function verifyQuizFidelity(
  plan: PersonalizedCourseGeneratedPlan,
  userPrompt: string,
): Promise<{ plan: PersonalizedCourseGeneratedPlan; report: FidelityReport }> {
  const report: FidelityReport = {
    checked: 0,
    rewritten: 0,
    skippedSource: 0,
    failed: 0,
  }

  let openai: OpenAI
  let model: string
  try {
    const cfg = getProviderConfig()
    const opts: Record<string, unknown> = { apiKey: cfg.apiKey, timeout: 90_000 }
    if (cfg.baseURL) opts.baseURL = cfg.baseURL
    openai = new OpenAI(opts)
    model = cfg.model
  } catch {
    return { plan, report }
  }

  const lessons: PersonalizedCourseGeneratedPlanLesson[] = []

  for (const lesson of plan.lessons) {
    const outcome = await rewriteLessonInteractives(openai, model, lesson, userPrompt)
    report.checked += outcome.checked
    report.rewritten += outcome.rewritten
    report.failed += outcome.failed
    report.skippedSource += outcome.skippedSource
    lessons.push({ ...lesson, items: outcome.items })
  }

  return { plan: { ...plan, lessons }, report }
}
