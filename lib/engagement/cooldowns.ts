import type { EngagementType } from "@/lib/engagement/types"

export const GLOBAL_THROTTLE_MS = 25_000

export const ENGAGEMENT_COOLDOWNS_MS: Record<EngagementType, number> = {
  progress_feedback: 60_000,
  momentum: 90_000,
  social_proof: 5 * 60_000,
  streak_reminder: 8 * 60 * 60_000,
  hint: 3 * 60_000,
}

export const ENGAGEMENT_QUEUE_LIMIT = 3
export const HIGH_PRIORITY_BYPASS = 90

