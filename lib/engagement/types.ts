export type EngagementType =
  | "progress_feedback"
  | "streak_reminder"
  | "social_proof"
  | "hint"
  | "momentum"

export type EngagementSurface = "toast" | "card"

export interface EngagementCta {
  label: string
  href?: string
  onClick?: () => void
}

export interface EngagementPayload {
  title: string
  description?: string
  cta?: EngagementCta
  secondaryCta?: EngagementCta
  icon?: "progress" | "streak" | "social" | "hint" | "momentum"
}

export interface EngagementNotification {
  id: string
  type: EngagementType
  surface: EngagementSurface
  priority: number
  payload: EngagementPayload
  cooldownMs?: number
  dedupeKey?: string
}

export type EngagementNotificationInput = Omit<EngagementNotification, "id"> & {
  id?: string
}

