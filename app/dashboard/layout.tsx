import { ReactNode } from "react"
import type { Metadata } from "next"
import { pageTitle } from "@/lib/metadata"
import { OnboardingGuard } from "@/components/onboarding-guard"

export const metadata: Metadata = {
  title: pageTitle("Dashboard"),
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Fixed background to prevent white flash during navigation */}
      <div className="fixed inset-0 bg-[#ffffff] -z-10" />
      <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] md:h-auto md:min-h-screen md:overflow-visible">
        <OnboardingGuard>{children}</OnboardingGuard>
      </div>
    </>
  )
}

