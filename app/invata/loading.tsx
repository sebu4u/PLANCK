import { Navigation } from "@/components/navigation"
import { InvataPageSkeleton } from "@/components/invata/invata-page-skeleton"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export default function InvataLoading() {
  return (
    <>
      <Navigation />
      <main
        className={`min-h-screen bg-[#ffffff] max-sm:pt-[calc(5.875rem+3rem)] pt-16 burger:pt-28 burger:pb-10 sm:pt-16 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}
      >
        <InvataPageSkeleton />
      </main>
    </>
  )
}
