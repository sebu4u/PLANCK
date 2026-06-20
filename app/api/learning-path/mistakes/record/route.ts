import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthenticatedSupabase } from "@/lib/learning-path-flashcard-auth"

const mistakeSurfaceSchema = z.enum([
  "catalog_problem",
  "learning_path_problem",
  "learning_path_grila",
  "learning_path_test",
  "learning_path_interactive",
])

const optionalUuidSchema = z
  .string()
  .trim()
  .uuid()
  .nullable()
  .optional()

const shortOptionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()

const recordMistakeSchema = z.object({
  surface: mistakeSurfaceSchema,
  itemId: optionalUuidSchema,
  lessonId: optionalUuidSchema,
  chapterId: optionalUuidSchema,
  problemId: shortOptionalText(160),
  quizQuestionId: shortOptionalText(160),
  itemType: shortOptionalText(80),
  subject: shortOptionalText(80),
  conceptTags: z.array(z.string().trim().min(1).max(80)).max(12).optional().default([]),
  mistakeKind: z.string().trim().min(1).max(80).optional().default("wrong_answer"),
  submittedAnswer: z.unknown().optional(),
  correctAnswer: z.unknown().optional(),
  promptContext: z.record(z.unknown()).nullable().optional(),
  attemptNumber: z.coerce.number().int().min(1).max(999).optional().default(1),
  severity: z.coerce.number().int().min(1).max(5).optional().default(1),
})

function limitJson(value: unknown, maxChars: number): unknown {
  if (value == null) return value
  try {
    const encoded = JSON.stringify(value)
    if (!encoded || encoded.length <= maxChars) return value
    return {
      truncated: true,
      preview: encoded.slice(0, maxChars),
    }
  } catch {
    return { unserializable: true }
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if ("error" in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = recordMistakeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalid", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const input = parsed.data
  if (!input.itemId && !input.lessonId && !input.chapterId && !input.problemId && !input.quizQuestionId) {
    return NextResponse.json({ error: "Cel puțin un identificator este obligatoriu." }, { status: 400 })
  }

  const payload = {
    ...input,
    conceptTags: Array.from(new Set(input.conceptTags.map((tag) => tag.trim()).filter(Boolean))),
    submittedAnswer: limitJson(input.submittedAnswer, 2_000),
    correctAnswer: limitJson(input.correctAnswer, 2_000),
    promptContext: limitJson(input.promptContext, 4_000),
  }

  const { data, error } = await auth.supabase.rpc("record_learning_mistake", {
    p_event: payload,
  })

  if (error) {
    console.error("record_learning_mistake:", error)
    return NextResponse.json({ error: "Nu s-a putut salva greșeala." }, { status: 500 })
  }

  return NextResponse.json({ eventId: data })
}
