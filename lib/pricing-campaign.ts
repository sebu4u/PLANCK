import {
  getPremiumPriceRon,
  type PremiumBillingInterval,
} from "@/components/pricing/premium-pricing"
import {
  EARLYBIRD_YEARLY_RON,
  isEarlybirdActive,
} from "@/lib/landing-earlybird"
import {
  getLaunch20PriceRon,
  isLaunch20Active,
} from "@/lib/launch-20-discount"

export type PricingCampaignKind = "earlybird" | "launch20"

export function getCampaignPriceRon(
  interval: PremiumBillingInterval,
  now = new Date(),
): number {
  if (interval === "year" && isEarlybirdActive(now)) return EARLYBIRD_YEARLY_RON
  if ((interval === "week" || interval === "month") && isLaunch20Active(now)) {
    return getLaunch20PriceRon(getPremiumPriceRon(interval))
  }
  return getPremiumPriceRon(interval)
}

export function getPricingCampaign(
  interval: PremiumBillingInterval,
  now = new Date(),
): PricingCampaignKind | null {
  if (interval === "year" && isEarlybirdActive(now)) return "earlybird"
  if ((interval === "week" || interval === "month") && isLaunch20Active(now)) return "launch20"
  return null
}
