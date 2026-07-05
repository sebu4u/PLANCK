"use client"

import { CatalogPremiumUpgradeBanner } from "@/components/catalog/catalog-premium-upgrade-banner"
import { ProblemsPwaInstallBanner } from "@/components/problems-pwa-install-banner"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"

/** Mobile banner sub topbar: upgrade pentru free, instalare app pentru plus/premium. */
export function CatalogMobileTopBanner() {
  const { isPaid } = useSubscriptionPlan()

  if (isPaid) {
    return <ProblemsPwaInstallBanner />
  }

  return <CatalogPremiumUpgradeBanner />
}
