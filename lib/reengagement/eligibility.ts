import type { ReengagementSendRecord, ReengagementTier } from "@/lib/reengagement/types"

export const REENGAGEMENT_TIMEZONE = "Europe/Bucharest"
export const TIER_THRESHOLDS = {
  1: 4,
  2: 9,
  3: 18,
  4: 30,
} as const satisfies Record<ReengagementTier, number>

export const TIER4_RECURRENCE_DAYS = 14

/** Calendar days between two instants in Europe/Bucharest. */
export function daysInactiveSince(lastActivityAt: Date, now: Date = new Date()): number {
  const tz = REENGAGEMENT_TIMEZONE
  const lastDay = formatDateInTimezone(lastActivityAt, tz)
  const nowDay = formatDateInTimezone(now, tz)
  const lastMs = parseDateOnly(lastDay).getTime()
  const nowMs = parseDateOnly(nowDay).getTime()
  return Math.floor((nowMs - lastMs) / (24 * 60 * 60 * 1000))
}

function formatDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Highest tier the user qualifies for, or null if still active (< 4 days). */
export function getEligibleTier(daysInactive: number): ReengagementTier | null {
  if (daysInactive >= TIER_THRESHOLDS[4]) return 4
  if (daysInactive >= TIER_THRESHOLDS[3]) return 3
  if (daysInactive >= TIER_THRESHOLDS[2]) return 2
  if (daysInactive >= TIER_THRESHOLDS[1]) return 1
  return null
}

export function hasPriorSendForTier(
  sends: ReengagementSendRecord[],
  tier: ReengagementTier
): boolean {
  if (tier === 4) return false
  return sends.some(
    (s) => s.tier === tier && (s.status === "sent" || s.status === "pending")
  )
}

export function getLastTier4Send(sends: ReengagementSendRecord[]): ReengagementSendRecord | null {
  const tier4Sent = sends
    .filter((s) => s.tier === 4 && s.status === "sent")
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
  return tier4Sent[0] ?? null
}

function hasPendingTier4Send(sends: ReengagementSendRecord[]): boolean {
  return sends.some((s) => s.tier === 4 && s.status === "pending")
}

export function isTier4RecurrenceDue(
  sends: ReengagementSendRecord[],
  now: Date = new Date()
): boolean {
  if (hasPendingTier4Send(sends)) return false
  const last = getLastTier4Send(sends)
  if (!last) return true
  const daysSince = daysInactiveSince(new Date(last.sent_at), now)
  return daysSince >= TIER4_RECURRENCE_DAYS
}

export function shouldSendReengagementEmail(
  daysInactive: number,
  sends: ReengagementSendRecord[],
  now: Date = new Date()
): { send: boolean; tier: ReengagementTier | null; reason?: string } {
  const tier = getEligibleTier(daysInactive)
  if (tier === null) {
    return { send: false, tier: null, reason: "active_recently" }
  }

  if (tier === 4) {
    if (!isTier4RecurrenceDue(sends, now)) {
      return { send: false, tier: 4, reason: "tier4_cooldown" }
    }
    return { send: true, tier: 4 }
  }

  if (hasPriorSendForTier(sends, tier)) {
    return { send: false, tier, reason: "already_sent" }
  }

  return { send: true, tier }
}

export function isExcludedAdminEmail(email: string, adminEmails: string[]): boolean {
  const normalized = email.trim().toLowerCase()
  return adminEmails.some((e) => e.trim().toLowerCase() === normalized)
}

export function isValidLastActivity(lastActivityAt: string | null | undefined): boolean {
  if (!lastActivityAt) return false
  const ms = new Date(lastActivityAt).getTime()
  return Number.isFinite(ms) && ms > 0 && lastActivityAt !== "-infinity"
}
