"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { FizicaLessonLeaderboardPhase } from "@/components/invata/fizica-lesson-leaderboard-phase"
import { FizicaLessonBatteryPhase } from "@/components/invata/fizica-lesson-battery-phase"
import { fireFizicaLessonCompletionConfetti } from "@/lib/learning-path-confetti"
import { playButtonClickSound } from "@/lib/platform-sounds"

interface FizicaLessonCompletionScreenProps {
  totalElo: number
  onContinue: () => void
}

type CompletionScreen = "celebration" | "leaderboard" | "battery"

export function FizicaLessonCompletionScreen({
  totalElo,
  onContinue,
}: FizicaLessonCompletionScreenProps) {
  const [screen, setScreen] = useState<CompletionScreen>("celebration")
  const [phase, setPhase] = useState<"title" | "elo">("title")
  const [displayElo, setDisplayElo] = useState(0)

  useEffect(() => {
    if (screen !== "celebration") return
    fireFizicaLessonCompletionConfetti()
  }, [screen])

  useEffect(() => {
    if (screen !== "celebration") return

    const timer = window.setTimeout(() => {
      setPhase("elo")
    }, 900)
    return () => window.clearTimeout(timer)
  }, [screen])

  useEffect(() => {
    if (screen !== "celebration" || phase !== "elo") return

    let frame = 0
    const start = performance.now()
    const duration = 850

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayElo(Math.round(totalElo * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, screen, totalElo])

  const handleCelebrationContinue = () => {
    playButtonClickSound()
    setScreen("leaderboard")
  }

  if (screen === "battery") {
    return <FizicaLessonBatteryPhase onClose={onContinue} />
  }

  if (screen === "leaderboard") {
    return <FizicaLessonLeaderboardPhase onContinue={() => setScreen("battery")} />
  }

  return (
    <div className="fixed inset-0 z-[502] flex flex-col bg-white">
      <div className="relative flex flex-1 items-center justify-center px-6">
        <div className="relative flex min-h-[120px] w-full max-w-md flex-col items-center justify-center text-center">
          <motion.h1
            className="absolute text-3xl font-black tracking-tight text-[#111111] sm:text-4xl"
            initial={{ opacity: 1, y: 0 }}
            animate={
              phase === "title"
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: -48 }
            }
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Ai terminat lecția!
          </motion.h1>

          <AnimatePresence>
            {phase === "elo" ? (
              <motion.p
                key="elo-total"
                className="absolute text-5xl font-black tabular-nums tracking-tight text-emerald-700 sm:text-6xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                +{displayElo} ELO
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={handleCelebrationContinue}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857]"
        >
          Continuă
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
