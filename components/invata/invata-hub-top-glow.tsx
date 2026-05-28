"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/** Height of the mobile /invata hub path nav row (must match navigation.tsx). */
export const INVATA_HUB_MOBILE_NAV_HEIGHT = "5.875rem"

/**
 * Stacking on mobile /invata hub (navbar wrapper stays z-[300]):
 * chapter image (2) < glow (280) < lesson cards / titles (290) < top bar (300)
 */
export const INVATA_HUB_TOP_GLOW_Z = 280
export const INVATA_HUB_CHAPTER_IMAGE_Z = 2
export const INVATA_HUB_LESSON_CARDS_Z = 290

/**
 * Fixed blue glow under the hub top bar on mobile. Portaled to document.body so it
 * reliably paints above chapter icons; lesson cards use a higher z-index.
 */
export function InvataHubTopGlow() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
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
    </div>,
    document.body
  )
}
