import { Metadata } from "next"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { PlanckWeekPage } from "@/components/planck-week/planck-week-page"
import { generateMetadata } from "@/lib/metadata"

export const revalidate = 3600

export const metadata: Metadata = generateMetadata("planck-week")

export default function PlanckWeekRoute() {
  return (
    <ScrollAnimationProvider enableSmoothScroll={false}>
      <PlanckWeekPage />
    </ScrollAnimationProvider>
  )
}
