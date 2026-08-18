import { PREMIUM_YEARLY_RON } from "@/components/pricing/premium-pricing"

/** Earlybird annual offer — landing + /rezerva. */
export const LANDING_DEADLINE = new Date("2026-09-07T23:59:59")

export const EARLYBIRD_YEARLY_RON = 799
export const FULL_YEARLY_RON = PREMIUM_YEARLY_RON
export const EARLYBIRD_DEADLINE_LABEL = "7 septembrie"
export const EARLYBIRD_SAVE_PERCENT = Math.round(
  ((FULL_YEARLY_RON - EARLYBIRD_YEARLY_RON) / FULL_YEARLY_RON) * 100,
)
export const EARLYBIRD_AMOUNT_OFF_RON = FULL_YEARLY_RON - EARLYBIRD_YEARLY_RON

export function isEarlybirdActive(now = new Date()): boolean {
  return now.getTime() < LANDING_DEADLINE.getTime()
}

/** Stable FOMO count for a calendar day — fewer seats as the deadline approaches. */
export function remainingEarlybirdSeats(now = new Date()): number {
  if (!isEarlybirdActive(now)) return 0
  const daysLeft = Math.max(
    0,
    Math.ceil((LANDING_DEADLINE.getTime() - now.getTime()) / 86_400_000),
  )
  return Math.min(40, Math.max(9, daysLeft + 6))
}
