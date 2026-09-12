import "server-only"

import type Stripe from "stripe"

import { logger } from "@/lib/logger"
import { getStripeClient } from "@/lib/stripe"
import {
  BACK_TO_SCHOOL_AMOUNT_OFF_RON,
  isBackToSchoolActive,
} from "@/lib/back-to-school-discount"

const BACK_TO_SCHOOL_COUPON = {
  id: "back2school_month_35",
  amountOffRon: BACK_TO_SCHOOL_AMOUNT_OFF_RON,
  name: "PLANCK Back2School first month 35 RON",
} as const

function isAlreadyExistsError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "resource_already_exists",
  )
}

export async function ensureBackToSchoolStripeCoupon(
  stripe: Stripe = getStripeClient(),
): Promise<string | null> {
  if (!isBackToSchoolActive()) return null

  const envId = process.env.STRIPE_BACK2SCHOOL_COUPON_ID?.trim()
  if (envId) return envId

  try {
    const existing = await stripe.coupons.retrieve(BACK_TO_SCHOOL_COUPON.id)
    if (existing.valid) return existing.id
  } catch {
    // Create below.
  }

  try {
    const created = await stripe.coupons.create({
      id: BACK_TO_SCHOOL_COUPON.id,
      amount_off: BACK_TO_SCHOOL_COUPON.amountOffRon * 100,
      currency: "ron",
      duration: "once",
      name: BACK_TO_SCHOOL_COUPON.name,
      metadata: { campaign: "back2school", interval: "month" },
    })
    return created.id
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return (await stripe.coupons.retrieve(BACK_TO_SCHOOL_COUPON.id)).id
    }
    logger.error("[back2school-coupon] Failed to create Stripe coupon:", error)
    return null
  }
}
