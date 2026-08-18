import "server-only"

import type Stripe from "stripe"

import { getStripeClient } from "@/lib/stripe"
import type { ShopCouponView } from "@/lib/shop/types"

const SHOP_COUPON_IDS = {
  month_50: "planck_shop_month_50",
  year_10: "planck_shop_year_10",
  week_90: "planck_shop_week_90",
} as const

function couponStripeId(coupon: ShopCouponView): string {
  if (coupon.productKey === "energy_25") {
    throw new Error("Produsul de Energie nu poate genera un cupon Stripe.")
  }
  return SHOP_COUPON_IDS[coupon.productKey]
}

function isAlreadyExistsError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "resource_already_exists"
  )
}

export async function ensureShopStripeCoupon(
  coupon: ShopCouponView,
  stripe: Stripe = getStripeClient()
): Promise<string> {
  const id = couponStripeId(coupon)
  try {
    const existing = await stripe.coupons.retrieve(id)
    if (existing.valid) return existing.id
  } catch {
    // Create the deterministic coupon below.
  }

  try {
    const created = await stripe.coupons.create({
      id,
      percent_off: coupon.percentOff,
      duration: "once",
      name: `Magazin PLANCK ${coupon.percentOff}% ${coupon.interval}`,
      metadata: {
        shop_product_key: coupon.productKey,
        shop_interval: coupon.interval,
      },
    })
    return created.id
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return (await stripe.coupons.retrieve(id)).id
    }
    throw error
  }
}
