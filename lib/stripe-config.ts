import "server-only"

import type { SubscriptionPlan } from "@/lib/subscription-plan"

export type StripeMode = "test" | "live"

type StripePriceMap = {
  plus: {
    monthly: string
    yearly: string
  }
  premium: {
    monthly: string
    yearly: string
  }
}

type StripeConfig = {
  mode: StripeMode
  siteUrl: string
  publishableKey: string
  secretKey: string
  webhookSecret: string
  prices: StripePriceMap
}

export const getStripeMode = (): StripeMode => {
  const raw = (process.env.STRIPE_MODE || "test").toLowerCase()
  return raw === "live" ? "live" : "test"
}

const getStripeModeSuffix = (mode: StripeMode) => (mode === "live" ? "_LIVE" : "")

const requireEnv = (name: string, value?: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const optionalEnv = (value?: string) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const resolveSiteUrl = () => {
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  return requireEnv("NEXT_PUBLIC_SITE_URL", siteUrl)
}

const resolvePriceMap = (mode: StripeMode): StripePriceMap => {
  const suffix = getStripeModeSuffix(mode)
  return {
    plus: {
      monthly: requireEnv(`STRIPE_PRICE_PLUS_MONTHLY${suffix}`, process.env[`STRIPE_PRICE_PLUS_MONTHLY${suffix}`]),
      yearly: requireEnv(`STRIPE_PRICE_PLUS_YEARLY${suffix}`, process.env[`STRIPE_PRICE_PLUS_YEARLY${suffix}`]),
    },
    premium: {
      monthly: requireEnv(`STRIPE_PRICE_PREMIUM_MONTHLY${suffix}`, process.env[`STRIPE_PRICE_PREMIUM_MONTHLY${suffix}`]),
      yearly: requireEnv(`STRIPE_PRICE_PREMIUM_YEARLY${suffix}`, process.env[`STRIPE_PRICE_PREMIUM_YEARLY${suffix}`]),
    },
  }
}

export const getStripePrices = (mode: StripeMode = getStripeMode()): StripePriceMap => {
  return resolvePriceMap(mode)
}

export const getStripeSecretKey = (mode: StripeMode = getStripeMode()): string => {
  const suffix = getStripeModeSuffix(mode)
  return requireEnv(`STRIPE_SECRET_KEY${suffix}`, process.env[`STRIPE_SECRET_KEY${suffix}`])
}

export const getStripeWebhookSecret = (mode: StripeMode = getStripeMode()): string => {
  const suffix = getStripeModeSuffix(mode)
  return requireEnv(`STRIPE_WEBHOOK_SECRET${suffix}`, process.env[`STRIPE_WEBHOOK_SECRET${suffix}`])
}

export const getStripeConfig = (mode: StripeMode = getStripeMode()): StripeConfig => {
  // This project uses Stripe-hosted Checkout + Billing Portal flows.
  // Backend requests should only carry plan/subscription metadata.
  const isLive = mode === "live"
  const suffix = getStripeModeSuffix(mode)

  const publishableKey = requireEnv(
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY${suffix}`,
    isLive ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )

  return {
    mode,
    siteUrl: resolveSiteUrl(),
    publishableKey,
    secretKey: getStripeSecretKey(mode),
    webhookSecret: getStripeWebhookSecret(mode),
    prices: getStripePrices(mode),
  }
}

export const resolvePlanFromPriceId = (
  priceId: string | null | undefined,
  prices: StripePriceMap
): SubscriptionPlan | null => {
  if (!priceId) return null
  if (priceId === prices.plus.monthly || priceId === prices.plus.yearly) {
    return "plus"
  }
  if (priceId === prices.premium.monthly || priceId === prices.premium.yearly) {
    return "premium"
  }
  return null
}

export const getStripeWebhookSecretEntries = (): Array<{ mode: StripeMode; secret: string }> => {
  const entries = [
    { mode: "test" as const, secret: optionalEnv(process.env.STRIPE_WEBHOOK_SECRET) },
    { mode: "live" as const, secret: optionalEnv(process.env.STRIPE_WEBHOOK_SECRET_LIVE) },
  ].filter((entry): entry is { mode: StripeMode; secret: string } => Boolean(entry.secret))

  if (entries.length === 0) {
    throw new Error("Missing required env var: STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_LIVE")
  }

  return entries
}

export const resolveStripeModeFromLivemode = (livemode: boolean): StripeMode => {
  return livemode ? "live" : "test"
}
