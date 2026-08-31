/** Public campaign clock for the prize wheel. Keep landing copy and `/castiga` in sync. */
export const PRIZE_WHEEL_CAMPAIGN_START_AT = new Date("2026-09-01T12:00:00+03:00")

/** First N students who spin get the yearly 1 leu prize. Admin can override in `/admin/roata`. */
export const PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT = 20

export const PLANCK_INSTAGRAM_HANDLE = "@planck.academy"
export const PLANCK_INSTAGRAM_HREF = "https://www.instagram.com/planck.academy/"

export function isPrizeWheelCampaignOpen(now = new Date()): boolean {
  return now.getTime() >= PRIZE_WHEEL_CAMPAIGN_START_AT.getTime()
}

/** Delay until the next status refetch while waiting for the wheel to go live. `null` = stop. */
export function getPrizeWheelLiveRefreshDelay(
  campaign: { isLive?: boolean; endsAt?: string | null } | null | undefined,
  now = Date.now(),
): number | null {
  if (campaign?.isLive) return null
  if (campaign?.endsAt) {
    const end = new Date(campaign.endsAt).getTime()
    if (!Number.isNaN(end) && now >= end) return null
  }
  const fallbackEnd = PRIZE_WHEEL_CAMPAIGN_START_AT.getTime() + 14 * 60 * 60 * 1000
  if (now >= fallbackEnd) return null
  const untilStart = PRIZE_WHEEL_CAMPAIGN_START_AT.getTime() - now
  if (untilStart > 0) return untilStart + 400
  return 2000
}

export function getPrizeWheelOpenDismissedStorageKey(userId: string) {
  return `planck_wheel_open_dismissed_${userId}`
}
