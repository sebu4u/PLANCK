export const runtime = "nodejs"
export const maxDuration = 60

import { createClient } from "@/lib/supabase/server"
import { streamInvataAskAdvisor } from "@/lib/invata/ask-advisor"
import type { InvataAskMessage } from "@/lib/invata/ask-types"
import { normalizePrompt, validatePrompt } from "@/lib/personalized-courses/validate-prompt"
import { loadInsightAgentProfile } from "@/lib/insight/agent/profile"
import type { InsightAgentProfileMemory } from "@/lib/insight/agent/types"
import type { PlanckResourceReference } from "@/lib/insight/agent/types"

function parseMessages(value: unknown): InvataAskMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const role = (entry as { role?: unknown }).role
      const content = (entry as { content?: unknown }).content
      if (role !== "user" && role !== "assistant") return null
      if (typeof content !== "string" || !content.trim()) return null
      return { role, content: content.trim() }
    })
    .filter((entry): entry is InvataAskMessage => Boolean(entry))
    .slice(-12)
}

function parseExcludeKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry !== "string") return null
      const trimmed = entry.trim()
      if (!trimmed || trimmed.length > 64) return null
      return trimmed
    })
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 32)
}

function profileExcludeKeys(profile: InsightAgentProfileMemory | null | undefined): string[] {
  if (!profile?.recent_resource_ids?.length) return []
  return profile.recent_resource_ids
    .filter((entry): entry is string => typeof entry === "string")
    .slice(0, 30)
}

function dedupeConcat(...lists: Array<Iterable<string>>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const list of lists) {
    for (const value of list) {
      if (!value || seen.has(value)) continue
      seen.add(value)
      out.push(value)
    }
  }
  return out
}

function resourceKey(resource: Pick<PlanckResourceReference, "type" | "id">): string {
  return `${resource.type}:${resource.id}`
}

async function persistRecentResourceIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  previous: InsightAgentProfileMemory | null | undefined,
  shown: Array<Pick<PlanckResourceReference, "type" | "id">>,
) {
  if (!shown.length) return
  const fresh = shown.map(resourceKey)
  const next = dedupeConcat(fresh, previous?.recent_resource_ids ?? []).slice(0, 30)
  await supabase.from("insight_agent_memory").upsert(
    {
      user_id: userId,
      memory_key: "learner_profile",
      memory_json: {
        ...(previous ?? {}),
        recent_resource_ids: next,
        updated_from: "invata_ask",
      },
      confidence: 0.6,
      source: "insight_agent",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,memory_key" },
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ type: "error", error: "Necesită autentificare." }), {
      status: 401,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ type: "error", error: "JSON invalid." }), {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    })
  }

  const prompt = normalizePrompt((body as { prompt?: unknown })?.prompt)
  if (!prompt) {
    return new Response(JSON.stringify({ type: "error", error: "Promptul este obligatoriu." }), {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    })
  }

  const promptError = validatePrompt(prompt)
  if (promptError) {
    return new Response(JSON.stringify({ type: "error", error: promptError }), {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    })
  }

  const messages = parseMessages((body as { messages?: unknown })?.messages)
  const clientExcludeKeys = parseExcludeKeys((body as { excludeKeys?: unknown })?.excludeKeys)
  const profile = await loadInsightAgentProfile(supabase, user.id)
  const profileExclude = profileExcludeKeys(profile)
  const excludeKeys = dedupeConcat(profileExclude, clientExcludeKeys)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const shown: Array<Pick<PlanckResourceReference, "type" | "id">> = []
      try {
        for await (const event of streamInvataAskAdvisor(supabase, prompt, messages, excludeKeys)) {
          if (event.type === "done") {
            if (event.primary) shown.push({ type: event.primary.type, id: event.primary.id })
            if (event.secondary) shown.push({ type: event.secondary.type, id: event.secondary.id })
          }
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
          if (event.type === "error") break
        }
        controller.close()
        await persistRecentResourceIds(supabase, user.id, profile, shown).catch((error) => {
          console.error("invata ask route persist recent ids:", error)
        })
      } catch (error) {
        console.error("invata ask route stream:", error)
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "error", error: "Nu am putut răspunde acum. Încearcă din nou." })}\n`,
          ),
        )
        controller.close()
        await persistRecentResourceIds(supabase, user.id, profile, shown).catch((persistError) => {
          console.error("invata ask route persist recent ids:", persistError)
        })
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
