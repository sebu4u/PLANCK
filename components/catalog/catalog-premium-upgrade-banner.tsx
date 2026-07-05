"use client"

import { PremiumUpgradeBanner } from "@/components/premium-upgrade-banner"

export function CatalogPremiumUpgradeBanner() {
  return (
    <PremiumUpgradeBanner
      defaultMessage={
        <>
          Treci la Premium și accesează Insight fără limite.{" "}
          <span className="underline-offset-2 group-hover:underline">Go Premium →</span>
        </>
      }
    />
  )
}
