"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Problem } from "@/data/problems"
import { ProblemAnswerCard } from "@/components/problems/problem-answer-card"
import { Input } from "@/components/ui/input"

const SWIPE_THRESHOLD = 40
const DRAG_SNAP_THRESHOLD = 0.25 // 25% of max expand to snap
const EXPANDED_MAX_VH = 70

function NoAnswerCardMobile() {
  return (
    <div className="flex flex-col gap-4 rounded-t-3xl bg-white/90 p-6 text-center">
      <div className="text-4xl">🛠️</div>
      <h2 className="text-lg font-semibold text-[#0b0d10]">Ups, ne-ai prins de data asta!</h2>
      <p className="text-sm text-[#2C2F33]/70">
        Încă lucrăm la rezolvarea acestei probleme. Revino curând sau explorează alte probleme din catalog.
      </p>
    </div>
  )
}

interface ProblemAnswerBottomSheetProps {
  problem: Problem
  hasAnswerCard: boolean
  isSolved: boolean
  onCanMarkSolvedChange: (v: boolean) => void
  onSolvedCorrectly: () => void
  /** Opens AI chat and sends the problem statement so the model starts answering (Hint). */
  onOpenHint?: () => void
  /** Opens AI chat sidebar (for mobile chat button above drawer). */
  onOpenChat?: () => void
}

const CHAT_BUTTON_GAP = 16

