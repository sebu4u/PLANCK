export const ONBOARDING_TRIAL_DAYS = 7
export const ONBOARDING_TRIAL_OFFER_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

export function getOnboardingTrialOfferRemainingMs(
  createdAt: string | undefined,
  now = Date.now(),
): number {
  if (!createdAt) return 0
  const start = Date.parse(createdAt)
  if (!Number.isFinite(start)) return 0
  return start + ONBOARDING_TRIAL_OFFER_WINDOW_MS - now
}

export function isOnboardingTrialOfferActive(
  createdAt: string | undefined,
  now = Date.now(),
): boolean {
  return getOnboardingTrialOfferRemainingMs(createdAt, now) > 0
}

export function formatOnboardingTrialOfferCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000))
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return `${days}z ${hours}h ${minutes}m ${seconds}s`
}
