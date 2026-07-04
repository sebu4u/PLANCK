import {
  INVATA_HUB_MOBILE_NAV_HEIGHT,
  INVATA_HUB_TOP_GLOW_Z,
} from "@/components/invata/invata-hub-layout-constants"

/**
 * Fixed blue glow under the hub top bar on mobile. Lesson cards use a higher
 * z-index while the navbar remains above both.
 */
export function InvataHubTopGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 hidden max-sm:block"
      style={{
        top: INVATA_HUB_MOBILE_NAV_HEIGHT,
        height: "5rem",
        zIndex: INVATA_HUB_TOP_GLOW_Z,
      }}
    >
      <div
        className="h-full w-full"
        style={{
          background: [
            "radial-gradient(ellipse 90% 85% at 50% 0%, rgba(147, 197, 253, 0.22) 0%, rgba(191, 219, 254, 0.1) 38%, transparent 68%)",
            "linear-gradient(to bottom, rgba(219, 234, 254, 0.35) 0%, transparent 100%)",
          ].join(", "),
        }}
      />
    </div>
  )
}
