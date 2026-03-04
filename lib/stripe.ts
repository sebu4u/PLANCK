import "server-only"

import Stripe from "stripe"

import { getStripeSecretKey } from "@/lib/stripe-config"

let stripeClient: Stripe | null = null

export const getStripeClient = () => {
  if (stripeClient) return stripeClient
  const secretKey = getStripeSecretKey()
  // Server client is used for Checkout/Billing orchestration only.
  // Raw card details must never be handled by this API.
  stripeClient = new Stripe(secretKey, {
    typescript: true,
  })
  return stripeClient
}
