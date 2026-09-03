/** Automatic 20% off weekly/monthly Premium — pulled; kept for leftover UI branches. */

export const LAUNCH_20_DEADLINE = new Date("2026-09-10T23:59:59+03:00")
export const LAUNCH_20_PERCENT = 20
export const LAUNCH_20_DEADLINE_LABEL = "10 septembrie"

export function isLaunch20Active(_now = new Date()): boolean {
  return false
}

export function getLaunch20PriceRon(fullPriceRon: number): number {
  return Math.round(fullPriceRon * (1 - LAUNCH_20_PERCENT / 100))
}
