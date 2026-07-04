"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import { AnimatedWords } from "@/components/onboarding/animated-words"
import { getPracticeSubjectLabel, type PracticeSubjectId } from "@/lib/practice-subject"
import { cn } from "@/lib/utils"

type CelebrationPhase = "transition" | "streak" | "closing"

interface SubjectChangeCelebrationOverlayProps {
  from: PracticeSubjectId
  to: PracticeSubjectId
  onComplete: () => void
}

const TRANSITION_MS = 2600
const STREAK_MS = 2600
const IRIS_MS = 700

export function SubjectChangeCelebrationOverlay({
  from,
  to,
  onComplete,
}: SubjectChangeCelebrationOverlayProps) {
  const [phase, setPhase] = useState<CelebrationPhase>("transition")
  const fromLabel = getPracticeSubjectLabel(from)
  const toLabel = getPracticeSubjectLabel(to)
  const transitionText = `Ai trecut de la ${fromLabel} la ${toLabel}.`

  useEffect(() => {
    const streakTimer = window.setTimeout(() => setPhase("streak"), TRANSITION_MS)
    const closingTimer = window.setTimeout(() => setPhase("closing"), TRANSITION_MS + STREAK_MS)
    const completeTimer = window.setTimeout(onComplete, TRANSITION_MS + STREAK_MS + IRIS_MS)

    return () => {
      window.clearTimeout(streakTimer)
      window.clearTimeout(closingTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className={cn(
        "fixed inset-0 z-[545] flex items-center justify-center bg-white px-6",
        phase === "closing" && "subject-change-celebration-iris-out",
      )}
      role="dialog"
      aria-live="polite"
      aria-label="Materia a fost schimbată"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-gradient-to-b from-emerald-200/95 via-emerald-50/70 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[720px] text-center">
        <div
          className={cn(
            "transition-opacity duration-300 ease-out",
            phase === "transition" ? "opacity-100" : "pointer-events-none absolute inset-x-0 opacity-0",
          )}
        >
          <AnimatedWords
            key={`${from}-${to}`}
            text={transitionText}
            highlightWords={{
              [fromLabel]: "text-emerald-700",
              [toLabel]: "text-emerald-700",
            }}
            className="text-[28px] font-extrabold leading-tight text-[#0f172a] sm:text-[34px]"
          />
        </div>

        <div
          className={cn(
            "transition-opacity duration-300 ease-out",
            phase === "streak"
              ? "opacity-100"
              : "pointer-events-none absolute inset-x-0 opacity-0",
          )}
        >
          {phase === "streak" ? (
            <AnimatedWords
              text="Continuă să lucrezi pentru a-ți păstra Streak."
              suffixAfterWord={{
                match: "Streak",
                node: (
                  <Zap
                    className="ml-1 inline h-6 w-6 fill-amber-400 text-amber-500 align-[-2px] sm:h-7 sm:w-7"
                    aria-hidden
                  />
                ),
              }}
              className="text-[24px] font-bold leading-snug text-[#111827] sm:text-[30px]"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
