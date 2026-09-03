import type { Metadata } from "next"
import { Suspense } from "react"
import { CheckoutSuccessSync } from "@/components/pricing/checkout-success-sync"
import { PremiumWelcomeExperience } from "@/components/premium/premium-welcome-experience"
import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Premium"),
  robots: {
    index: false,
    follow: false,
  },
}

export default function PremiumWelcomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <CheckoutSuccessSync silent />
      </Suspense>
      <PremiumWelcomeExperience />
    </>
  )
}
