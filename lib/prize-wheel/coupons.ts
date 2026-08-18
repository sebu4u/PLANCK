import "server-only"

import type Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import { YEAR_1_LEU_AMOUNT_OFF_BANI, type PrizeWheelPrizeType } from "@/lib/prize-wheel/types"

export const PRIZE_WHEEL_COUPON_IDS = {
  year_50: "planck_wheel_year_50",
  month_70: "planck_wheel_month_70",
  year_1_leu: "planck_wheel_year_1_leu",
} as const

const COUPON_PARAMS: Record<
  Exclude<PrizeWheelPrizeType, "trial_7_days">,
  Stripe.CouponCreateParams
> = {
  year_50: {
    id: PRIZE_WHEEL_COUPON_IDS.year_50,
    percent_off: 50,
    duration: "once",
    name: "Roată 50% anual",
    metadata: { planck_wheel_prize: "year_50" },
  },
  month_70: {
    id: PRIZE_WHEEL_COUPON_IDS.month_70,
    percent_off: 70,
    duration: "once",
    name: "Roată 70% lunar",
    metadata: { planck_wheel_prize: "month_70" },
  },
  year_1_leu: {
    id: PRIZE_WHEEL_COUPON_IDS.year_1_leu,
    amount_off: YEAR_1_LEU_AMOUNT_OFF_BANI,
    currency: "ron",
    duration: "once",
    name: "Roată anual 1 leu",
    metadata: { planck_wheel_prize: "year_1_leu" },
  },
}

function isAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? String(error.code) : ""
  return code === "resource_already_exists"
}

export async function ensurePrizeWheelCoupon(
  type: Exclude<PrizeWheelPrizeType, "trial_7_days">,
  stripe: Stripe = getStripeClient()
): Promise<string> {
  const couponId = PRIZE_WHEEL_COUPON_IDS[type]
  try {
    const existing = await stripe.coupons.retrieve(couponId)
    if (existing.valid) return existing.id
  } catch {
    // create below
  }

  try {
    const created = await stripe.coupons.create(COUPON_PARAMS[type])
    return created.id
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      const existing = await stripe.coupons.retrieve(couponId)
      return existing.id
    }
    throw error
  }
}

export async function getPrizeWheelCouponId(
  type: PrizeWheelPrizeType,
  stripe?: Stripe
): Promise<string | null> {
  if (type === "trial_7_days") return null
  return ensurePrizeWheelCoupon(type, stripe ?? getStripeClient())
}
