import "server-only"

import OpenAI from "openai"
import type { SupabaseClient } from "@supabase/supabase-js"
import { searchPlanckContentCatalog } from "@/lib/insight/agent/content-catalog"
import { resolveInsightAgentIntent } from "@/lib/insight/agent/intent-router"
import type { InsightAgentIntent } from "@/lib/insight/agent/types"
import type { PlanckResourceReference } from "@/lib/insight/agent/types"
import type { InvataAskMessage, InvataAskResources, InvataAskStreamEvent } from "@/lib/invata/ask-types"

function getAdvisorProviderConfig() {
  const overrideKey = process.env.PERSONALIZED_COURSE_API_KEY?.trim()
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim()
  const openaiKey = process.env.OPENAI_API_KEY?.trim()

  const apiKey = overrideKey || deepseekKey || openaiKey
  if (!apiKey) {
    throw new Error(
      "Missing API key for invata advisor. Set DEEPSEEK_API_KEY (or OPENAI_API_KEY, or PERSONALIZED_COURSE_API_KEY).",
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

function getAdvisorClient() {
  const { apiKey, baseURL } = getAdvisorProviderConfig()
  const opts: Record<string, unknown> = { apiKey, timeout: 45_000 }
  if (baseURL) opts.baseURL = baseURL
  return new OpenAI(opts)
}

function resourceChapterKey(resource: PlanckResourceReference): string | null {
  const chapterId = resource.metadata?.chapter_id
  return typeof chapterId === "string" && chapterId ? chapterId : null
}

export function pickPrimaryAndSecondaryResources(
  resources: PlanckResourceReference[],
): InvataAskResources {
  if (!resources.length) {
    return { primary: null, secondary: null }
  }

  const primary = resources[0] ?? null
  if (!primary) {
    return { primary: null, secondary: null }
  }

  const primaryChapter = resourceChapterKey(primary)
  const secondary =
    resources.slice(1).find((candidate) => {
      if (candidate.type !== primary.type) return true
      const chapter = resourceChapterKey(candidate)
      return Boolean(chapter && chapter !== primaryChapter)
    }) ??
    resources[1] ??
    null

  return { primary, secondary }
}

function formatResourceLine(resource: PlanckResourceReference, index: number): string {
  return `${index + 1}. ${resource.type}: ${resource.title} | ${resource.subtitle ?? resource.topic ?? ""} | ${resource.url}`
}

function buildCatalogAppendix(resources: PlanckResourceReference[]): string {
  if (!resources.length) {
    return "Nu am găsit resurse Planck validate pentru acest mesaj. Explică pe scurt subiectul și spune că poate crea un traseu personalizat din interfață."
  }

  return [
    "Folosește DOAR aceste resurse când menționezi trasee, lecții, cursuri sau probleme existente:",
    ...resources.slice(0, 4).map(formatResourceLine),
    "Nu inventa resurse. Nu propune generarea unui traseu personalizat — interfața are un buton separat pentru asta.",
  ].join("\n")
}

function buildConversationMessages(
  prompt: string,
  history: InvataAskMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const recent = history.slice(-8)
  const mapped: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = recent.map((entry) => ({
    role: entry.role,
    content: entry.content,
  }))
  mapped.push({ role: "user", content: prompt })
  return mapped
}

function fallbackAdvisorMessage(
  prompt: string,
  resources: InvataAskResources,
  topic: string | null,
): string {
  const subject = topic ?? prompt.slice(0, 80)
  if (!resources.primary) {
    return `Se pare că vrei să înveți despre ${subject}. Nu am găsit încă un traseu exact potrivit în catalog, dar poți crea un traseu personalizat dacă vrei o parcurgere ghidată.`
  }

  const intro = `Se pare că vrei să înveți despre ${subject}.`
  const primary = `Îți recomand să începi cu „${resources.primary.title}”.`
  const secondary = resources.secondary
    ? ` Poți continua apoi cu „${resources.secondary.title}”.`
    : ""
  return `${intro} ${primary}${secondary}`
}

async function enrichResourceIcons(
  supabase: SupabaseClient,
  resources: PlanckResourceReference[],
): Promise<PlanckResourceReference[]> {
  const chapterIds = Array.from(
    new Set(
      resources
        .map((resource) => resource.metadata?.chapter_id)
        .filter((id): id is string => typeof id === "string" && Boolean(id)),
    ),
  )

  if (!chapterIds.length) return resources

  const { data } = await supabase
    .from("learning_path_chapters")
    .select("id, icon_url, title")
    .in("id", chapterIds)

  const iconByChapterId = new Map(
    (data ?? []).map((row) => [String(row.id), row.icon_url as string | null]),
  )

  return resources.map((resource) => {
    const chapterId = resource.metadata?.chapter_id
    if (typeof chapterId !== "string" || !chapterId) return resource
    const iconUrl = iconByChapterId.get(chapterId)
    if (!iconUrl) return resource
    return {
      ...resource,
      metadata: {
        ...resource.metadata,
        icon_url: iconUrl,
      },
    }
  })
}

async function prepareInvataAskContext(
  supabase: SupabaseClient,
  prompt: string,
  history: InvataAskMessage[] = [],
): Promise<{
  intent: InsightAgentIntent
  primary: PlanckResourceReference | null
  secondary: PlanckResourceReference | null
  fallbackMessage: string
  llmMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
}> {
  const intent = resolveInsightAgentIntent(prompt)
  const catalogResults = await searchPlanckContentCatalog(supabase, {
    intent,
    userInput: prompt,
    requestText: history.length ? history.map((entry) => entry.content).join("\n") : undefined,
    limit: 8,
  })

  const enrichedCatalog = await enrichResourceIcons(supabase, catalogResults)
  const { primary, secondary } = pickPrimaryAndSecondaryResources(enrichedCatalog)
  const displayResources = [primary, secondary].filter(
    (resource): resource is PlanckResourceReference => Boolean(resource),
  )

  const systemPrompt = `Ești advisorul Planck de pe pagina /invata. Răspunde în română, prietenos și concis (2-3 propoziții).
Descrie pe scurt ce vrea elevul să învețe și orientează-l spre resursele existente din catalog când există.
NU propune generarea unui traseu personalizat — există un buton separat în interfață.
NU inventa resurse, linkuri sau cursuri.
Răspunde direct în text simplu, fără JSON, fără markdown, fără liste numerotate.

${buildCatalogAppendix(displayResources)}`

  return {
    intent,
    primary,
    secondary,
    fallbackMessage: fallbackAdvisorMessage(prompt, { primary, secondary }, intent.topic),
    llmMessages: [
      { role: "system", content: systemPrompt },
      ...buildConversationMessages(prompt, history),
    ],
  }
}

export async function* streamInvataAskAdvisor(
  supabase: SupabaseClient,
  prompt: string,
  history: InvataAskMessage[] = [],
): AsyncGenerator<InvataAskStreamEvent> {
  const context = await prepareInvataAskContext(supabase, prompt, history)
  const { model } = getAdvisorProviderConfig()

  let message = context.fallbackMessage

  try {
    const client = getAdvisorClient()
    const stream = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 600,
      stream: true,
      messages: context.llmMessages,
    })

    let streamed = ""
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (!delta) continue
      streamed += delta
      yield { type: "delta", content: delta }
    }

    const trimmed = streamed.trim()
    if (trimmed) {
      message = trimmed.slice(0, 1200)
    }
  } catch (error) {
    console.error("invata ask advisor LLM stream:", error)
    if (!message) {
      yield { type: "error", error: "Nu am putut răspunde acum. Încearcă din nou." }
      return
    }

    for (const word of message.split(/(\s+)/)) {
      if (!word) continue
      yield { type: "delta", content: word }
      await new Promise((resolve) => setTimeout(resolve, 18))
    }
  }

  yield {
    type: "done",
    message,
    primary: context.primary,
    secondary: context.secondary,
    intent: {
      subject: context.intent.subject,
      topic: context.intent.topic,
    },
  }
}

/** @deprecated Use streamInvataAskAdvisor — kept for tests/smoke if needed */
export async function runInvataAskAdvisor(
  supabase: SupabaseClient,
  prompt: string,
  history: InvataAskMessage[] = [],
) {
  let result: Extract<InvataAskStreamEvent, { type: "done" }> | null = null

  for await (const event of streamInvataAskAdvisor(supabase, prompt, history)) {
    if (event.type === "done") {
      result = event
    }
    if (event.type === "error") {
      throw new Error(event.error)
    }
  }

  if (!result) {
    throw new Error("Advisor stream ended without a done event.")
  }

  return {
    message: result.message,
    primary: result.primary,
    secondary: result.secondary,
    intent: result.intent,
  }
}
