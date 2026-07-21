"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PlanckPassBgPattern } from "@/components/dashboard/free-mobile/planckpass-bg-pattern"
import {
  playLessonXpCollectSound,
  playLessonXpCountupSound,
} from "@/lib/planckpass/lesson-xp-sound"
import type { PlanckPassState } from "@/lib/planckpass/types"
import { xpBarForProgress } from "@/lib/planckpass/xp"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

type Phase = "loading" | "xp-count" | "pass-climb" | "ready"

interface LessonPlanckPassPhaseProps {
  itemIds: string[]
  onClose: () => void | Promise<void>
}

const motionEase = [0.22, 1, 0.36, 1] as const
const LP_XP_SOURCES = ["lp_item", "lp_interactive", "lp_test"] as const

const EMPTY_PASS: PlanckPassState = {
  season: null,
  currentTier: 0,
  xpCurrent: 0,
  xpMax: 150,
  xpTotal: 0,
  tiers: [],
  canClaimPremium: false,
  coins: 0,
  eloBoostUntil: null,
  streakFreezeUntil: null,
}

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function fetchLessonXp(userId: string, itemIds: string[]): Promise<number> {
  if (itemIds.length === 0) return 0
  const { data, error } = await supabase
    .from("planckpass_xp_events")
    .select("amount")
    .eq("user_id", userId)
    .in("source", [...LP_XP_SOURCES])
    .in("source_key", itemIds)

  if (error) {
    console.warn("lesson planckpass xp fetch:", error.message)
    return 0
  }
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
}

async function fetchPassState(): Promise<PlanckPassState> {
  const token = await getToken()
  if (!token) return EMPTY_PASS
  const res = await fetch("/api/planckpass", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return EMPTY_PASS
  return (await res.json()) as PlanckPassState
}

export function LessonPlanckPassPhase({ itemIds, onClose }: LessonPlanckPassPhaseProps) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>("loading")
  const [lessonXp, setLessonXp] = useState(0)
  const [displayXp, setDisplayXp] = useState(0)
  const [pass, setPass] = useState<PlanckPassState>(EMPTY_PASS)
  const [animatedXpTotal, setAnimatedXpTotal] = useState(0)
  const [isClosing, setIsClosing] = useState(false)

  const xpRequiredByTier = useMemo(
    () => pass.tiers.map((tier) => tier.xpRequired),
    [pass.tiers],
  )

  const startXpTotal = Math.max(0, pass.xpTotal - lessonXp)
  const bar = xpBarForProgress(animatedXpTotal, xpRequiredByTier.length > 0 ? xpRequiredByTier : [150])
  const xpPct = bar.xpMax > 0 ? Math.min(100, Math.round((bar.xpCurrent / bar.xpMax) * 100)) : 0
  const seasonTitle = pass.season?.title ?? "PlanckPass"

  useEffect(() => {
    let cancelled = false
    const ids = itemIds

    void (async () => {
      if (!user?.id) {
        if (!cancelled) {
          setLessonXp(0)
          setPass(EMPTY_PASS)
          setAnimatedXpTotal(0)
          setPhase("xp-count")
        }
        return
      }

      const [xp, passState] = await Promise.all([
        fetchLessonXp(user.id, ids),
        fetchPassState(),
      ])
      if (cancelled) return

      setLessonXp(xp)
      setPass(passState)
      setAnimatedXpTotal(Math.max(0, passState.xpTotal - xp))
      setPhase("xp-count")
    })()

    return () => {
      cancelled = true
    }
    // itemIds joined — avoid refetch on new array identity with same IDs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, itemIds.join(",")])

  useEffect(() => {
    if (phase !== "xp-count") return

    playLessonXpCountupSound()
    const amount = lessonXp
    if (amount <= 0) {
      const timer = window.setTimeout(() => setPhase("pass-climb"), 400)
      return () => window.clearTimeout(timer)
    }

    let frame = 0
    const start = performance.now()
    const duration = Math.min(1000, 450 + amount * 5)

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayXp(Math.round(amount * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      setDisplayXp(amount)
      window.setTimeout(() => setPhase("pass-climb"), 280)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lessonXp, phase])

  useEffect(() => {
    if (phase !== "pass-climb") return

    playLessonXpCollectSound()
    const from = startXpTotal
    const to = pass.xpTotal
    const delta = to - from

    if (delta <= 0) {
      setAnimatedXpTotal(to)
      const timer = window.setTimeout(() => setPhase("ready"), 500)
      return () => window.clearTimeout(timer)
    }

    let frame = 0
    const start = performance.now()
    const duration = Math.min(1400, 700 + delta * 4)

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedXpTotal(Math.round(from + delta * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      setAnimatedXpTotal(to)
      window.setTimeout(() => setPhase("ready"), 350)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pass.xpTotal, phase, startXpTotal])

  const handleClose = useCallback(async () => {
    if (isClosing) return
    playButtonClickSound()
    setIsClosing(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    await onClose()
  }, [isClosing, onClose])

  const showPass = phase === "pass-climb" || phase === "ready"

  return (
    <div className="fixed inset-0 z-[502] flex flex-col bg-[linear-gradient(180deg,#fff9e8_0%,#ffffff_28%,#ffffff_100%)]">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative flex min-h-[88px] w-full max-w-md flex-col items-center justify-center text-center">
          {phase === "loading" ? (
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: motionEase }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
                <p className="text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
                  +{displayXp}
                </p>
                <span className="text-2xl font-black tracking-wide sm:text-3xl">XP</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#5f657b] sm:text-base">
                XP câștigat în această lecție
              </p>
            </motion.div>
          )}
        </div>

        <motion.div
          className="mt-10 w-full max-w-md overflow-hidden rounded-[28px] border border-[#2a1570]/30 shadow-[0_18px_50px_rgba(42,21,112,0.22)]"
          initial={false}
          animate={{
            opacity: showPass ? 1 : 0,
            y: showPass ? 0 : 24,
            scale: showPass ? 1 : 0.96,
          }}
          transition={{ duration: 0.5, ease: motionEase }}
          aria-hidden={!showPass}
        >
          <div className="relative overflow-hidden bg-[linear-gradient(160deg,#6a2cff_0%,#5020F0_45%,#3a12c4_100%)] px-4 pb-5 pt-4">
            <PlanckPassBgPattern />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="title-font text-sm italic text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-base">
                  {seasonTitle}
                </h3>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-[3px] border-[#1a0a4a] bg-[#ffd000] text-base font-black text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a] transition-transform duration-300",
                    phase === "ready" && "scale-110",
                  )}
                >
                  {Math.max(bar.currentTier, 0)}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                    Progres tier
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-white/90">
                    {bar.xpCurrent}/{bar.xpMax} XP
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a] shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ffd000] to-[#ffb800] shadow-[0_0_8px_rgba(255,208,0,0.55)] transition-[width] duration-75 ease-linear"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>

              <p className="mt-4 text-center text-xs font-semibold text-white/85 sm:text-sm">
                {lessonXp > 0
                  ? "Ai urcat în PlanckPass cu XP-ul din lecție."
                  : "Finalizează pași din lecție ca să urci în PlanckPass."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={() => void handleClose()}
          disabled={isClosing || phase === "loading"}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow,opacity] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857] disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isClosing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Se închide...
            </>
          ) : (
            "Închide lecția"
          )}
        </button>
      </div>
    </div>
  )
}
