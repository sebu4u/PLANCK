export type ReengagementTier = 1 | 2 | 3 | 4

export type ReengagementSendStatus = "pending" | "sent" | "failed"

export interface ReengagementSendRecord {
  tier: ReengagementTier
  sent_at: string
  status: ReengagementSendStatus
}

export interface ReengagementPersonalization {
  first_name: string
  days_inactive: number
  last_work_label: string
  progress_percent: number
  materie: string
  current_streak: number
  cta_url: string
  reeng_tier: ReengagementTier
  reeng_send_id: string
  subject: string
}

export interface ReengagementCandidate {
  user_id: string
  email: string
  name: string | null
  preferred_materie: string | null
  marketing_emails_opt_out: boolean
  is_admin: boolean
  is_dev: boolean
  current_streak: number
  last_activity_at: string | null
}

export interface ReengagementJobSummary {
  tier1: ReengagementTierStats
  tier2: ReengagementTierStats
  tier3: ReengagementTierStats
  tier4: ReengagementTierStats
  skipped_no_activity: number
  skipped_excluded: number
  skipped_opt_out: number
  skipped_not_sendable: number
  duration_ms: number
}

export interface ReengagementTierStats {
  eligible: number
  sent: number
  failed: number
  skipped: number
}
