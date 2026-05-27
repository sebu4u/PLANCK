import type { SupabaseClient } from "@supabase/supabase-js"
import type { DeckFlashcard } from "@/lib/learning-path-flashcard-types"

export async function getFlashcardOfferEligibility(
  supabase: SupabaseClient,
  itemId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("should_offer_learning_path_flashcards", {
    p_item_id: itemId,
  })
  if (error) {
    console.error("should_offer_learning_path_flashcards:", error)
    return false
  }
  return Boolean(data)
}

export async function getUserFlashcardDeck(
  supabase: SupabaseClient,
  userId: string
): Promise<DeckFlashcard[]> {
  const { data: cards, error } = await supabase
    .from("user_flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error || !cards?.length) {
    if (error) console.error("getUserFlashcardDeck:", error)
    return []
  }

  const lessonIds = [...new Set(cards.map((c) => c.lesson_id))]
  const itemIds = [...new Set(cards.map((c) => c.item_id))]

  const [{ data: lessons }, { data: items }] = await Promise.all([
    supabase
      .from("learning_path_lessons")
      .select("id, title, slug, chapter_id")
      .in("id", lessonIds),
    supabase.from("learning_path_lesson_items").select("id, title").in("id", itemIds),
  ])

  const chapterIds = [...new Set((lessons ?? []).map((l) => l.chapter_id).filter(Boolean))]
  const { data: chapters } = chapterIds.length
    ? await supabase
        .from("learning_path_chapters")
        .select("id, title, slug")
        .in("id", chapterIds)
    : { data: [] as { id: string; title: string; slug: string }[] }

  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l]))
  const itemById = new Map((items ?? []).map((i) => [i.id, i]))
  const chapterById = new Map((chapters ?? []).map((c) => [c.id, c]))

  return cards.map((card) => {
    const lesson = lessonById.get(card.lesson_id)
    const chapter = lesson?.chapter_id ? chapterById.get(lesson.chapter_id) : null
    const item = itemById.get(card.item_id)
    return {
      ...card,
      chapter_title: chapter?.title ?? null,
      chapter_slug: chapter?.slug ?? null,
      lesson_title: lesson?.title ?? null,
      lesson_slug: lesson?.slug ?? null,
      item_title: item?.title ?? null,
    }
  })
}

export async function getDailyFlashcardGenerationCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from("user_flashcard_daily_generations")
    .select("generation_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle()
  return data?.generation_count ?? 0
}

export async function incrementDailyFlashcardGenerationCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase
    .from("user_flashcard_daily_generations")
    .select("generation_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("user_flashcard_daily_generations")
      .update({ generation_count: existing.generation_count + 1 })
      .eq("user_id", userId)
      .eq("usage_date", today)
  } else {
    await supabase.from("user_flashcard_daily_generations").insert({
      user_id: userId,
      usage_date: today,
      generation_count: 1,
    })
  }
}
