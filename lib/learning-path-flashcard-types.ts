export interface LearningPathFlashcardOfferParams {
  itemId: string
  lessonId: string
  chapterId?: string | null
  chapterSlug: string
  lessonSlug: string
  nextItemHref: string
  itemType: string
  context: string
  itemTitle?: string | null
}

export interface UserFlashcard {
  id: string
  item_id: string
  lesson_id: string
  chapter_id: string | null
  front_text: string
  back_text: string
  source_item_type: string | null
  know_count: number
  dont_know_count: number
  last_reviewed_at: string | null
  created_at: string
}

export interface FlashcardSessionCard {
  id: string
  front_text: string
  back_text: string
  order_index: number
}

export interface FlashcardSessionPayload {
  sessionId: string
  cards: FlashcardSessionCard[]
}

export interface DeckFlashcard extends UserFlashcard {
  chapter_title?: string | null
  chapter_slug?: string | null
  lesson_title?: string | null
  lesson_slug?: string | null
  item_title?: string | null
}
