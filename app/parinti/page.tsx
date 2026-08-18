import { Metadata } from "next"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { LandingParintiPageContent } from "@/components/landing-parinti-page-content"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Pentru părinți — economisește la meditații, salvează nota la BAC"),
  description:
    "Un an de PLANCK Premium la 799 RON, nu 100–150 RON/oră la meditații private. Pregătiri zilnice, simulări BAC și progres vizibil pentru copilul tău. Creează cont de părinte.",
}

export default function ParintiLandingPage() {
  return (
    <ScrollAnimationProvider enableSmoothScroll={false}>
      <LandingParintiPageContent />
    </ScrollAnimationProvider>
  )
}
