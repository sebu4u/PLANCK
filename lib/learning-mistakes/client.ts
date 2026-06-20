"use client"

import { supabase } from "@/lib/supabaseClient"
import type { LearningMistakeApiResponse, LearningMistakeRecordInput } from "@/lib/learning-mistakes/types"

function hasUsefulIdentifier(input: LearningMistakeRecordInput): boolean {
  return Boolean(input.itemId || input.lessonId || input.chapterId || input.problemId || input.quizQuestionId)
}

export async function recordLearningMistake(
  input: LearningMistakeRecordInput,
): Promise<LearningMistakeApiResponse> {
  if (!hasUsefulIdentifier(input)) return { skipped: true }

  try {
    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token
    if (!accessToken) return { skipped: true }

    const response = await fetch("/api/learning-path/mistakes/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
      keepalive: true,
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      console.warn("recordLearningMistake failed:", body?.error ?? response.statusText)
      return { error: body?.error ?? response.statusText }
    }

    return (await response.json()) as LearningMistakeApiResponse
  } catch (error) {
    console.warn("recordLearningMistake failed:", error)
    return { error: "record_failed" }
  }
}
