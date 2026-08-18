import type { PremiumBillingInterval } from "@/components/pricing/premium-pricing"

export type StartPremiumCheckoutInput = {
  accessToken: string
  interval: PremiumBillingInterval
  promotionCodeId?: string
  shopCouponId?: string
  childId?: string
  successPath?: string
  cancelPath?: string
  campaign?: "earlybird"
}

export type StartPremiumCheckoutResult =
  | { ok: true; url: string }
  | { ok: true; applied: true }
  | { ok: false; error: string }

export async function startPremiumCheckout(
  input: StartPremiumCheckoutInput,
): Promise<StartPremiumCheckoutResult> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      plan: "premium",
      interval: input.interval,
      promotionCodeId: input.promotionCodeId,
      shopCouponId: input.shopCouponId,
      ...(input.childId ? { childId: input.childId } : {}),
      ...(input.successPath ? { successPath: input.successPath } : {}),
      ...(input.cancelPath ? { cancelPath: input.cancelPath } : {}),
      ...(input.campaign ? { campaign: input.campaign } : {}),
    }),
  })

  const payload = (await response.json().catch(() => null)) as {
    error?: string
    url?: string
    applied?: boolean
  } | null

  if (!response.ok) {
    return { ok: false, error: payload?.error || "Nu am putut iniția checkout-ul." }
  }

  if (payload?.applied) {
    return { ok: true, applied: true }
  }

  if (payload?.url) {
    return { ok: true, url: payload.url }
  }

  return { ok: false, error: "Checkout URL lipsă." }
}
