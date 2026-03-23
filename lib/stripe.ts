import "server-only"

import Stripe from "stripe"

import { getStripeMode, getStripeSecretKey, type StripeMode } from "@/lib/stripe-config"

const stripeClients = new Map<StripeMode, Stripe>()

export const getStripeClient = (mode?: StripeMode) => {
  const resolvedMode = mode ?? getStripeMode()
  const cachedClient = stripeClients.get(resolvedMode)
  if (cachedClient) return cachedClient

  const secretKey = getStripeSecretKey(resolvedMode)
  // Server client is used for Checkout/Billing orchestration only.
  // Raw card details must never be handled by this API.
  const stripeClient = new Stripe(secretKey, {
    typescript: true,
  })

  stripeClients.set(resolvedMode, stripeClient)
  return stripeClient
}
