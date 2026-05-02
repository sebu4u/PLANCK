"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"

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

  return useCallback(async (): Promise<LearningPathEloAward | null> => {
    if (!user?.id || !itemId) return null

    const { data, error } = await supabase.rpc("award_learning_path_item_elo", {
      item_id_param: itemId,
      lesson_id_param: lessonId || null,
      is_last_item_param: isLastItem,
    })

    if (error) {
      console.error("learning path ELO award:", error)
      return null
    }

    const row = (Array.isArray(data) ? data[0] : data) as LearningPathEloAwardRow | null
    if (!row) return null

    return {
      awarded: Boolean(row.awarded),
      previousElo: Number(row.previous_elo ?? 0),
      newElo: Number(row.new_elo ?? row.previous_elo ?? 0),
      awardAmount: Number(row.award_amount ?? 0),
    }
  }, [isLastItem, itemId, lessonId, user?.id])
}
