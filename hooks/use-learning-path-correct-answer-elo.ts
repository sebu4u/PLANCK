"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { awardGuestLearningPathItemElo } from "@/lib/guest-learning-path-elo"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"
import { PLANCK_STREAK_UPDATED_EVENT } from "@/hooks/use-learning-path-item-completion"
import { useOptionalLearningPathItemNavigation } from "@/components/invata/learning-path-item-navigation-context"

interface LearningPathCorrectAnswerEloInput {
  itemId: string
  lessonId: string
  isLastItem: boolean
}

interface LearningPathEloAwardRow {
  awarded?: boolean
  previous_elo?: number
  new_elo?: number
  award_amount?: number
}

export function useLearningPathCorrectAnswerElo({
  itemId,
  lessonId,
  isLastItem,
}: LearningPathCorrectAnswerEloInput) {
  const { user } = useAuth()
  const itemNavigation = useOptionalLearningPathItemNavigation()

  return useCallback(async (): Promise<LearningPathEloAward | null> => {
    if (!itemId) return null

    if (!user?.id) {
      const award = await awardGuestLearningPathItemElo(itemId)
      if (award?.awarded) {
        itemNavigation?.recordSessionItemCompletion?.(itemId)
      }
      return award
    }

    const { data, error } = await supabase.rpc("award_learning_path_item_elo", {
      item_id_param: itemId,
      lesson_id_param: lessonId || null,
      is_last_item_param: isLastItem,
    })

    if (error) {
      console.error(
        "learning path ELO award:",
        error.message || error.code || error,
        { itemId, lessonId, isLastItem },
      )
      return null
    }

    const row = (Array.isArray(data) ? data[0] : data) as LearningPathEloAwardRow | null
    if (!row) return null

    if (row.awarded && typeof window !== "undefined") {
      itemNavigation?.recordSessionItemCompletion?.(itemId)
      window.dispatchEvent(new CustomEvent(PLANCK_STREAK_UPDATED_EVENT))
      // PlanckPass XP for grilă / problem / poll / fill_slot (idempotent with SQL path)
      void import("@/lib/planckpass/award-client").then(({ awardPlanckPassXpForLpInteractive }) =>
        awardPlanckPassXpForLpInteractive(itemId),
      )
    }

    return {
      awarded: Boolean(row.awarded),
      previousElo: Number(row.previous_elo ?? 0),
      newElo: Number(row.new_elo ?? row.previous_elo ?? 0),
      awardAmount: Number(row.award_amount ?? 0),
    }
  }, [isLastItem, itemId, itemNavigation, lessonId, user?.id])
}
