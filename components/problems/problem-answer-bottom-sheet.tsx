"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Problem } from "@/data/problems"
import { ProblemAnswerCard } from "@/components/problems/problem-answer-card"
import { Input } from "@/components/ui/input"

const SWIPE_THRESHOLD = 40

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
}

export function ProblemAnswerBottomSheet({
  problem,
  hasAnswerCard,
  isSolved,
  onCanMarkSolvedChange,
  onSolvedCorrectly,
  onOpenHint,
}: ProblemAnswerBottomSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const handleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const collapse = useCallback(() => setExpanded(false), [])
  const expand = useCallback(() => setExpanded(true), [])

  // Swipe gesture on handle
  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }, [])

  const onHandleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return
      const deltaY = e.changedTouches[0].clientY - touchStartY.current
      const elapsed = Date.now() - touchStartTime.current
      const velocity = Math.abs(deltaY) / Math.max(elapsed, 1)

      if (expanded) {
        if (deltaY > SWIPE_THRESHOLD || (deltaY > 10 && velocity > 0.3)) {
          collapse()
        }
      } else {
        if (deltaY < -SWIPE_THRESHOLD || (deltaY < -10 && velocity > 0.3)) {
          expand()
        }
      }
      touchStartY.current = null
    },
    [expanded, collapse, expand]
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

  // Prevent body scroll propagation from sheet content
  useEffect(() => {
    if (!expanded) return
    const container = contentRef.current
    if (!container) return

    const preventBodyScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (container.contains(target)) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const deltaY = e.touches[0].clientY - (touchStartY.current ?? e.touches[0].clientY)
        const atTop = scrollTop <= 0 && deltaY > 0
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY < 0
        if (atTop || atBottom) {
          e.preventDefault()
        }
      }
    }

    container.addEventListener("touchmove", preventBodyScroll, { passive: false })
    return () => container.removeEventListener("touchmove", preventBodyScroll)
  }, [expanded])

  if (!mounted) return null

  const sheet = (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[90] flex flex-col transition-all duration-300 ease-out",
        !expanded && "transition-transform duration-300 ease-out",
        !expanded && isBouncing && "-translate-y-1"
      )}
    >
      {/* Handle / collapsed header */}
      <div
        ref={handleRef}
        onTouchStart={onHandleTouchStart}
        onTouchEnd={onHandleTouchEnd}
        onClick={onHandleTap}
        className="relative flex-shrink-0 cursor-pointer select-none rounded-t-2xl border-t border-x border-[#0b0d10]/10 bg-[#F8F8F8] shadow-[0_-8px_30px_-12px_rgba(11,13,16,0.25)]"
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
        <div className="border-x border-[#0b0d10]/10 bg-[#F8F8F8] px-5 pb-3">
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

      {/* Extended content */}
      <div
        ref={contentRef}
        className={cn(
          "overflow-y-auto overscroll-contain bg-[#F8F8F8] border-x border-[#0b0d10]/10 px-4 pb-[env(safe-area-inset-bottom,16px)]",
          "transition-[max-height,opacity] duration-300 ease-out",
          expanded
            ? "max-h-[70vh] opacity-100"
            : "pointer-events-none max-h-0 overflow-hidden opacity-0"
        )}
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

  return createPortal(sheet, document.body)
}
