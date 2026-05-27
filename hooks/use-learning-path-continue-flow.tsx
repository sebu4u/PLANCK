"use client"

import { useCallback } from "react"
import { useNavigateToNextLearningPathItem } from "@/components/invata/learning-path-item-navigation-context"
import { useOptionalLearningPathFlashcardFlow } from "@/components/invata/learning-path-flashcard-flow-context"
import { useAuth } from "@/components/auth-provider"
import { checkFlashcardOfferEligibility } from "@/lib/learning-path-flashcard-client"
import { buildFlashcardOfferParams, type LearningPathFlashcardBridge } from "@/lib/learning-path-flashcard-bridge"

interface UseLearningPathContinueFlowOptions {
  nextItemHref: string
  onContinue?: () => Promise<void> | void
  flashcardBridge?: LearningPathFlashcardBridge | null
}

export function useLearningPathContinueFlow({
  nextItemHref,
  onContinue,
  flashcardBridge,
}: UseLearningPathContinueFlowOptions) {
  const { user } = useAuth()
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const flashcardFlow = useOptionalLearningPathFlashcardFlow()

  const proceedAfterCorrect = useCallback(async () => {
    await onContinue?.()

    const struggled = flashcardBridge?.consumeStruggledBeforeSuccess() ?? false
    if (!struggled || !user?.id || !flashcardBridge || !flashcardFlow) {
      await navigateToNextItem()
      return
    }

    const flashcardOfferParams = buildFlashcardOfferParams(flashcardBridge, nextItemHref)

    try {
      const eligible = await checkFlashcardOfferEligibility(flashcardOfferParams.itemId)
      if (!eligible) {
        await navigateToNextItem()
        return
      }
      flashcardFlow.openOffer({ bridge: flashcardBridge, nextItemHref })
    } catch {
      await navigateToNextItem()
    }
  }, [flashcardBridge, flashcardFlow, navigateToNextItem, nextItemHref, onContinue, user?.id])

  return { proceedAfterCorrect }
}
