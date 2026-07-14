import { Metadata } from "next"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { LandingPageContent } from "@/components/landing-page-content"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Ofertă specială – înveți cu AI"),
  description:
    "Cursuri complete pe toate materiile de liceu, 1000+ probleme rezolvate video și un traseu personalizat creat de Insight. Preț redus până pe 1 august.",
}

export default function LandingPage() {
  return (
    <ScrollAnimationProvider enableSmoothScroll={false}>
      <LandingPageContent />
    </ScrollAnimationProvider>
  )
}
