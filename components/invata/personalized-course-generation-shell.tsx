"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Check, Loader2, X } from "lucide-react"
import { usePersonalizedCourseGeneration } from "@/components/invata/personalized-course-generation-context"
import { LoadingVideo } from "@/components/loading-video-overlay"
import { buildGenerationMessageCycle } from "@/lib/personalized-courses/generation-stage-messages"
import { MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

const INTRO_MESSAGES = [
  (topicLabel: string) => `Îți voi crea un traseu complet de învățare pentru ${topicLabel}`,
  () => "Procesul va dura câteva minute",
  () => "Te voi notifica când este gata",
  () => "Explorează liniștit platforma până atunci",
] as const

const IRIS_ANIMATION_MS = 720
const WORD_STAGGER_MS = 80
const WORD_FADE_MS = 420
const MESSAGE_HOLD_MS = 1400
const MESSAGE_FADE_MS = 260
const VIDEO_CENTER_HOLD_MS = 1000
const VIDEO_TO_CORNER_MS = 650
const TOOLTIP_LINE_HOLD_MS = 2000
const TOOLTIP_LINE_CHECK_MS = 450

type IrisBackdropPhase = "opening" | "open" | "closing" | "closed"

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

function WordByWordText({
  text,
  active,
  onComplete,
}: {
  text: string
  active: boolean
  onComplete: () => void
}) {
  const words = useMemo(() => splitWords(text), [text])
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    if (!active || words.length === 0) return

    const total = (words.length - 1) * WORD_STAGGER_MS + WORD_FADE_MS
    const timer = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete()
      }
    }, total)

    return () => window.clearTimeout(timer)
  }, [active, onComplete, text, words.length])

  if (!words.length) return null

  return (
    <p className="max-w-2xl text-center text-[1.75rem] font-bold leading-tight text-[#111111] sm:text-4xl">
      {words.map((word, wordIndex) => (
        <span
          key={`${text}-${wordIndex}`}
          className="inline-block opacity-0"
          style={{
            animation: `generation-word-fade ${WORD_FADE_MS}ms ease-out forwards`,
            animationDelay: `${wordIndex * WORD_STAGGER_MS}ms`,
          }}
        >
          {word}
          {wordIndex < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </p>
  )
}

function GenerationProgressBar({
  percent,
  trailing,
}: {
  percent: number
  trailing?: ReactNode
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const displayPercent = clamped > 0 ? clamped : 4

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#ece8f5]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
        >
          <div
            className="pc-progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${displayPercent}%` }}
          />
        </div>
        {trailing}
      </div>
      <p className="mt-1.5 text-xs font-medium tabular-nums text-[#6d6d6d]">{clamped}%</p>
    </div>
  )
}

function GenerationTooltipStatusLine({
  message,
  active,
  onComplete,
}: {
  message: string
  active: boolean
  onComplete: () => void
}) {
  const [iconPhase, setIconPhase] = useState<"spinner" | "check">("spinner")

  useEffect(() => {
    setIconPhase("spinner")
    if (!active) return

    const checkTimer = window.setTimeout(() => {
      setIconPhase("check")
    }, TOOLTIP_LINE_HOLD_MS)

    const advanceTimer = window.setTimeout(() => {
      onComplete()
    }, TOOLTIP_LINE_HOLD_MS + TOOLTIP_LINE_CHECK_MS)

    return () => {
      window.clearTimeout(checkTimer)
      window.clearTimeout(advanceTimer)
    }
  }, [message, active, onComplete])

  return (
    <div className="generation-status-line-pop mt-1.5 flex items-start gap-2.5">
      <div className="relative mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
        <Loader2
          className={cn(
            "absolute inset-0 h-4 w-4 animate-spin text-[#9a9a9a] [animation-duration:1.6s] transition-opacity duration-200",
            iconPhase === "spinner" ? "opacity-100" : "opacity-0",
          )}
        />
        <Check
          className={cn(
            "absolute inset-0 h-4 w-4 text-[#16a34a]",
            iconPhase === "check" ? "generation-status-check-pop opacity-100" : "opacity-0 scale-75",
          )}
        />
      </div>
      <p className="min-w-0 flex-1 text-sm leading-snug text-[#333]">{message}</p>
    </div>
  )
}

function PersonalizedCourseGenerationFloatingUI() {
  const { activeGeneration, advanceOverlayPhase, cancelActiveGeneration } = usePersonalizedCourseGeneration()
  const [irisBackdrop, setIrisBackdrop] = useState<IrisBackdropPhase>("closed")
  const [messageIndex, setMessageIndex] = useState(0)
  const [messageActive, setMessageActive] = useState(false)
  const [messageFadingOut, setMessageFadingOut] = useState(false)
  const [videoAnimatingToCorner, setVideoAnimatingToCorner] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [tooltipLineIndex, setTooltipLineIndex] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false)
  const messageAdvanceTimeoutRef = useRef(0)

  const phase = activeGeneration?.overlayPhase
  const topicLabel = activeGeneration?.topicLabel ?? "acest subiect"
  const progress = activeGeneration?.progress

  const messageCycle = useMemo(
    () => buildGenerationMessageCycle(progress?.stage ?? null, progress?.message ?? null),
    [progress?.message, progress?.stage],
  )

  const showBackdrop = irisBackdrop !== "closed"
  const showIntroContent = phase === "intro" && irisBackdrop === "open"
  const showCenterVideo = phase === "videoCenter" && showBackdrop
  const showCornerWidget = phase === "corner"

  const currentMessage = INTRO_MESSAGES[messageIndex]?.(topicLabel) ?? ""
  const tooltipMessages = messageCycle.length > 0 ? messageCycle : ["Generare în curs…"]
  const currentTooltipMessage = tooltipMessages[tooltipLineIndex % tooltipMessages.length] ?? "Generare în curs…"
  const progressPercent = progress?.percent ?? 0

  const advanceTooltipLine = useCallback(() => {
    setTooltipLineIndex((index) => (index + 1) % Math.max(1, tooltipMessages.length))
  }, [tooltipMessages.length])

  const handleCancelGeneration = useCallback(async () => {
    if (isCancelling) return
    setIsCancelling(true)
    try {
      await cancelActiveGeneration()
    } finally {
      setIsCancelling(false)
      setTooltipOpen(false)
    }
  }, [cancelActiveGeneration, isCancelling])

  useEffect(() => {
    setTooltipLineIndex(0)
  }, [messageCycle])

  useEffect(() => {
    if (phase !== "corner") {
      setTooltipOpen(false)
      return
    }

    setIrisBackdrop("closed")
  }, [phase])

  useEffect(() => {
    if (phase !== "intro") return
    setIrisBackdrop("opening")
    setMessageIndex(0)
    setMessageActive(false)
    setMessageFadingOut(false)

    const openTimer = window.setTimeout(() => {
      setIrisBackdrop("open")
      setMessageActive(true)
    }, IRIS_ANIMATION_MS)

    return () => window.clearTimeout(openTimer)
  }, [phase])

  const advanceToNextMessage = useCallback(() => {
    window.clearTimeout(messageAdvanceTimeoutRef.current)
    setMessageFadingOut(true)

    messageAdvanceTimeoutRef.current = window.setTimeout(() => {
      setMessageFadingOut(false)
      if (messageIndex < INTRO_MESSAGES.length - 1) {
        setMessageIndex((current) => current + 1)
        setMessageActive(true)
      } else {
        setMessageActive(false)
        advanceOverlayPhase("videoCenter")
      }
    }, MESSAGE_FADE_MS)
  }, [advanceOverlayPhase, messageIndex])

  const handleMessageComplete = useCallback(() => {
    window.clearTimeout(messageAdvanceTimeoutRef.current)
    messageAdvanceTimeoutRef.current = window.setTimeout(() => {
      advanceToNextMessage()
    }, MESSAGE_HOLD_MS)
  }, [advanceToNextMessage])

  useEffect(() => {
    return () => window.clearTimeout(messageAdvanceTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (phase !== "videoCenter") {
      setVideoAnimatingToCorner(false)
      return
    }

    let cancelled = false
    let cornerTimer = 0

    const holdTimer = window.setTimeout(() => {
      if (cancelled) return
      setVideoAnimatingToCorner(true)

      cornerTimer = window.setTimeout(() => {
        if (cancelled) return
        advanceOverlayPhase("corner")
      }, VIDEO_TO_CORNER_MS)
    }, VIDEO_CENTER_HOLD_MS)

    return () => {
      cancelled = true
      window.clearTimeout(holdTimer)
      window.clearTimeout(cornerTimer)
    }
  }, [phase, advanceOverlayPhase])

  if (!activeGeneration) return null

  return (
    <>
      {showBackdrop ? (
        <div
          className={cn(
            "generation-cinematic-backdrop pointer-events-auto fixed inset-0 z-[1190]",
            irisBackdrop === "opening" && "generation-iris-open",
            irisBackdrop === "open" && "generation-cinematic-backdrop-open",
            irisBackdrop === "closing" && "generation-iris-reveal-page",
          )}
          aria-hidden={irisBackdrop === "closing"}
        />
      ) : null}

      {showIntroContent ? (
        <div
          className="pointer-events-none fixed inset-0 z-[1195] flex flex-col items-center justify-center px-6 pb-24"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className={cn(
              "transition-opacity duration-300",
              messageFadingOut ? "opacity-0" : "opacity-100",
            )}
          >
            <WordByWordText
              key={`${messageIndex}-${currentMessage}`}
              text={currentMessage}
              active={messageActive && !messageFadingOut}
              onComplete={handleMessageComplete}
            />
          </div>

          <div className="absolute bottom-10 flex items-center justify-center sm:bottom-12">
            <Loader2 className="h-7 w-7 animate-spin text-[#16a34a]" aria-hidden="true" />
            <span className="sr-only">Se pregătește traseul</span>
          </div>
        </div>
      ) : null}

      {showCenterVideo && !videoAnimatingToCorner ? (
        <div className="pointer-events-none fixed z-[1200] generation-video-center" aria-hidden="true">
          <LoadingVideo animateEntry maxWidth="140px" maxHeight="22vh" />
        </div>
      ) : null}

      {showCenterVideo && videoAnimatingToCorner ? (
        <div
          className="pointer-events-none fixed z-[1200] generation-video-to-corner"
          aria-hidden="true"
        >
          <LoadingVideo maxWidth="140px" maxHeight="22vh" />
        </div>
      ) : null}

      {showCornerWidget ? (
        <div
          className={cn(
            "generation-floating-widget-anchor fixed z-[1210]",
            MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS,
            "generation-video-corner-widget",
          )}
        >
          <div
            className="flex flex-col items-end"
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
            onFocus={() => setTooltipOpen(true)}
            onBlur={(event) => {
              const next = event.relatedTarget
              if (next instanceof Node && event.currentTarget.contains(next)) return
              setTooltipOpen(false)
            }}
          >
            {tooltipOpen ? (
              <div
                className="generation-tooltip-pop mb-3 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 shadow-xl"
                role="status"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">Generare traseu</p>
                <GenerationTooltipStatusLine
                  key={`${tooltipLineIndex}-${currentTooltipMessage}`}
                  message={currentTooltipMessage}
                  active={tooltipOpen && phase === "corner"}
                  onComplete={advanceTooltipLine}
                />
                <GenerationProgressBar
                  percent={progressPercent}
                  trailing={
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleCancelGeneration()
                      }}
                      disabled={isCancelling}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#707070] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Oprește generarea traseului"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  }
                />
              </div>
            ) : null}

            <button
              type="button"
              className="generation-video-corner rounded-2xl border border-[#e6e6e6] bg-white p-2 shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
              aria-label="Generare traseu în curs"
              aria-expanded={tooltipOpen}
              onClick={() => setTooltipOpen((open) => !open)}
            >
              <LoadingVideo maxWidth="88px" maxHeight="88px" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function PersonalizedCourseGenerationShell() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === "undefined") return null

  return createPortal(<PersonalizedCourseGenerationFloatingUI />, document.body)
}
