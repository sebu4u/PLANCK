export const PRIZE_WHEEL_COUPON_TTL_DAYS = 5
export const PRIZE_WHEEL_COUPON_TTL_MS = PRIZE_WHEEL_COUPON_TTL_DAYS * 24 * 60 * 60 * 1000

export type PrizeCouponCountdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function getPrizeWheelCouponExpiresAt(createdAt: string | Date): string {
  const start = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime()
  if (Number.isNaN(start)) return new Date(0).toISOString()
  return new Date(start + PRIZE_WHEEL_COUPON_TTL_MS).toISOString()
}

export function isPrizeWheelCouponExpired(
  expiresAt: string | Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!expiresAt) return false
  const end = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime()
  if (Number.isNaN(end)) return false
  return now >= end
}

export function getPrizeCouponCountdown(
  expiresAt: string | Date,
  now = Date.now(),
): PrizeCouponCountdown {
  const end = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime()
  const diff = Number.isNaN(end) ? 0 : Math.max(0, end - now)
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: diff <= 0,
  }
}
