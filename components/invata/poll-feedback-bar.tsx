"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function playClickSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = "sine"
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  } catch {
    // Ignore
  }
}

type PollBarState = "verify" | "correct" | "incorrect"

interface PollFeedbackBarProps {
  state: PollBarState
  hasSelection: boolean
  nextItemHref: string
  onVerify: () => void
  onRetry: () => void
}

export function PollFeedbackBar({
  state,
  hasSelection,
  nextItemHref,
  onVerify,
  onRetry,
}: PollFeedbackBarProps) {
  const isVerified = state === "correct" || state === "incorrect"
  const isCorrect = state === "correct"

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[300] flex items-center justify-between gap-4 border-t px-4 py-4 sm:px-6",
        state === "verify" && "border-[#eee7f3] bg-white/95 backdrop-blur-sm",
        state === "incorrect" && "border-gray-200 bg-gray-100",
        state === "correct" && "border-emerald-200 bg-emerald-50",
      )}
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
    >
      {state === "verify" && (
        <div className="mx-auto flex w-full max-w-5xl justify-center">
          <button
            type="button"
            onClick={onVerify}
            disabled={!hasSelection}
            className={cn(
              "inline-flex w-full max-w-sm items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-[transform,box-shadow]",
              hasSelection
                ? "bg-[#2a2a2a] text-white shadow-[0_3px_0_#050505] hover:translate-y-0.5 hover:shadow-[0_1px_0_#050505]"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            )}
          >
            Verifică
          </button>
        </div>
      )}

      {isVerified && (
        <div className="mx-auto flex w-full max-w-2xl animate-in slide-in-from-bottom-4 fade-in items-center justify-center gap-10 px-4 duration-300">
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <>
                <span className="text-2xl sm:text-3xl" aria-hidden>
                  🎉
                </span>
                <span className="text-lg font-bold text-[#111111] sm:text-xl">Corect!</span>
                <span className="text-base font-semibold text-emerald-600 sm:text-lg">+15 XP</span>
              </>
            ) : (
              <>
                <span className="text-2xl sm:text-3xl" aria-hidden>
                  🎯
                </span>
                <span className="text-lg font-bold text-[#111111] sm:text-xl">Incorect</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-base font-semibold text-[#111111] transition-colors hover:bg-gray-50"
            >
              De ce?
            </button>
            {isCorrect ? (
              <Link
                href={nextItemHref}
                onClick={playClickSound}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-base font-semibold text-white shadow-[0_3px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_1px_0_#047857]"
              >
                Continuă
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full border-2 border-gray-400 bg-white px-5 py-2.5 text-base font-semibold text-[#4d4d4d] transition-colors hover:bg-gray-50"
              >
                Continuă
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
