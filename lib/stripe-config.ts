import "server-only"

import type { SubscriptionPlan } from "@/lib/subscription-plan"

type StripeMode = "test" | "live"

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

const getStripeMode = (): StripeMode => {
  const raw = (process.env.STRIPE_MODE || "test").toLowerCase()
  return raw === "live" ? "live" : "test"
}

const requireEnv = (name: string, value?: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const resolveSiteUrl = () => {
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  return requireEnv("NEXT_PUBLIC_SITE_URL", siteUrl)
}

const resolvePriceMap = (mode: StripeMode): StripePriceMap => {
  const suffix = mode === "live" ? "_LIVE" : ""
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

export const getStripeConfig = (): StripeConfig => {
  const mode = getStripeMode()
  const isLive = mode === "live"

  const publishableKey = requireEnv(
    isLive ? "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE" : "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    isLive ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )

  const secretKey = requireEnv(
    isLive ? "STRIPE_SECRET_KEY_LIVE" : "STRIPE_SECRET_KEY",
    isLive ? process.env.STRIPE_SECRET_KEY_LIVE : process.env.STRIPE_SECRET_KEY
  )

  const webhookSecret = requireEnv(
    isLive ? "STRIPE_WEBHOOK_SECRET_LIVE" : "STRIPE_WEBHOOK_SECRET",
    isLive ? process.env.STRIPE_WEBHOOK_SECRET_LIVE : process.env.STRIPE_WEBHOOK_SECRET
  )

  return {
    mode,
    siteUrl: resolveSiteUrl(),
    publishableKey,
    secretKey,
    webhookSecret,
    prices: resolvePriceMap(mode),
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
