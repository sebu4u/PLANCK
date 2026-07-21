"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  PLANCK_LESSON_XP_GAINED_EVENT,
  type PlanckLessonXpGainedDetail,
} from "@/lib/planckpass/award-client"
import {
  playLessonXpCollectSound,
  playLessonXpCountupSound,
} from "@/lib/planckpass/lesson-xp-sound"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

const LP_XP_SOURCES = ["lp_item", "lp_interactive", "lp_test"] as const

type FloatPhase = "counting" | "flying" | "merging"

interface FloatingGain {
  id: number
  sourceKey: string
  amount: number
  display: number
  phase: FloatPhase
}

interface LessonXpBadgeProps {
  itemIds: string[]
  className?: string
}

export function LessonXpBadge({ itemIds, className }: LessonXpBadgeProps) {
  const { user } = useAuth()
  const [displayXp, setDisplayXp] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [floatGain, setFloatGain] = useState<FloatingGain | null>(null)
  const [badgePulse, setBadgePulse] = useState(false)

  const xpByKeyRef = useRef<Map<string, number>>(new Map())
  const pendingKeysRef = useRef<Set<string>>(new Set())
  const queueRef = useRef<PlanckLessonXpGainedDetail[]>([])
  const animatingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const itemIdsKey = itemIds.join(",")
  const itemIdSetRef = useRef(new Set(itemIds))
  const itemIdsRef = useRef(itemIds)

  useEffect(() => {
    itemIdsRef.current = itemIds
    itemIdSetRef.current = new Set(itemIds)
  }, [itemIdsKey])

  const clearAnimationArtifacts = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    for (const timer of timersRef.current) window.clearTimeout(timer)
    timersRef.current = []
  }, [])

  const sumXp = useCallback(() => {
    let total = 0
    for (const amount of xpByKeyRef.current.values()) total += amount
    return total
  }, [])

  const publishTotal = useCallback(() => {
    setDisplayXp(sumXp())
  }, [sumXp])

  const fetchLessonXp = useCallback(async () => {
    const ids = itemIdsRef.current
    if (!user?.id || ids.length === 0) {
      xpByKeyRef.current = new Map()
      setDisplayXp(0)
      setLoaded(true)
      return
    }

    const { data, error } = await supabase
      .from("planckpass_xp_events")
      .select("amount, source_key")
      .eq("user_id", user.id)
      .in("source", [...LP_XP_SOURCES])
      .in("source_key", ids)

    if (error) {
      console.warn("lesson xp fetch:", error.message)
      setLoaded(true)
      return
    }

    const next = new Map(xpByKeyRef.current)
    for (const row of data ?? []) {
      const key = String(row.source_key ?? "")
      if (!key) continue
      // Don't clobber an in-flight gain; it will commit when the animation merges.
      if (pendingKeysRef.current.has(key)) continue
      next.set(key, Number(row.amount ?? 0))
    }
    xpByKeyRef.current = next
    publishTotal()
    setLoaded(true)
  }, [publishTotal, user?.id])

  useEffect(() => {
    clearAnimationArtifacts()
    xpByKeyRef.current = new Map()
    pendingKeysRef.current = new Set()
    queueRef.current = []
    animatingRef.current = false
    setFloatGain(null)
    setBadgePulse(false)
    setDisplayXp(0)
    setLoaded(false)
    void fetchLessonXp()
    return () => clearAnimationArtifacts()
  }, [clearAnimationArtifacts, fetchLessonXp, user?.id, itemIdsKey])

  const runNextAnimation = useCallback(() => {
    if (animatingRef.current) return
    const next = queueRef.current.shift()
    if (!next) return

    animatingRef.current = true
    const id = Date.now() + Math.random()
    playLessonXpCountupSound()
    setFloatGain({
      id,
      sourceKey: next.sourceKey,
      amount: next.amount,
      display: 0,
      phase: "counting",
    })

    const countDuration = Math.min(900, 420 + next.amount * 6)
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / countDuration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const display = Math.round(next.amount * eased)
      setFloatGain((prev) =>
        prev && prev.id === id ? { ...prev, display, phase: "counting" } : prev,
      )
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      setFloatGain((prev) =>
        prev && prev.id === id
          ? { ...prev, display: next.amount, phase: "flying" }
          : prev,
      )
      playLessonXpCollectSound()

      const flyTimer = window.setTimeout(() => {
        setFloatGain((prev) =>
          prev && prev.id === id ? { ...prev, phase: "merging" } : prev,
        )
        setBadgePulse(true)
        xpByKeyRef.current.set(next.sourceKey, next.amount)
        pendingKeysRef.current.delete(next.sourceKey)
        publishTotal()

        const doneTimer = window.setTimeout(() => {
          setFloatGain(null)
          setBadgePulse(false)
          animatingRef.current = false
          runNextAnimation()
        }, 280)
        timersRef.current.push(doneTimer)
      }, 520)
      timersRef.current.push(flyTimer)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [publishTotal])

  const enqueueGain = useCallback(
    (detail: PlanckLessonXpGainedDetail) => {
      if (!itemIdSetRef.current.has(detail.sourceKey)) return
      if (xpByKeyRef.current.has(detail.sourceKey)) return
      if (pendingKeysRef.current.has(detail.sourceKey)) return
      pendingKeysRef.current.add(detail.sourceKey)
      queueRef.current.push(detail)
      runNextAnimation()
    },
    [runNextAnimation],
  )

  useEffect(() => {
    const onGain = (event: Event) => {
      const detail = (event as CustomEvent<PlanckLessonXpGainedDetail>).detail
      if (!detail?.sourceKey || detail.amount <= 0) return
      enqueueGain(detail)
    }
    window.addEventListener(PLANCK_LESSON_XP_GAINED_EVENT, onGain)
    return () => window.removeEventListener(PLANCK_LESSON_XP_GAINED_EVENT, onGain)
  }, [enqueueGain])

  return (
    <div className={cn("relative flex shrink-0 items-center", className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-1.5 py-1 text-sm font-semibold text-emerald-700 transition-[transform,background-color] duration-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
              badgePulse && "scale-110",
            )}
            aria-label={`XP pe lecție: ${displayXp}`}
            aria-expanded={popoverOpen}
            aria-haspopup="dialog"
          >
            <Sparkles
              className={cn(
                "h-4 w-4 text-emerald-600 transition-transform duration-200 sm:h-[1.125rem] sm:w-[1.125rem]",
                badgePulse && "rotate-12",
              )}
            />
            <span className="min-w-[1.25rem] tabular-nums">
              {loaded || displayXp > 0 ? displayXp : "—"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={10}
          className="z-[320] w-[min(100vw-2rem,17.5rem)] origin-top-right rounded-2xl border-emerald-100 bg-white p-4 shadow-[0_16px_40px_rgba(6,95,70,0.12)] data-[state=open]:slide-in-from-top-3"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            XP pe lecție
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-[#111111]">
            Acesta este XP-ul primit pe această lecție.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6f657b]">
            Crește de fiecare dată când finalizezi un pas. Se adună în PlanckPass.
          </p>
          <p className="mt-3 text-lg font-black tabular-nums text-emerald-700">
            {displayXp} XP
          </p>
        </PopoverContent>
      </Popover>

      {floatGain ? (
        <div
          className={cn(
            "pointer-events-none absolute right-0 z-[310] flex items-center gap-1 font-black tabular-nums text-emerald-600",
            floatGain.phase === "counting" &&
              "top-[calc(100%+0.85rem)] translate-y-0 scale-100 text-2xl opacity-100 sm:text-3xl",
            floatGain.phase === "flying" &&
              "top-0 translate-y-0 scale-90 text-lg opacity-95 transition-[top,transform,opacity,font-size] duration-500 ease-in",
            floatGain.phase === "merging" &&
              "top-0 scale-50 text-sm opacity-0 transition-[transform,opacity] duration-200 ease-out",
          )}
          aria-live="polite"
        >
          <span>+{floatGain.display}</span>
          <span className="text-[0.65em] font-bold tracking-wide">XP</span>
        </div>
      ) : null}
    </div>
  )
}
