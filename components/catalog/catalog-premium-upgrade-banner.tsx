"use client"

import {
  PremiumBannerGradientLink,
  PremiumUpgradeBanner,
} from "@/components/premium-upgrade-banner"

export function CatalogPremiumUpgradeBanner() {
  return (
    <PremiumUpgradeBanner
      defaultMessage={
        <>
          Treci la Premium și accesează Insight fără limite.{" "}
          <PremiumBannerGradientLink>Go Premium</PremiumBannerGradientLink>
        </>
      }
    />
  )
}
