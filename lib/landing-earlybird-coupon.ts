import "server-only"

import type Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import { EARLYBIRD_AMOUNT_OFF_RON } from "@/lib/landing-earlybird"

const EARLYBIRD_COUPON_ID = "earlybird_landing_799"

function isAlreadyExistsError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "resource_already_exists",
  )
}

export async function ensureEarlybirdStripeCoupon(
  stripe: Stripe = getStripeClient(),
): Promise<string | null> {
  const envId = process.env.STRIPE_EARLYBIRD_COUPON_ID?.trim()
  if (envId) return envId

  try {
    const existing = await stripe.coupons.retrieve(EARLYBIRD_COUPON_ID)
    if (existing.valid) return existing.id
  } catch {
    // Create below.
  }

  try {
    const created = await stripe.coupons.create({
      id: EARLYBIRD_COUPON_ID,
      amount_off: EARLYBIRD_AMOUNT_OFF_RON * 100,
      currency: "ron",
      duration: "once",
      name: "Earlybird PLANCK 799 RON/an",
      metadata: { campaign: "landing_earlybird" },
    })
    return created.id
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return (await stripe.coupons.retrieve(EARLYBIRD_COUPON_ID)).id
    }
    return null
  }
}
