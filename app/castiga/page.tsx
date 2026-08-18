import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import { Navigation } from "@/components/navigation"
import { PrizeWheelExperience } from "@/components/prize-wheel/prize-wheel-experience"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export const dynamic = "force-dynamic"

export const metadata: Metadata = generateMetadata("castiga")

export default function CastigaPage() {
  return (
    <div className="min-h-screen bg-[#f6f4ff]">
      <Navigation />
      <main className={`mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-16 pt-24 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}>
        <div className="w-full rounded-[32px] border border-[#e8e4ff] bg-white px-5 py-8 shadow-[0_24px_60px_-32px_rgba(92,71,214,0.45)] sm:px-10 sm:py-10">
          <PrizeWheelExperience />
        </div>
      </main>
    </div>
  )
}
