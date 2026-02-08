import "server-only"

import Stripe from "stripe"

import { getStripeConfig } from "@/lib/stripe-config"

let stripeClient: Stripe | null = null

export const getStripeClient = () => {
  if (stripeClient) return stripeClient
  const { secretKey } = getStripeConfig()
  stripeClient = new Stripe(secretKey, {
    typescript: true,
  })
  return stripeClient
}
