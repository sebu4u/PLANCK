"use client"

import {
  PremiumBannerGradientLink,
  PremiumUpgradeBanner,
} from "@/components/premium-upgrade-banner"
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/mobile-app-nav"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

export function InvataPremiumUpgradeBanner() {
  const { isPaid } = useSubscriptionPlan()
  if (isPaid) return null

  return (
    <div className={cn("fixed inset-x-0 z-[299] burger:hidden", MOBILE_BOTTOM_NAV_OFFSET_CLASS)}>
      <PremiumUpgradeBanner
        defaultMessage={
          <>
            Treci la Premium și deblochează toate lecțiile.{" "}
            <PremiumBannerGradientLink>Go Premium</PremiumBannerGradientLink>
          </>
        }
        className="border-b-0 shadow-[0_-4px_16px_-12px_rgba(15,23,42,0.35)]"
      />
    </div>
  )
}
