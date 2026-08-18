export type PrizeWheelBillingInterval = "week" | "month" | "year"

/** Keep in sync with PREMIUM_YEARLY_RON on the pricing page. */
export const PRIZE_WHEEL_YEARLY_RON = 1199
export const PRIZE_WHEEL_YEAR_1_LEU_PAY_RON = 1
export const YEAR_1_LEU_AMOUNT_OFF_BANI =
  (PRIZE_WHEEL_YEARLY_RON - PRIZE_WHEEL_YEAR_1_LEU_PAY_RON) * 100

export const PRIZE_WHEEL_PRIZE_TYPES = [
  "trial_7_days",
  "year_50",
  "month_70",
  "year_1_leu",
] as const

export type PrizeWheelPrizeType = (typeof PRIZE_WHEEL_PRIZE_TYPES)[number]

export const PRIZE_WHEEL_SPIN_RESULTS = [
  ...PRIZE_WHEEL_PRIZE_TYPES,
  "spin_again",
] as const

export type PrizeWheelSpinResult = (typeof PRIZE_WHEEL_SPIN_RESULTS)[number]

const WHEEL_PRIZE_FILL = "#5B47D6"
const WHEEL_SPIN_FILL = "#EDE9FE"

export const PRIZE_WHEEL_SEGMENTS = [
  {
    index: 0,
    result: "trial_7_days" as const,
    label: "7 zile gratuit",
    lines: ["7 zile", "gratuit"],
    color: WHEEL_PRIZE_FILL,
    textColor: "#ffffff",
  },
  {
    index: 1,
    result: "spin_again" as const,
    label: "Învârte din nou",
    lines: ["Învârte", "din nou"],
    color: WHEEL_SPIN_FILL,
    textColor: "#3D2E9C",
  },
  {
    index: 2,
    result: "year_50" as const,
    label: "50% reducere anual",
    lines: ["−50%", "anual"],
    color: WHEEL_PRIZE_FILL,
    textColor: "#ffffff",
  },
  {
    index: 3,
    result: "month_70" as const,
    label: "70% reducere lunar",
    lines: ["−70%", "lunar"],
    color: "#6E5CEB",
    textColor: "#ffffff",
  },
  {
    index: 4,
    result: "spin_again" as const,
    label: "Învârte din nou",
    lines: ["Învârte", "din nou"],
    color: WHEEL_SPIN_FILL,
    textColor: "#3D2E9C",
  },
  {
    index: 5,
    result: "year_1_leu" as const,
    label: "Anual la 1 leu",
    lines: ["Anual", "1 leu"],
    color: WHEEL_PRIZE_FILL,
    textColor: "#ffffff",
  },
] as const

export const PRIZE_WHEEL_SEGMENT_COUNT = PRIZE_WHEEL_SEGMENTS.length
export const PRIZE_WHEEL_SEGMENT_ANGLE = 360 / PRIZE_WHEEL_SEGMENT_COUNT

export function isPrizeWheelPrizeType(value: unknown): value is PrizeWheelPrizeType {
  return typeof value === "string" && (PRIZE_WHEEL_PRIZE_TYPES as readonly string[]).includes(value)
}

export function isPrizeWheelSpinResult(value: unknown): value is PrizeWheelSpinResult {
  return typeof value === "string" && (PRIZE_WHEEL_SPIN_RESULTS as readonly string[]).includes(value)
}

export function getPrizeWheelPrizeLabel(type: PrizeWheelPrizeType): string {
  switch (type) {
    case "trial_7_days":
      return "Abonament de 7 zile gratuit"
    case "year_50":
      return "50% reducere la abonamentul anual"
    case "month_70":
      return "70% reducere la abonamentul lunar"
    case "year_1_leu":
      return "Abonament anual la 1 leu"
  }
}

export function getPrizeWheelInterval(type: PrizeWheelPrizeType): PrizeWheelBillingInterval {
  if (type === "month_70" || type === "trial_7_days") return "month"
  return "year"
}

export function getPrizeWheelDisplayPromo(type: PrizeWheelPrizeType): {
  percentOff: number | null
  amountOff: number | null
  currency: string | null
  isTrial: boolean
} {
  switch (type) {
    case "trial_7_days":
      return { percentOff: null, amountOff: null, currency: null, isTrial: true }
    case "year_50":
      return { percentOff: 50, amountOff: null, currency: null, isTrial: false }
    case "month_70":
      return { percentOff: 70, amountOff: null, currency: null, isTrial: false }
    case "year_1_leu":
      return {
        percentOff: null,
        amountOff: YEAR_1_LEU_AMOUNT_OFF_BANI,
        currency: "ron",
        isTrial: false,
      }
  }
}

export type PrizeWheelPublicCampaign = {
  isLive: boolean
  startsAt: string | null
  endsAt: string | null
}

export type PrizeWheelPrizeView = {
  id: string
  type: PrizeWheelPrizeType
  code: string
  label: string
  interval: PrizeWheelBillingInterval
  redeemedAt: string | null
  percentOff: number | null
  amountOff: number | null
  currency: string | null
  isTrial: boolean
}

export type PrizeWheelUserState = {
  isStudent: boolean
  isPremium: boolean
  spinCount: number
  canSpin: boolean
  hasSpunOnce: boolean
  prize: PrizeWheelPrizeView | null
}

export type PrizeWheelStatusResponse = {
  campaign: PrizeWheelPublicCampaign
  user: PrizeWheelUserState | null
}

export type PrizeWheelSpinResponse = {
  result: PrizeWheelSpinResult
  segmentIndex: number
  code: string | null
  prize: PrizeWheelPrizeView | null
}

export function isCampaignLive(startsAt: string | Date | null, endsAt: string | Date | null, now = new Date()): boolean {
  if (!startsAt || !endsAt) return false
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt)
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return now >= start && now < end
}

export function wheelLandingDegrees(segmentIndex: number): number {
  const segmentCenter =
    segmentIndex * PRIZE_WHEEL_SEGMENT_ANGLE + PRIZE_WHEEL_SEGMENT_ANGLE / 2
  // Pointer sits at 12 o'clock. Positive CSS rotate is clockwise, so the
  // local angle under the pointer is (360 - rotation). Bring the segment
  // center to the top by rotating the opposite of that center angle.
  return (360 - (segmentCenter % 360)) % 360
}

export function segmentIndexForResult(
  result: PrizeWheelSpinResult,
  preferredIndex?: number
): number {
  if (
    typeof preferredIndex === "number" &&
    preferredIndex >= 0 &&
    preferredIndex < PRIZE_WHEEL_SEGMENTS.length &&
    PRIZE_WHEEL_SEGMENTS[preferredIndex]?.result === result
  ) {
    return preferredIndex
  }
  const match = PRIZE_WHEEL_SEGMENTS.findIndex((segment) => segment.result === result)
  return match >= 0 ? match : 0
}

export function nextWheelRotation(currentRotation: number, segmentIndex: number, extraSpins = 5): number {
  const landing = wheelLandingDegrees(segmentIndex)
  const currentMod = ((currentRotation % 360) + 360) % 360
  let delta = (landing - currentMod + 360) % 360
  if (delta < 20) delta += 360
  return currentRotation + extraSpins * 360 + delta
}
