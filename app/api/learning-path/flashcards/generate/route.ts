export const runtime = "nodejs"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getAuthenticatedSupabase, isUuid } from "@/lib/learning-path-flashcard-auth"
import {
  buildFlashcardUserPrompt,
  FLASHCARD_DAILY_GENERATION_LIMIT,
  FLASHCARD_SYSTEM_PROMPT,
  generatedFlashcardsSchema,
} from "@/lib/learning-path-flashcard-prompt"
import {
  getDailyFlashcardGenerationCount,
  incrementDailyFlashcardGenerationCount,
} from "@/lib/supabase-flashcards"

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY")
  return new OpenAI({ apiKey })
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

  const payload = body as {
    itemId?: unknown
    lessonId?: unknown
    chapterId?: unknown
    chapterSlug?: unknown
    lessonSlug?: unknown
    nextItemHref?: unknown
    itemType?: unknown
    context?: unknown
    itemTitle?: unknown
  }

  if (!isUuid(payload.itemId) || !isUuid(payload.lessonId)) {
    return NextResponse.json({ error: "itemId și lessonId sunt obligatorii" }, { status: 400 })
  }

  if (typeof payload.context !== "string" || !payload.context.trim()) {
    return NextResponse.json({ error: "context invalid" }, { status: 400 })
  }

  if (typeof payload.nextItemHref !== "string" || !payload.nextItemHref.trim()) {
    return NextResponse.json({ error: "nextItemHref invalid" }, { status: 400 })
  }

  const itemType = typeof payload.itemType === "string" ? payload.itemType.trim() : "unknown"
  const itemId = payload.itemId.trim()
  const lessonId = payload.lessonId.trim()
  const chapterId = isUuid(payload.chapterId) ? payload.chapterId.trim() : null
  const itemTitle = typeof payload.itemTitle === "string" ? payload.itemTitle : null

  const { data: eligible } = await auth.supabase.rpc("should_offer_learning_path_flashcards", {
    p_item_id: itemId,
  })
  if (!eligible) {
    return NextResponse.json(
      { error: "Oferta de flashcard-uri nu este disponibilă acum." },
      { status: 429 }
    )
  }

  const dailyCount = await getDailyFlashcardGenerationCount(auth.supabase, auth.user.id)
  if (dailyCount >= FLASHCARD_DAILY_GENERATION_LIMIT) {
    return NextResponse.json(
      { error: "Ai atins limita zilnică de generări flashcard." },
      { status: 429 }
    )
  }

  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildFlashcardUserPrompt(payload.context.trim(), itemType, itemTitle),
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1200,
    temperature: 0.4,
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) {
    return NextResponse.json({ error: "AI nu a returnat conținut" }, { status: 502 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    return NextResponse.json({ error: "Răspuns AI invalid" }, { status: 502 })
  }

  const validated = generatedFlashcardsSchema.safeParse(parsed)
  if (!validated.success) {
    return NextResponse.json({ error: "Format flashcard-uri invalid" }, { status: 502 })
  }

  const { data: session, error: sessionError } = await auth.supabase
    .from("user_flashcard_sessions")
    .insert({
      user_id: auth.user.id,
      item_id: itemId,
      next_item_href: payload.nextItemHref.trim(),
      status: "active",
    })
    .select("id")
    .single()

  if (sessionError || !session) {
    console.error("flashcard session insert:", sessionError)
    return NextResponse.json({ error: "Nu s-a putut crea sesiunea" }, { status: 500 })
  }

  const flashcardRows = validated.data.cards.map((card) => ({
    user_id: auth.user.id,
    item_id: itemId,
    lesson_id: lessonId,
    chapter_id: chapterId,
    front_text: card.front.trim(),
    back_text: card.back.trim(),
    source_item_type: itemType,
  }))

  const { data: insertedCards, error: cardsError } = await auth.supabase
    .from("user_flashcards")
    .insert(flashcardRows)
    .select("id, front_text, back_text")

  if (cardsError || !insertedCards?.length) {
    console.error("flashcard insert:", cardsError)
    return NextResponse.json({ error: "Nu s-au putut salva flashcard-urile" }, { status: 500 })
  }

  const sessionCards = insertedCards.map((card, index) => ({
    session_id: session.id,
    flashcard_id: card.id,
    order_index: index,
  }))

  const { error: linkError } = await auth.supabase
    .from("user_flashcard_session_cards")
    .insert(sessionCards)

  if (linkError) {
    console.error("flashcard session cards:", linkError)
    return NextResponse.json({ error: "Nu s-au putut lega cardurile" }, { status: 500 })
  }

  await auth.supabase.from("user_learning_path_flashcard_offers").upsert(
    {
      user_id: auth.user.id,
      item_id: itemId,
      last_offered_at: new Date().toISOString(),
      last_status: "started",
      cards_generated: insertedCards.length,
    },
    { onConflict: "user_id,item_id" }
  )

  await incrementDailyFlashcardGenerationCount(auth.supabase, auth.user.id)

  return NextResponse.json({
    sessionId: session.id,
    cards: insertedCards.map((card, index) => ({
      id: card.id,
      front_text: card.front_text,
      back_text: card.back_text,
      order_index: index,
    })),
  })
}
