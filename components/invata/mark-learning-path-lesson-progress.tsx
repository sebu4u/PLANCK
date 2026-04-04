"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"

interface MarkLearningPathLessonProgressProps {
  lessonId: string
}

/**
 * Marchează lecția ca parcursă (persistat) — apelat la ultimul item sau la lecție fără itemi.
 */
export function MarkLearningPathLessonProgress({ lessonId }: MarkLearningPathLessonProgressProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id || !lessonId) return

    void supabase
      .from("user_learning_path_lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      )
      .then(({ error }) => {
        if (error) console.error("learning path lesson progress upsert:", error)
      })
  }, [user?.id, lessonId])

  return null
}
