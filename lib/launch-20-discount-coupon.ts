import "server-only"

import type Stripe from "stripe"

import {
  PREMIUM_MONTHLY_RON,
  PREMIUM_WEEKLY_RON,
} from "@/components/pricing/premium-pricing"
import { logger } from "@/lib/logger"
import { getStripeClient } from "@/lib/stripe"
import { getLaunch20PriceRon, isLaunch20Active } from "@/lib/launch-20-discount"

const LAUNCH_20_COUPONS = {
  week: {
    id: "launch_20_week_sept",
    amountOffRon: PREMIUM_WEEKLY_RON - getLaunch20PriceRon(PREMIUM_WEEKLY_RON),
    name: "PLANCK 20% weekly until 10 Sep",
  },
  month: {
    id: "launch_20_month_sept",
    amountOffRon: PREMIUM_MONTHLY_RON - getLaunch20PriceRon(PREMIUM_MONTHLY_RON),
    name: "PLANCK 20% monthly until 10 Sep",
  },
} as const

function isAlreadyExistsError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "resource_already_exists",
  )
}

export async function ensureLaunch20StripeCoupon(
  interval: "week" | "month",
  stripe: Stripe = getStripeClient(),
): Promise<string | null> {
  if (!isLaunch20Active()) return null

  const envId = process.env.STRIPE_LAUNCH_20_COUPON_ID?.trim()
  if (envId) return envId

  const spec = LAUNCH_20_COUPONS[interval]

  try {
    const existing = await stripe.coupons.retrieve(spec.id)
    if (existing.valid) return existing.id
  } catch {
    // Create below.
  }

  try {
    const created = await stripe.coupons.create({
      id: spec.id,
      amount_off: spec.amountOffRon * 100,
      currency: "ron",
      duration: "once",
      name: spec.name,
      metadata: { campaign: "launch_20_week_month", interval },
    })
    return created.id
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return (await stripe.coupons.retrieve(spec.id)).id
    }
    logger.error("[launch-20-coupon] Failed to create Stripe coupon:", error)
    return null
  }
}
