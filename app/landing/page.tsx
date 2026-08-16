import { Metadata } from "next"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { LandingPageContent } from "@/components/landing-page-content"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Earlybird Premium — 799 RON/an până pe 7 septembrie"),
  description:
    "1 an de Planck Premium la 799 RON — ofertă earlybird până pe 7 septembrie. Trasee complete, Insight AI, pregătiri live și PlanckPass. Începe gratuit.",
}

export default function LandingPage() {
  return (
    <ScrollAnimationProvider enableSmoothScroll={false}>
      <LandingPageContent />
    </ScrollAnimationProvider>
  )
}
