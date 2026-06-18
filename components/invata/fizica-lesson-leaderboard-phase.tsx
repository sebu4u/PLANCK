"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, Trophy } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  applyFizicaLeaderboardClimb,
  buildInitialFizicaLeaderboard,
  type FizicaLeaderboardEntry,
} from "@/lib/fizica-lesson-leaderboard"
import { fireLeaderboardClimbParticles } from "@/lib/learning-path-confetti"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { cn } from "@/lib/utils"

type LeaderboardIntroPhase =
  | "elo-pop"
  | "elo-up"
  | "tagline-pop"
  | "tagline-up"
  | "list"
  | "climbing"
  | "done"

interface FizicaLessonLeaderboardPhaseProps {
  onContinue: () => void
}

interface OverlayRect {
  top: number
  left: number
  width: number
}

function LeaderboardRow({
  entry,
  isPopped,
}: {
  entry: FizicaLeaderboardEntry
  isPopped: boolean
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        entry.isUser
          ? "border border-emerald-200 bg-emerald-50/95"
          : "border border-transparent bg-white/70",
        entry.isUser && isPopped
          ? "scale-[1.08] shadow-[0_18px_44px_rgba(16,185,129,0.28)]"
          : entry.isUser
            ? "shadow-[0_8px_24px_rgba(16,185,129,0.12)]"
            : undefined,
      )}
      style={{ transformOrigin: "center center" }}
    >
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          entry.isUser ? "text-emerald-700" : "text-[#9aa0b4]",
        )}
      >
        {entry.rank}
      </span>
      <span
        className={cn(
          "truncate text-sm font-semibold",
          entry.isUser ? "text-[#111111]" : "text-[#3d4255]",
        )}
      >
        {entry.name}
      </span>
      <span className="text-sm font-medium tabular-nums text-[#9aa0b4]">{entry.elo}</span>
    </div>
  )
}

function AnimatedLeaderboardRow({
  entry,
  isPopped,
}: {
  entry: FizicaLeaderboardEntry
  isPopped: boolean
}) {
  return (
    <motion.div
      layout
      layoutId={entry.isUser ? undefined : entry.id}
      transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
    >
      <LeaderboardRow entry={entry} isPopped={isPopped} />
    </motion.div>
  )
}

