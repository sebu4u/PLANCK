import { Navigation } from "@/components/navigation"
import { PregatirePageClient } from "@/components/pregatire/pregatire-page-client"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { pageTitle } from "@/lib/metadata"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

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
          "min-h-[100dvh] bg-[#fafafa] pt-14 burger:pt-16",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
        )}
      >
        <PregatirePageClient />
      </main>
    </>
  )
}
