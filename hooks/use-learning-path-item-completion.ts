"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { useProgressTrigger } from "@/hooks/engagement/use-progress-trigger"

interface LearningPathItemCompletionInput {
  itemId: string
  lessonId: string
  isLastItem: boolean
}

export function useLearningPathItemCompletion({
  itemId,
  lessonId,
  isLastItem,
}: LearningPathItemCompletionInput) {
  const { user } = useAuth()
  const pushProgress = useProgressTrigger()

  return useCallback(async () => {
    if (!user?.id || !itemId) return

    const completedAt = new Date().toISOString()
    const { error: itemError } = await supabase
      .from("user_learning_path_item_progress")
      .upsert(
        {
          user_id: user.id,
          item_id: itemId,
          completed_at: completedAt,
        },
        { onConflict: "user_id,item_id" }
      )

    if (itemError) {
      console.error("learning path item progress upsert:", itemError)
      return
    }

    const { count } = await supabase
      .from("user_learning_path_item_progress")
      .select("item_id", { count: "exact", head: true })
      .eq("user_id", user.id)

    pushProgress(count ?? undefined, itemId)

    if (!isLastItem || !lessonId) return

    const { error: lessonError } = await supabase
      .from("user_learning_path_lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: completedAt,
        },
        { onConflict: "user_id,lesson_id" }
      )

    if (lessonError) {
      console.error("learning path lesson progress upsert:", lessonError)
    }
  }, [isLastItem, itemId, lessonId, pushProgress, user?.id])
}
