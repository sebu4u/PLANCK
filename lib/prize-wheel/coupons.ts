import "server-only"

import type Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import { YEAR_1_LEU_AMOUNT_OFF_BANI, type PrizeWheelPrizeType } from "@/lib/prize-wheel/types"

export const PRIZE_WHEEL_COUPON_IDS = {
  year_50: "planck_wheel_year_50",
  month_70: "planck_wheel_month_70",
  // New id: Stripe amount_off is immutable. The original planck_wheel_year_1_leu
  // charged 1 RON, below Stripe's 2 RON minimum.
  year_1_leu: "planck_wheel_year_1_leu_min2",
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
    name: "Roată anual 1 leu (min. 2 lei)",
    metadata: { planck_wheel_prize: "year_1_leu" },
  },
}

function isAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? String(error.code) : ""
  return code === "resource_already_exists"
}

function couponMatchesParams(existing: Stripe.Coupon, params: Stripe.CouponCreateParams): boolean {
  if (!existing.valid) return false
  if (typeof params.amount_off === "number") {
    return existing.amount_off === params.amount_off && existing.currency === params.currency
  }
  if (typeof params.percent_off === "number") {
    return existing.percent_off === params.percent_off
  }
  return true
}

export async function ensurePrizeWheelCoupon(
  type: Exclude<PrizeWheelPrizeType, "trial_7_days">,
  stripe: Stripe = getStripeClient()
): Promise<string> {
  const couponId = PRIZE_WHEEL_COUPON_IDS[type]
  const params = COUPON_PARAMS[type]
  try {
    const existing = await stripe.coupons.retrieve(couponId)
    if (couponMatchesParams(existing, params)) return existing.id
  } catch {
    // create below
  }

  try {
    const created = await stripe.coupons.create(params)
    return created.id
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      const existing = await stripe.coupons.retrieve(couponId)
      if (couponMatchesParams(existing, params)) return existing.id
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
