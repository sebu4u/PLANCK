"use client"

import type { ReactNode } from "react"
import { useLayoutEffect } from "react"
import {
  MOBILE_BOTTOM_NAV_PADDING_CLASS,
  MOBILE_BOTTOM_NAV_UPGRADE_BANNER_PADDING_CLASS,
} from "@/lib/mobile-app-nav"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import {
  INVATA_HUB_MOBILE_HEADER_BG,
  INVATA_HUB_MOBILE_HEADER_Z,
  INVATA_HUB_MOBILE_SHEET_SHADOW,
  INVATA_HUB_MOBILE_SHEET_Z,
} from "@/components/invata/invata-hub-layout-constants"
import { cn } from "@/lib/utils"

export const INVATA_HUB_HEADER_CHARACTER_SRC = "/images/invata/header-character.png"

/** Landscape hero illustration (~1024×682). Sized by width for the mobile header. */
const CHARACTER_WIDTH = "27rem"
/** How far the image overlaps into the video card from the left. */
const VIDEO_OVERLAP = "10.5rem"

interface InvataMobileHubShellProps {
  top: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Mobile /invata layout: light header band (video + character) + white sheet with
 * rounded top and upward drop shadow. The whole page scrolls together.
 * The character sits behind the white card so only the upper half shows.
 */
export function InvataMobileHubShell({ top, children, className }: InvataMobileHubShellProps) {
  const { isPaid } = useSubscriptionPlan()

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const syncBodyBg = () => {
      document.body.style.backgroundColor = mq.matches ? INVATA_HUB_MOBILE_HEADER_BG : ""
    }
    syncBodyBg()
    mq.addEventListener("change", syncBodyBg)
    return () => {
      mq.removeEventListener("change", syncBodyBg)
      document.body.style.backgroundColor = ""
    }
  }, [])

  return (
    <div
      className={cn("min-h-screen", className)}
      style={{ backgroundColor: INVATA_HUB_MOBILE_HEADER_BG }}
    >
      {/*
        Header band must keep overflow visible so the illustration can extend
        above the top bar without being cropped. Do not set overflow-x here —
        a non-visible overflow-x forces overflow-y to clip as well.
        z-index is above the mobile top bar (INVATA_HUB_MOBILE_NAV_Z) and below
        the white sheet so only the top of the character peeks over the nav.
      */}
      <div
        className="relative flex items-center px-4 pt-2"
        style={{
          zIndex: INVATA_HUB_MOBILE_HEADER_Z,
          minHeight: `max(11.5rem, calc(${CHARACTER_WIDTH} * 682 / 1024 * 0.72))`,
          paddingBottom: "0.75rem",
        }}
      >
        {/* Image left, behind the video; paints above the navbar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={INVATA_HUB_HEADER_CHARACTER_SRC}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute bottom-0 z-[1] h-auto select-none object-contain object-bottom"
          style={{
            width: CHARACTER_WIDTH,
            left: `calc(45% - ${CHARACTER_WIDTH} + ${VIDEO_OVERLAP})`,
            transform: "translateY(12%)",
          }}
        />

        {/* Video + text on the right, above the image */}
        <div className="relative z-[3] ml-auto w-[55%] max-w-[220px]">{top}</div>
      </div>

      <div
        className={cn(
          "relative -mt-4 min-h-[70vh] overflow-x-clip rounded-t-[2.25rem] bg-white",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
          !isPaid && MOBILE_BOTTOM_NAV_UPGRADE_BANNER_PADDING_CLASS,
        )}
        style={{
          zIndex: INVATA_HUB_MOBILE_SHEET_Z,
          boxShadow: INVATA_HUB_MOBILE_SHEET_SHADOW,
        }}
      >
        {children}
      </div>
    </div>
  )
}
