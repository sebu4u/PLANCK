"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { GuideTip } from "@/components/product-guide/guide-tip"
import { findGuideAnchorElement } from "@/lib/product-guide/dom"
import type { ProductGuideAnchorId } from "@/lib/product-guide/types"

type GuideSpotlightProps = {
  anchorId: ProductGuideAnchorId
  title: string
  body: string
  onDismiss: () => void
}

type AnchorRect = {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 8

export function GuideSpotlight({ anchorId, title, body, onDismiss }: GuideSpotlightProps) {
  const [rect, setRect] = useState<AnchorRect | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let frame = 0

    const measure = () => {
      const el = findGuideAnchorElement(anchorId)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      })
    }

    measure()
    frame = window.requestAnimationFrame(measure)

    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [anchorId])

  if (!mounted) return null

  const holeStyle = rect
    ? {
        top: Math.max(4, rect.top),
        left: Math.max(4, rect.left),
        width: rect.width,
        height: rect.height,
      }
    : null

  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800
  const tipBelow = rect ? rect.top + rect.height + 14 : null
  const placeBelow = tipBelow != null && tipBelow < viewportH - 210

  return createPortal(
    <div className="fixed inset-0 z-[520]" role="presentation">
      {holeStyle ? (
        <div
          className="pointer-events-none absolute z-0 rounded-2xl ring-2 ring-white shadow-[0_0_0_9999px_rgba(0,0,0,0.48)] animate-in fade-in duration-200"
          style={holeStyle}
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-black/45 animate-in fade-in duration-200" aria-hidden />
      )}

      <div
        className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4 burger:px-6"
        style={
          placeBelow && tipBelow != null
            ? { top: tipBelow }
            : { bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px) + 12px)" }
        }
      >
        <div className="pointer-events-auto w-full max-w-[360px] burger:mb-6">
          <GuideTip title={title} body={body} onDismiss={onDismiss} withSpotlight />
        </div>
      </div>
    </div>,
    document.body,
  )
}
