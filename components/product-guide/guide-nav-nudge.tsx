"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { findGuideAnchorElement } from "@/lib/product-guide/dom"
import type { ProductGuideAnchorId } from "@/lib/product-guide/types"
import { MOBILE_BOTTOM_NAV_HEIGHT } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

type GuideNavNudgeProps = {
  anchorId: ProductGuideAnchorId
  title: string
  href: string
  onDismiss: () => void
}

type AnchorBox = {
  left: number
  width: number
}

export function GuideNavNudge({ anchorId, title, href, onDismiss }: GuideNavNudgeProps) {
  const [box, setBox] = useState<AnchorBox | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const measure = () => {
      const el = findGuideAnchorElement(anchorId)
      if (!el) {
        setBox(null)
        return
      }
      const r = el.getBoundingClientRect()
      setBox({ left: r.left, width: r.width })
    }

    measure()
    const frame = window.requestAnimationFrame(measure)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [anchorId])

  useEffect(() => {
    const el = findGuideAnchorElement(anchorId)
    if (!el) return

    const onAnchorClick = () => onDismiss()
    el.addEventListener("click", onAnchorClick)
    return () => el.removeEventListener("click", onAnchorClick)
  }, [anchorId, onDismiss, box])

  if (!mounted || !box) return null

  const cardWidth = 184
  const center = box.left + box.width / 2
  const minCenter = 12 + cardWidth / 2
  const maxCenter = window.innerWidth - 12 - cardWidth / 2
  const left = Math.min(maxCenter, Math.max(minCenter, center))
  const caretOffset = center - left

  return createPortal(
    <div
      className="pointer-events-none fixed z-[400] burger:hidden"
      style={{
        left,
        bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px) + 0.4rem)`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="pointer-events-auto origin-bottom animate-nudge-pop">
        <div className="animate-nudge-bounce">
          <div className="relative w-[11.5rem]">
            <Link
              href={href}
              onClick={onDismiss}
              className={cn(
                "block rounded-2xl border border-[#e8eaed] bg-white px-3.5 py-2.5 pr-7",
                "text-center text-[13px] font-semibold leading-snug text-[#111111]",
                "shadow-[0_10px_28px_rgba(0,0,0,0.16)]",
              )}
            >
              {title}
            </Link>
            <button
              type="button"
              aria-label="Închide"
              onClick={onDismiss}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-[#8a8a8a] active:bg-[#f3f3f3]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <span
              className="absolute top-full -mt-px h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-white drop-shadow-[0_2px_1px_rgba(0,0,0,0.06)]"
              style={{ left: `calc(50% + ${caretOffset}px)`, transform: "translateX(-50%)" }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
