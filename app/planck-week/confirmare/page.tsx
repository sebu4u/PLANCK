import { Suspense } from "react"
import { Metadata } from "next"
import { PlanckWeekConfirmClient } from "@/components/planck-week/confirm-client"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata("planck-week-confirmare")

export default function PlanckWeekConfirmPage() {
  return (
    <Suspense fallback={null}>
      <PlanckWeekConfirmClient />
    </Suspense>
  )
}
