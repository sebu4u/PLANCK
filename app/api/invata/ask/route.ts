export const runtime = "nodejs"
export const maxDuration = 60

import { createClient } from "@/lib/supabase/server"
import { streamInvataAskAdvisor } from "@/lib/invata/ask-advisor"
import type { InvataAskMessage } from "@/lib/invata/ask-types"
import { normalizePrompt, validatePrompt } from "@/lib/personalized-courses/validate-prompt"

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
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamInvataAskAdvisor(supabase, prompt, messages)) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
          if (event.type === "error") break
        }
        controller.close()
      } catch (error) {
        console.error("invata ask route stream:", error)
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "error", error: "Nu am putut răspunde acum. Încearcă din nou." })}\n`,
          ),
        )
        controller.close()
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
