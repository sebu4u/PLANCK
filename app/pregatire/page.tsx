import { Navigation } from "@/components/navigation"
import { PregatirePageClient } from "@/components/pregatire/pregatire-page-client"
import { CheckoutSuccessSync } from "@/components/pricing/checkout-success-sync"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { pageTitle } from "@/lib/metadata"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: pageTitle("Pregatire"),
  description:
    "Pregătiri live pe Mate, Fizică, Info, Biologie și Chimie — deblochează Meet-ul cu energie.",
}

export default function PregatirePage() {
  return (
    <>
      <Navigation />
      <main
        className={cn(
          "min-h-[100dvh] bg-[#fafafa] pt-14 burger:h-[100dvh] burger:min-h-0 burger:overflow-hidden burger:bg-white burger:pt-16",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
        )}
      >
        <Suspense fallback={null}>
          <CheckoutSuccessSync />
        </Suspense>
        <Suspense fallback={null}>
          <PregatirePageClient />
        </Suspense>
      </main>
    </>
  )
}
