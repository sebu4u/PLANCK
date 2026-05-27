"use client"

import type { LearningPathFlashcardOfferParams } from "@/lib/learning-path-flashcard-types"

export interface LearningPathFlashcardBridge {
  meta: Omit<LearningPathFlashcardOfferParams, "context" | "nextItemHref">
  getContext: () => string
  consumeStruggledBeforeSuccess: () => boolean
}

export function buildFlashcardOfferParams(
  bridge: LearningPathFlashcardBridge,
  nextItemHref: string
): LearningPathFlashcardOfferParams {
  return {
    ...bridge.meta,
    nextItemHref,
    context: bridge.getContext(),
  }
}