export function ProblemAnswerBottomSheet({
  problem,
  hasAnswerCard,
  isSolved,
  onCanMarkSolvedChange,
  onSolvedCorrectly,
  onOpenHint,
  onOpenChat,
}: ProblemAnswerBottomSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0) // px, negative = drag up, positive = drag down
  const handleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number>(0)
  const touchStartedOnContent = useRef(false)
  const [drawerHeight, setDrawerHeight] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Measure drawer height for chat button positioning (constant distance from top of drawer)
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDrawerHeight(entry.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [mounted])

  useEffect(() => {
    if (expanded) return

    const intervalId = window.setInterval(() => {
      setIsBouncing(true)
      window.setTimeout(() => setIsBouncing(false), 280)
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
      setIsBouncing(false)
    }
  }, [expanded])

  const collapse = useCallback(() => {
    setExpanded(false)
    setDragOffset(0)
  }, [])
  const expand = useCallback(() => {
    setExpanded(true)
    setDragOffset(0)
  }, [])

  // Get max expand height in px for drag calculations
  const getMaxExpandPx = useCallback(() => {
    if (typeof window === "undefined") return 400
    return (window.innerHeight * EXPANDED_MAX_VH) / 100
  }, [])

  // Touch handlers for entire drawer - prevents page scroll, enables drag-to-expand
  const onDrawerTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
      touchStartedOnContent.current = contentRef.current?.contains(e.target as Node) ?? false
    },
    []
  )

  const onDrawerTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return
      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStartY.current

      // When expanded and touch started on content: allow content scroll unless at top and dragging down
      if (expanded && touchStartedOnContent.current && contentRef.current) {
        const { scrollTop } = contentRef.current
        if (scrollTop > 0 && deltaY > 0) {
          // Scrolling down inside content - let it scroll
          return
        }
        if (scrollTop > 0 && deltaY < 0) {
          // Scrolling up inside content - let it scroll
          return
        }
        // At top (scrollTop <= 0): dragging down collapses
        if (scrollTop <= 0 && deltaY > 0) {
          e.preventDefault()
          setDragOffset(deltaY)
          return
        }
      }

      // Drawer bar or content when at top: capture drag
      e.preventDefault()
      const maxPx = getMaxExpandPx()
      if (expanded) {
        setDragOffset(Math.min(deltaY, maxPx))
      } else {
        setDragOffset(Math.max(deltaY, -maxPx))
      }
    },
    [expanded, getMaxExpandPx]
  )

  const onDrawerTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return
      const deltaY = e.changedTouches[0].clientY - touchStartY.current
      const elapsed = Date.now() - touchStartTime.current
      const velocity = Math.abs(deltaY) / Math.max(elapsed, 1)
      const maxPx = getMaxExpandPx()
      const progress = expanded ? 1 - Math.min(deltaY / maxPx, 1) : Math.min(-deltaY / maxPx, 1)

      if (expanded) {
        if (progress < 1 - DRAG_SNAP_THRESHOLD || deltaY > SWIPE_THRESHOLD || (deltaY > 10 && velocity > 0.3)) {
          collapse()
        } else {
          setDragOffset(0)
        }
      } else {
        if (progress > DRAG_SNAP_THRESHOLD || deltaY < -SWIPE_THRESHOLD || (deltaY < -10 && velocity > 0.3)) {
          expand()
        } else {
          setDragOffset(0)
        }
      }
      touchStartY.current = null
      touchStartedOnContent.current = false
    },
    [expanded, collapse, expand, getMaxExpandPx]
  )

  const onHandleTap = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  // Keyboard: scroll input into view when focused inside the sheet
  useEffect(() => {
    if (!expanded) return
    const container = contentRef.current
    if (!container) return

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || !container.contains(target)) return
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "nearest", behavior: "smooth" })
      })
    }

    container.addEventListener("focusin", handleFocusIn)
    return () => container.removeEventListener("focusin", handleFocusIn)
  }, [expanded])

  // Adjust for virtual keyboard via visualViewport
  useEffect(() => {
    if (!expanded) return
    const vv = window.visualViewport
    if (!vv) return

    const onResize = () => {
      const container = contentRef.current
      if (!container) return
      const focused = container.querySelector(":focus") as HTMLElement | null
      if (focused) {
        requestAnimationFrame(() => {
          focused.scrollIntoView({ block: "nearest", behavior: "smooth" })
        })
      }
    }

    vv.addEventListener("resize", onResize)
    return () => vv.removeEventListener("resize", onResize)
  }, [expanded])

  // Content scroll is contained via overscroll-behavior; page scroll prevented only when we handle drag

  if (!mounted) return null

  const maxExpandPx = getMaxExpandPx()
  const isDragging = dragOffset !== 0
  const contentHeight = (() => {
    if (expanded) {
      return Math.max(0, maxExpandPx - Math.min(dragOffset, maxExpandPx))
    }
    return Math.min(-dragOffset, maxExpandPx)
  })()

  const sheet = (
    <div
      ref={sheetRef}
      onTouchStart={onDrawerTouchStart}
      onTouchMove={onDrawerTouchMove}
      onTouchEnd={onDrawerTouchEnd}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[90] flex flex-col transition-all duration-300 ease-out",
        !isDragging && !expanded && "transition-transform duration-300 ease-out",
        !expanded && isBouncing && !isDragging && "-translate-y-1"
      )}
    >
      {/* Handle / collapsed header - touch-action: none prevents page scroll when dragging on bar */}
      <div
        ref={handleRef}
        onClick={onHandleTap}
        className="relative flex-shrink-0 cursor-pointer select-none rounded-t-2xl border-t border-x border-[#0b0d10]/10 bg-[#F8F8F8] shadow-[0_-8px_30px_-12px_rgba(11,13,16,0.25)]"
        style={{ touchAction: "none" }}
        role="button"
        tabIndex={0}
        aria-label={expanded ? "Închide formularul de răspuns" : "Deschide formularul de răspuns"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onHandleTap()
          }
        }}
      >
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-[#0b0d10]/20" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2">
          <span className="text-sm font-semibold text-[#0b0d10]">
            {hasAnswerCard ? "Introdu răspunsul" : "Răspuns"}
          </span>
          <ChevronUp
            className={cn(
              "h-5 w-5 text-[#2C2F33]/60 transition-transform duration-300",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {!expanded && hasAnswerCard && (
        <div className="border-x border-[#0b0d10]/10 bg-[#F8F8F8] px-5 pb-3" style={{ touchAction: "none" }}>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Scrie răspunsul..."
            className="h-10 bg-white text-sm"
            onFocus={expand}
            onClick={(e) => {
              e.stopPropagation()
              expand()
            }}
            readOnly
          />
        </div>
      )}

      {/* Extended content - drag-follow: height responds to finger during drag */}
      <div
        ref={contentRef}
        className={cn(
          "overflow-y-auto overscroll-contain bg-[#F8F8F8] border-x border-[#0b0d10]/10 px-4 pb-[env(safe-area-inset-bottom,16px)]",
          !isDragging && "transition-[max-height,opacity] duration-300 ease-out",
          !isDragging && !expanded && "pointer-events-none overflow-hidden opacity-0"
        )}
        style={{
          maxHeight: isDragging ? `${contentHeight}px` : expanded ? `${maxExpandPx}px` : 0,
          opacity: contentHeight > 0 ? 1 : 0,
        }}
      >
        <div className="pb-6 pt-1">
          {hasAnswerCard ? (
            <ProblemAnswerCard
              problem={problem}
              onCanMarkSolvedChange={onCanMarkSolvedChange}
              onSolvedCorrectly={onSolvedCorrectly}
              isSolved={isSolved}
              showHintButton={!!onOpenHint}
              onHintClick={onOpenHint}
            />
          ) : (
            <NoAnswerCardMobile />
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(
    <>
      {onOpenChat && (
        <button
          onClick={onOpenChat}
          className="fixed z-[91] rounded-2xl w-14 h-14 p-0 shadow-2xl bg-[#252525] hover:bg-[#2a2a2a] border border-white/20 transition-all duration-300 hover:scale-105 flex items-center justify-center right-4"
          style={{
            bottom: (drawerHeight || 120) + CHAT_BUTTON_GAP,
            transition: "bottom 300ms ease-out",
          }}
          aria-label="Deschide asistent AI"
        >
          <Sparkles className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
        </button>
      )}
      {sheet}
    </>,
    document.body
  )
}
