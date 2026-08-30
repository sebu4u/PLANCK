import type { Metadata } from "next"

import { Navigation } from "@/components/navigation"
import { ShopExperience } from "@/components/shop/shop-experience"
import { generateMetadata } from "@/lib/metadata"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export const metadata: Metadata = generateMetadata("shop")

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <Navigation />
      <main
        className={`mx-auto w-full max-w-5xl px-4 pb-16 pt-24 sm:px-6 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}
      >
        <ShopExperience />
      </main>
    </div>
  )
}
