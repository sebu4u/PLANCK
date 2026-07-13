"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import {
  buildInitialFizicaLeaderboard,
  sliceLeaderboardAroundUser,
} from "@/lib/fizica-lesson-leaderboard"
import { cn } from "@/lib/utils"
import { LeaderboardRow } from "@/components/dashboard/leaderboard-row"

type RevealPhase = "list-pop" | "user-scale" | "user-shine" | "closing"

interface DesktopRankLeaderboardRevealOverlayProps {
  studentName: string
  elo: number
  onComplete: () => void
}

const NEIGHBOR_RADIUS = 2
const LIST_POP_MS = 450
const USER_SCALE_MS = 300
const USER_SHINE_MS = 1550
const IRIS_OUT_MS = 700
const TOTAL_MS = LIST_POP_MS + USER_SCALE_MS + USER_SHINE_MS + IRIS_OUT_MS

export function DesktopRankLeaderboardRevealOverlay({
  studentName,
  elo,
  onComplete,
}: DesktopRankLeaderboardRevealOverlayProps) {
  const [phase, setPhase] = useState<RevealPhase>("list-pop")
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const { visibleEntries, hasAbove, hasBelow } = useMemo(() => {
    const entries = buildInitialFizicaLeaderboard(studentName, elo)
    const slice = sliceLeaderboardAroundUser(entries, NEIGHBOR_RADIUS)

    return {
      visibleEntries: slice.visible,
      hasAbove: slice.hasAbove,
      hasBelow: slice.hasBelow,
    }
  }, [studentName, elo])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCompleteRef.current()
      return
    }

    const scaleTimer = window.setTimeout(() => setPhase("user-scale"), LIST_POP_MS)
    const shineTimer = window.setTimeout(() => setPhase("user-shine"), LIST_POP_MS + USER_SCALE_MS)
    const closingTimer = window.setTimeout(
      () => setPhase("closing"),
      LIST_POP_MS + USER_SCALE_MS + USER_SHINE_MS,
    )
    const completeTimer = window.setTimeout(() => onCompleteRef.current(), TOTAL_MS)

    return () => {
      window.clearTimeout(scaleTimer)
      window.clearTimeout(shineTimer)
      window.clearTimeout(closingTimer)
      window.clearTimeout(completeTimer)
    }
  }, [])

  const userIsPopped = phase === "user-scale" || phase === "user-shine"

  return (
    <div
      className={cn(
        "fixed inset-0 z-[545] flex items-center justify-center overflow-hidden bg-white px-6",
        phase === "closing" && "subject-change-celebration-iris-out",
      )}
      role="dialog"
      aria-live="polite"
      aria-label="Clasament"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-gradient-to-b from-emerald-200/95 via-emerald-50/70 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#111111]">
            Vezi unde esti in clasament
          </h2>
          <Trophy className="mt-3 h-8 w-8 text-amber-500" aria-hidden />
        </div>

        <div className="rounded-[24px] border border-[#eceef5] bg-white p-4 shadow-[0_16px_40px_rgba(17,17,17,0.08)]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Clasament</p>

          <div className="flex flex-col gap-1.5">
            {hasAbove ? <p className="px-3 py-1 text-center text-xs font-medium text-[#9ca3af]">...</p> : null}
            {visibleEntries.map((entry) => (
              <motion.div
                key={entry.id}
                animate={
                  entry.isUser && userIsPopped
                    ? { scale: 1.08 }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={cn(entry.isUser && phase === "user-shine" && "dashboard-start-glow")}
                  style={
                    entry.isUser
                      ? ({ "--start-glow-tint": "rgba(110, 231, 183, 0.9)" } as CSSProperties)
                      : undefined
                  }
                >
                  <LeaderboardRow
                    rank={entry.rank}
                    name={entry.name}
                    elo={entry.elo}
                    isUser={entry.isUser}
                  />
                </div>
              </motion.div>
            ))}
            {hasBelow ? <p className="px-3 py-1 text-center text-xs font-medium text-[#9ca3af]">...</p> : null}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
