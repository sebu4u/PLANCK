"use client"

import { PremiumUpgradeBanner } from "@/components/premium-upgrade-banner"
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/mobile-app-nav"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

const INVATA_UPGRADE_MESSAGE = (
  <>
    Treci la Premium și deblochează toate lecțiile.{" "}
    <span className="underline-offset-2 group-hover:underline">Go Premium →</span>
  </>
)

export function InvataPremiumUpgradeBanner() {
  const { isPaid } = useSubscriptionPlan()
  if (isPaid) return null

  return (
    <div className={cn("fixed inset-x-0 z-[299] burger:hidden", MOBILE_BOTTOM_NAV_OFFSET_CLASS)}>
      <PremiumUpgradeBanner defaultMessage={INVATA_UPGRADE_MESSAGE} className="border-b-0 shadow-[0_-4px_16px_-12px_rgba(15,23,42,0.35)]" />
    </div>
  )
}
