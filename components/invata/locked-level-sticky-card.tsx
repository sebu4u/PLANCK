"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Prag sticky: sub top bar mobil (4rem) / sub navbar desktop (7rem). */
const STICKY_TOP_MOBILE_PX = 64
const STICKY_TOP_DESKTOP_PX = 112

function getStickyTopPx() {
  if (typeof window === "undefined") return STICKY_TOP_MOBILE_PX
  return window.matchMedia("(min-width: 948px)").matches ? STICKY_TOP_DESKTOP_PX : STICKY_TOP_MOBILE_PX
}

interface LockedLevelStickyCardProps {
  levelNumber: number
  blurredTitle: string
  outlineColor: string
  labelColorClass: string
  /** Când false (itemii sunt disponibili), titlul nivelului rămâne lizibil. */
  isLocked?: boolean
  /** Păstrează culorile nivelului chiar și când cardul nu e sticky/focus. */
  isColored?: boolean
}

export function LockedLevelStickyCard({
  levelNumber,
  blurredTitle,
  outlineColor,
  labelColorClass,
  isLocked = true,
  isColored = false,
}: LockedLevelStickyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isPinned, setIsPinned] = useState(false)
  const showTheme = isPinned || isColored

  const updatePinned = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    const stickyTopPx = getStickyTopPx()
    const rect = el.getBoundingClientRect()
    const nearStickyTop =
      rect.top <= stickyTopPx + 1.5 && rect.top >= stickyTopPx - 2.5 && rect.bottom > stickyTopPx + 8
    setIsPinned(nearStickyTop)
  }, [])

  useEffect(() => {
    updatePinned()
    window.addEventListener("scroll", updatePinned, { passive: true })
    window.addEventListener("resize", updatePinned)
    return () => {
      window.removeEventListener("scroll", updatePinned)
      window.removeEventListener("resize", updatePinned)
    }
  }, [updatePinned])

  return (
    <div
      ref={cardRef}
      className={cn(
        "sticky top-16 z-10 mx-auto mb-6 w-full max-w-[min(100%,22rem)] rounded-2xl border-t-[3px] border-l-[3px] border-r-[3px] border-b-[6px] bg-white px-4 py-3 text-center transition-[color,border-color] duration-200 burger:top-28 sm:max-w-[min(100%,28rem)] sm:px-6 sm:py-3.5",
        showTheme ? "" : "border-[#c4c4c4]"
      )}
      style={showTheme ? { borderColor: outlineColor } : undefined}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 sm:text-xs",
          showTheme ? labelColorClass : "text-[#9ca3af]"
        )}
      >
        Nivel {levelNumber}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold transition-[color,filter] duration-200",
          isLocked && !showTheme ? "blur-[3px] text-[#9ca3af]" : "text-[#4b5563]"
        )}
      >
        {blurredTitle}
      </p>
    </div>
  )
}
