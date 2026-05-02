"use client"

import { useState, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { EloGainCard } from "@/components/invata/elo-gain-card"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"

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

type ProblemBarState = "verify" | "correct" | "incorrect"

interface ProblemFeedbackBarProps {
  state: ProblemBarState
  hasAnswer: boolean
  nextItemHref: string
  onVerify: () => void
  onRetry: () => void
  onContinue?: () => Promise<void> | void
  onExplain?: () => void
  eloAward?: LearningPathEloAward | null
  answerSlot: React.ReactNode
}

export function ProblemFeedbackBar({
  state,
  hasAnswer,
  nextItemHref,
  onVerify,
  onRetry,
  onContinue,
  onExplain,
  eloAward,
  answerSlot,
}: ProblemFeedbackBarProps) {
  const router = useRouter()
  const [showEloCard, setShowEloCard] = useState(false)
  const isVerified = state === "correct" || state === "incorrect"
  const isCorrect = state === "correct"
  const shouldShowEloCard = Boolean(eloAward?.awarded && eloAward.awardAmount > 0)

  const handleContinue = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    playClickSound()
    if (shouldShowEloCard && !showEloCard) {
      setShowEloCard(true)
      return
    }
    await onContinue?.()
    router.push(nextItemHref)
  }

  const continueAfterEloCard = async () => {
    playClickSound()
    await onContinue?.()
    router.push(nextItemHref)
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[300] flex items-center justify-between gap-3 border-t px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-4",
          state === "verify" && "border-[#eee7f3] bg-white/95 backdrop-blur-sm",
          state === "incorrect" && "border-gray-200 bg-gray-100",
          state === "correct" && "border-emerald-200 bg-emerald-50",
        )}
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))" }}
      >
        {state === "verify" && (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1">{answerSlot}</div>
            <button
              type="button"
              onClick={onVerify}
              disabled={!hasAnswer}
              className={cn(
                "w-full shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] sm:w-auto sm:px-6 sm:py-3",
                hasAnswer
                  ? "bg-[#2a2a2a] text-white shadow-[0_3px_0_#050505] hover:translate-y-0.5 hover:shadow-[0_1px_0_#050505]"
                  : "cursor-not-allowed bg-gray-300 text-gray-500",
              )}
            >
              Verifică
            </button>
          </div>
        )}

        {isVerified && (
          <div className="mx-auto flex w-full max-w-2xl animate-in flex-col items-center justify-center gap-2 px-2 text-center fade-in slide-in-from-bottom-4 duration-300 sm:flex-row sm:gap-10 sm:px-4 sm:text-left">
            <div className="flex items-center gap-2 sm:gap-3">
              {isCorrect ? (
                <>
                  <span className="text-xl sm:text-3xl" aria-hidden>
                    🎉
                  </span>
                  <span className="text-base font-bold text-[#111111] sm:text-xl">Corect!</span>
                  {shouldShowEloCard ? (
                    <span className="text-sm font-semibold text-emerald-600 sm:text-lg">
                      +{eloAward?.awardAmount ?? 15} ELO
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="text-xl sm:text-3xl" aria-hidden>
                    🎯
                  </span>
                  <span className="text-base font-bold text-[#111111] sm:text-xl">Incorect</span>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onExplain}
                className="rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 sm:px-4 sm:py-2.5 sm:text-base"
              >
                De ce?
              </button>
              {isCorrect ? (
                <Link
                  href={nextItemHref}
                  onClick={handleContinue}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_1px_0_#047857] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base"
                >
                  Continuă
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-[#4d4d4d] transition-colors hover:bg-gray-50 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base"
                >
                  Continuă
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showEloCard && eloAward ? (
        <EloGainCard award={eloAward} onContinue={continueAfterEloCard} />
      ) : null}
    </>
  )
}
