import "server-only"

import type Stripe from "stripe"

import { markPrizeRedeemed } from "@/lib/prize-wheel/server"
import { getPrizeWheelCouponId } from "@/lib/prize-wheel/coupons"
import type { PrizeWheelPrizeView } from "@/lib/prize-wheel/types"

type BillingInterval = "week" | "month" | "year"

export function resolveIntervalForPrize(
  requested: BillingInterval,
  prize: PrizeWheelPrizeView | null
): BillingInterval {
  if (!prize) return requested
  return prize.interval
}

export async function applyPrizeToExistingSubscription(options: {
  stripe: Stripe
  subscriptionId: string
  prize: PrizeWheelPrizeView
  priceId: string
}): Promise<void> {
  const subscription = await options.stripe.subscriptions.retrieve(options.subscriptionId)
  const item = subscription.items.data[0]
  if (!item) {
    throw new Error("Abonamentul Stripe nu are un item valid.")
  }

  const currentPriceId = item.price.id
  const changingPrice = currentPriceId !== options.priceId
  const couponId = await getPrizeWheelCouponId(options.prize.type, options.stripe)

  const update: Stripe.SubscriptionUpdateParams = {
    metadata: {
      ...subscription.metadata,
      prize_wheel_prize_id: options.prize.id,
    },
    proration_behavior: changingPrice ? "always_invoice" : "none",
  }

  if (changingPrice) {
    update.items = [{ id: item.id, price: options.priceId }]
  }

  if (couponId) {
    update.discounts = [{ coupon: couponId }]
  }

  await options.stripe.subscriptions.update(options.subscriptionId, update)
  await markPrizeRedeemed({ prizeId: options.prize.id })
}

export async function buildPrizeCheckoutDiscounts(
  prize: PrizeWheelPrizeView | null,
  stripe: Stripe
): Promise<{ couponId: string | null; trialPeriodDays: number | null }> {
  if (!prize) return { couponId: null, trialPeriodDays: null }
  if (prize.isTrial) return { couponId: null, trialPeriodDays: 7 }
  const couponId = await getPrizeWheelCouponId(prize.type, stripe)
  return { couponId, trialPeriodDays: null }
}

export function withPrizeMetadata(
  metadata: Record<string, string>,
  prize: PrizeWheelPrizeView | null
): Record<string, string> {
  if (!prize) return metadata
  return {
    ...metadata,
    prize_wheel_prize_id: prize.id,
    prize_wheel_prize_type: prize.type,
  }
}
