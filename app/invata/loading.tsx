import { Navigation } from "@/components/navigation"
import { InvataPageSkeleton } from "@/components/invata/invata-page-skeleton"
import {
  INVATA_HUB_MOBILE_HEADER_BG,
  INVATA_HUB_MOBILE_SHEET_SHADOW,
} from "@/components/invata/invata-hub-layout-constants"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export default function InvataLoading() {
  return (
    <>
      <Navigation />
      <div
        className={`min-h-screen sm:hidden ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}
        style={{ backgroundColor: INVATA_HUB_MOBILE_HEADER_BG }}
      >
        <div
          className="relative flex items-center px-4 pt-2"
          style={{ minHeight: "max(11.5rem, calc(27rem * 682 / 1024 * 0.72))", paddingBottom: "0.75rem" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/invata/header-character.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-0 z-[1] h-auto select-none object-contain object-bottom"
            style={{
              width: "27rem",
              left: "calc(45% - 27rem + 10.5rem)",
              transform: "translateY(12%)",
            }}
          />
          <div className="relative z-[3] ml-auto w-[55%] max-w-[220px]">
            <div className="aspect-video w-full animate-pulse rounded-2xl bg-black/10 ring-1 ring-black/10" />
          </div>
        </div>
        <div
          className="relative z-10 -mt-4 min-h-[70vh] overflow-x-clip rounded-t-[2.25rem] bg-white"
          style={{ boxShadow: INVATA_HUB_MOBILE_SHEET_SHADOW }}
        >
          <div className="px-5 pt-5">
            <InvataPageSkeleton />
          </div>
        </div>
      </div>
      <main
        className={`hidden min-h-screen bg-[#ffffff] pt-16 burger:pt-28 burger:pb-10 sm:block ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}
      >
        <InvataPageSkeleton />
      </main>
    </>
  )
}
