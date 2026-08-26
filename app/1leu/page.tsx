import { Metadata } from "next"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { Landing1LeuPageContent } from "@/components/landing-1leu/page-content"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata("1leu")

export default function Landing1LeuPage() {
  return (
    <ScrollAnimationProvider enableSmoothScroll={false}>
      <Landing1LeuPageContent />
    </ScrollAnimationProvider>
  )
}
