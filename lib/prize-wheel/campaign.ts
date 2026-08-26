/** Public campaign clock for the prize wheel. Keep landing copy and `/castiga` in sync. */
export const PRIZE_WHEEL_CAMPAIGN_START_AT = new Date("2026-09-01T12:00:00+03:00")

/** First N students who spin get the yearly 1 leu prize. Admin can override in `/admin/roata`. */
export const PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT = 20

export function isPrizeWheelCampaignOpen(now = new Date()): boolean {
  return now.getTime() >= PRIZE_WHEEL_CAMPAIGN_START_AT.getTime()
}
