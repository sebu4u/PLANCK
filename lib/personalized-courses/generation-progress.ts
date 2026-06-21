import "server-only"

import type { SupabaseAnyClient } from "@/lib/personalized-courses/types"
import { getPlannerModel } from "@/lib/personalized-courses/planner"

export type GenerationProgressUpdate = {
  stage: string
  percent: number
  message: string
}

export async function mergeChapterGenerationProgress(
  admin: SupabaseAnyClient,
  chapterId: string,
  update: GenerationProgressUpdate,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  const { data: row, error: readError } = await admin
    .from("learning_path_chapters")
    .select("generation_metadata, generation_status")
    .eq("id", chapterId)
    .maybeSingle()

  if (readError || !row || row.generation_status !== "creating") {
    return false
  }

  const existing =
    row.generation_metadata && typeof row.generation_metadata === "object" && !Array.isArray(row.generation_metadata)
      ? (row.generation_metadata as Record<string, unknown>)
      : {}

  const { error: writeError } = await admin
    .from("learning_path_chapters")
    .update({
      generation_metadata: {
        ...existing,
        model: getPlannerModel(),
        backend: "learning_path",
        ...extra,
        progress: {
          stage: update.stage,
          percent: update.percent,
          message: update.message,
          updatedAt: new Date().toISOString(),
        },
      },
    })
    .eq("id", chapterId)
    .eq("generation_status", "creating")

  if (writeError) {
    console.error("generation progress update:", writeError)
    return false
  }

  return true
}

export async function runWithProgressHeartbeat<T>(
  update: (progress: GenerationProgressUpdate) => Promise<void>,
  config: {
    stage: string
    startPercent: number
    endPercent: number
    messages: string[]
    intervalMs?: number
    step?: number
  },
  work: () => Promise<T>,
): Promise<T> {
  let currentPercent = config.startPercent
  let messageIndex = 0
  const cap = Math.max(config.startPercent, config.endPercent - 1)
  const step = config.step ?? 2
  const intervalMs = config.intervalMs ?? 5000

  const tick = setInterval(() => {
    if (currentPercent >= cap) return
    currentPercent = Math.min(cap, currentPercent + step)
    const message = config.messages[messageIndex % Math.max(1, config.messages.length)] ?? config.messages[0] ?? ""
    messageIndex += 1
    void update({
      stage: config.stage,
      percent: currentPercent,
      message,
    })
  }, intervalMs)

  try {
    return await work()
  } finally {
    clearInterval(tick)
  }
}