export function FizicaLessonLeaderboardPhase({ onContinue }: FizicaLessonLeaderboardPhaseProps) {
  const { profile, userElo } = useAuth()
  const userName = profile?.name?.trim() || profile?.nickname?.trim() || "Tu"
  const currentElo = userElo ?? 500

  const [introPhase, setIntroPhase] = useState<LeaderboardIntroPhase>("elo-pop")
  const [entries, setEntries] = useState<FizicaLeaderboardEntry[]>(() =>
    buildInitialFizicaLeaderboard(userName, currentElo),
  )
  const [userRowPopped, setUserRowPopped] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null)
  const userRowRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.rank - b.rank),
    [entries],
  )

  const userEntry = useMemo(
    () => sortedEntries.find((entry) => entry.isUser) ?? null,
    [sortedEntries],
  )

  const syncOverlayRect = useCallback(() => {
    const row = userRowRef.current
    if (!row) return

    const rect = row.getBoundingClientRect()
    setOverlayRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  const centerUserInList = useCallback((behavior: ScrollBehavior = "smooth") => {
    const row = userRowRef.current
    const scrollEl = scrollRef.current
    if (!row || !scrollEl) return

    const rowCenter = row.offsetTop + row.offsetHeight / 2
    const nextScrollTop = rowCenter - scrollEl.clientHeight / 2

    scrollEl.scrollTo({
      top: Math.max(0, nextScrollTop),
      behavior,
    })
  }, [])

  useEffect(() => {
    if (introPhase !== "list") return

    const timer = window.setTimeout(() => {
      centerUserInList("smooth")
    }, 120)

    return () => window.clearTimeout(timer)
  }, [centerUserInList, introPhase])

  useEffect(() => {
    if (!userRowPopped) {
      setOverlayRect(null)
      return
    }

    centerUserInList("smooth")
    syncOverlayRect()

    let frame = 0
    const trackOverlay = () => {
      syncOverlayRect()
      frame = window.requestAnimationFrame(trackOverlay)
    }
    frame = window.requestAnimationFrame(trackOverlay)

    return () => window.cancelAnimationFrame(frame)
  }, [centerUserInList, syncOverlayRect, userRowPopped, sortedEntries])

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setIntroPhase("elo-up"), 700),
      window.setTimeout(() => setIntroPhase("tagline-pop"), 1250),
      window.setTimeout(() => setIntroPhase("tagline-up"), 1900),
      window.setTimeout(() => setIntroPhase("list"), 2550),
      window.setTimeout(() => {
        setIntroPhase("climbing")
        centerUserInList("smooth")
        window.setTimeout(() => setUserRowPopped(true), 320)
      }, 3300),
      window.setTimeout(() => {
        centerUserInList("smooth")
        setEntries((previous) => applyFizicaLeaderboardClimb(previous))
      }, 3650),
      window.setTimeout(() => {
        setUserRowPopped(false)
        setIntroPhase("done")

        const row = userRowRef.current
        if (row) {
          const rect = row.getBoundingClientRect()
          fireLeaderboardClimbParticles({
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          })
        } else {
          fireLeaderboardClimbParticles()
        }
      }, 4300),
      window.setTimeout(() => setShowContinue(true), 4550),
    ]

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [centerUserInList])

  const handleContinue = useCallback(() => {
    playButtonClickSound()
    onContinue()
  }, [onContinue])

  const headerSettled =
    introPhase === "tagline-up" ||
    introPhase === "list" ||
    introPhase === "climbing" ||
    introPhase === "done"
  const showList =
    introPhase === "list" || introPhase === "climbing" || introPhase === "done"
  const showTagline =
    introPhase === "tagline-pop" ||
    introPhase === "tagline-up" ||
    introPhase === "list" ||
    introPhase === "climbing" ||
    introPhase === "done"

  return (
    <div className="fixed inset-0 z-[502] flex flex-col overflow-visible bg-[linear-gradient(180deg,#fff9e8_0%,#ffffff_28%,#ffffff_100%)]">
      <motion.div
        className="pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center px-6"
        initial={false}
        animate={{
          top:
            introPhase === "elo-pop"
              ? "38vh"
              : introPhase === "elo-up" || introPhase === "tagline-pop"
                ? "16vh"
                : "2.5rem",
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ scale: 0.55, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
            scale: { type: "spring", stiffness: 420, damping: 20 },
          }}
          className="inline-flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-white px-5 py-3 shadow-[0_10px_30px_rgba(251,191,36,0.18)]"
        >
          <Trophy className="h-7 w-7 text-amber-500" aria-hidden />
          <span className="text-4xl font-black tabular-nums tracking-tight text-[#111111]">
            {currentElo}
          </span>
        </motion.div>

        <AnimatePresence>
          {showTagline ? (
            <motion.p
              key="tagline"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: headerSettled ? 12 : 24,
                scale: 1,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 max-w-sm text-center text-lg font-black tracking-tight text-[#111111] sm:text-xl"
            >
              Crește în clasament cu PLANCK
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <div className="shrink-0 px-6 pt-[11.5rem]" aria-hidden />

      <motion.div
        className="relative flex min-h-0 flex-1 flex-col overflow-visible px-4 pb-28 pt-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{
          opacity: showList ? 1 : 0,
          y: showList ? 0 : 24,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#eceef5] bg-white/85 shadow-[0_16px_40px_rgba(17,17,17,0.06)]">
          <div className="border-b border-[#f0f1f6] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">
              Clasament
            </p>
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <div className="flex flex-col gap-1.5">
              {sortedEntries.map((entry) =>
                entry.isUser ? (
                  <motion.div
                    key={entry.id}
                    ref={userRowRef}
                    layout
                    transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
                    className={cn(userRowPopped && "opacity-0")}
                    aria-hidden={userRowPopped}
                  >
                    <LeaderboardRow entry={entry} isPopped={false} />
                  </motion.div>
                ) : (
                  <AnimatedLeaderboardRow key={entry.id} entry={entry} isPopped={false} />
                ),
              )}
            </div>
          </div>
        </div>

        {userRowPopped && userEntry && overlayRect ? (
          <div
            className="pointer-events-none fixed z-[504]"
            style={{
              top: overlayRect.top,
              left: overlayRect.left,
              width: overlayRect.width,
            }}
          >
            <LeaderboardRow entry={userEntry} isPopped />
          </div>
        ) : null}
      </motion.div>

      <AnimatePresence>
        {showContinue ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
          >
            <button
              type="button"
              onClick={handleContinue}
              className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857]"
            >
              Continuă
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
