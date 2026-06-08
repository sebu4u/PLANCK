"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { useProgressTrigger } from "@/hooks/engagement/use-progress-trigger"

export const PLANCK_STREAK_UPDATED_EVENT = "planck:streak-updated"

function notifyStreakUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PLANCK_STREAK_UPDATED_EVENT))
}

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
    if (!itemId) return

    if (!user?.id) {
      if (!lessonId) return
      const response = await fetch("/api/learning-path/guest-item-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, itemId }),
        credentials: "same-origin",
      })
      if (!response.ok) {
        console.error("guest learning path item progress:", await response.text().catch(() => ""))
      }
      pushProgress(undefined, itemId)
      return
    }

    const { data: existingProgress } = await supabase
      .from("user_learning_path_item_progress")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .maybeSingle()

    const isFirstCompletion = !existingProgress
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

    if (isFirstCompletion) {
      const { error: streakError } = await supabase.rpc("record_user_streak_activity", {
        user_uuid: user.id,
      })
      if (streakError) {
        console.warn("learning path streak activity:", streakError.message || streakError)
      } else {
        notifyStreakUpdated()
      }
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
