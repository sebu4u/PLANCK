"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Aliniat cu `sticky top-28` (7rem); folosit ca prag pentru „lipit în partea de sus”. */
const STICKY_TOP_PX = 112

interface LockedLevelStickyCardProps {
  levelNumber: number
  blurredTitle: string
  outlineColor: string
  labelColorClass: string
}

export function LockedLevelStickyCard({
  levelNumber,
  blurredTitle,
  outlineColor,
  labelColorClass,
}: LockedLevelStickyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isPinned, setIsPinned] = useState(false)

  const updatePinned = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nearStickyTop =
      rect.top <= STICKY_TOP_PX + 1.5 && rect.top >= STICKY_TOP_PX - 2.5 && rect.bottom > STICKY_TOP_PX + 8
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
        "sticky top-28 z-10 mx-auto mb-6 w-full max-w-[min(100%,22rem)] rounded-2xl border-t-[3px] border-l-[3px] border-r-[3px] border-b-[6px] bg-white px-4 py-3 text-center transition-[color,border-color] duration-200 sm:max-w-[min(100%,28rem)] sm:px-6 sm:py-3.5",
        isPinned ? "" : "border-[#c4c4c4]"
      )}
      style={isPinned ? { borderColor: outlineColor } : undefined}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 sm:text-xs",
          isPinned ? labelColorClass : "text-[#9ca3af]"
        )}
      >
        Nivel {levelNumber}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold transition-[color,filter] duration-200",
          isPinned ? "text-[#4b5563]" : "blur-[3px] text-[#9ca3af]"
        )}
      >
        {blurredTitle}
      </p>
    </div>
  )
}
