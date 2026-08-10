"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Lilita_One } from "next/font/google"
import { motion, useReducedMotion } from "framer-motion"
import { Loader2, Trophy, X } from "lucide-react"
import { PlanckPassClaimReveal } from "@/components/dashboard/free-mobile/planckpass-claim-reveal"
import { useTrophyRoad } from "@/hooks/use-trophy-road"
import { trophyClaimToPassReveal } from "@/lib/trophy-road/claim-map"
import { getNextMilestone, TROPHY_ROAD_MILESTONES } from "@/lib/trophy-road/milestones"
import { TrophyRoadMap } from "./trophy-road-map"

const lilita = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

interface TrophyRoadOverlayProps {
  open: boolean
  onClose: () => void
  userElo: number
}

export function TrophyRoadOverlay({ open, onClose, userElo }: TrophyRoadOverlayProps) {
  const reduceMotion = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const didScrollRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const { state, loading, claiming, reveal, claim, dismissReveal, error } = useTrophyRoad(open)

  const milestones =
    state.milestones.length > 0
      ? state.milestones
      : TROPHY_ROAD_MILESTONES.map((m) => ({
          ...m,
          unlocked: userElo >= m.threshold,
        }))

  const elo = state.milestones.length > 0 ? state.userElo : userElo
  const next = getNextMilestone(elo, milestones)
  const trophiesNeeded = next ? Math.max(0, next.threshold - elo) : 0
  const claimableCount = milestones.filter((m) => m.claimable).length

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      didScrollRef.current = false
      return
    }

    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || didScrollRef.current || loading) return

    const findFocusMarker = (scroller: HTMLElement) => {
      const markers = Array.from(
        scroller.querySelectorAll<HTMLElement>("[data-trophy-road-marker]"),
      )
      if (markers.length === 0) return null

      const claimable = milestones.find((m) => m.claimable)
      if (claimable) {
        const el = markers.find((m) => m.dataset.trophyRoadMarker === claimable.id)
        if (el) return el
      }

      if (next) {
        const nextMarker = markers.find(
          (el) => Number(el.dataset.threshold ?? 0) === next.threshold,
        )
        if (nextMarker) return nextMarker
      }

      const reached = markers.filter((el) => Number(el.dataset.threshold ?? 0) <= elo)
      return reached[0] ?? markers[markers.length - 1]
    }

    const scrollToFocus = () => {
      const scroller = scrollRef.current
      if (!scroller) return false
      const target = findFocusMarker(scroller)
      if (!target) return false
      target.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      })
      didScrollRef.current = true
      return true
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToFocus()
    })
    const retry = window.setTimeout(() => {
      scrollToFocus()
    }, 220)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [open, elo, next, reduceMotion, loading, milestones])

  const handleClaim = useCallback(
    async (milestoneId: string) => {
      if (claiming) return
      setClaimingId(milestoneId)
      try {
        await claim(milestoneId)
      } catch {
        // error surfaced via hook state
      } finally {
        setClaimingId(null)
      }
    },
    [claim, claiming],
  )

  if (!open || !mounted) return null

  return createPortal(
    <>
      <motion.div
        className="trophy-road-shell fixed inset-0 z-[560] flex h-[100dvh] w-screen flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Trophy Road"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div aria-hidden className="trophy-road-atmosphere pointer-events-none absolute inset-0" />

        <header className="relative z-20 flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <h2
              className={`${lilita.className} text-[1.65rem] leading-none tracking-wide text-[#1e2a3a] sm:text-3xl`}
            >
              Trophy Road
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#5b6b7f]">
              Urcă pe drum și colectează recompense permanente
            </p>
            <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 rounded-2xl border-2 border-[#1e2a3a]/10 bg-white/80 px-3 py-1.5 text-sm font-black text-[#1e2a3a] shadow-[0_4px_0_rgba(30,42,58,0.08)] backdrop-blur-sm">
              <Trophy className="h-4 w-4 text-[#d4a012]" strokeWidth={2.5} />
              <span>{elo.toLocaleString("ro-RO")}</span>
              {next ? (
                <span className="text-[11px] font-bold text-[#7a5200]">
                  · încă {trophiesNeeded.toLocaleString("ro-RO")} până la{" "}
                  {next.threshold.toLocaleString("ro-RO")}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-[#1a9f6e]">· drum complet</span>
              )}
              {claimableCount > 0 ? (
                <span className="rounded-lg bg-[#ffd84d] px-1.5 py-0.5 text-[10px] font-bold text-[#4a3200]">
                  {claimableCount} de colectat
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Închide Trophy Road"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#1e2a3a]/12 bg-white/90 text-[#1e2a3a] shadow-[0_3px_0_rgba(30,42,58,0.12)] transition-transform active:translate-y-[2px] active:shadow-none"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="trophy-road-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {loading && state.milestones.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm font-semibold text-[#5b6b7f]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se încarcă drumul…
            </div>
          ) : (
            <TrophyRoadMap
              userElo={elo}
              milestones={milestones}
              claimingId={claimingId}
              onClaim={(id) => void handleClaim(id)}
            />
          )}
        </div>

        <div className="relative z-20 shrink-0 border-t border-[#1e2a3a]/8 bg-white/55 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-[11px] font-semibold text-[#7a8aa0] backdrop-blur-sm">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : claimableCount > 0 ? (
            "Apasă Colectează pe recompensele deblocate"
          ) : (
            "Recompense permanente pe măsură ce urci în trofee"
          )}
        </div>
      </motion.div>

      {reveal ? (
        <PlanckPassClaimReveal
          reward={trophyClaimToPassReveal(reveal)}
          onClose={dismissReveal}
          className="z-[570]"
        />
      ) : null}
    </>,
    document.body,
  )
}
