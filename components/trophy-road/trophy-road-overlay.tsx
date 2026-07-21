"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Lilita_One } from "next/font/google"
import { motion, useReducedMotion } from "framer-motion"
import { Trophy, X } from "lucide-react"
import {
  TROPHY_ROAD_MILESTONES,
  getMilestoneOffset,
  getNextMilestone,
} from "@/lib/trophy-road/milestones"
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

function readIsDesktop(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(min-width: 948px)").matches
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(readIsDesktop)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 948px)")
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  return isDesktop
}

export function TrophyRoadOverlay({ open, onClose, userElo }: TrophyRoadOverlayProps) {
  const reduceMotion = useReducedMotion()
  const isDesktop = useIsDesktop()
  const orientation = isDesktop ? "horizontal" : "vertical"
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolledForOrientationRef = useRef<"horizontal" | "vertical" | null>(null)
  const [mounted, setMounted] = useState(false)

  const next = getNextMilestone(userElo)
  const trophiesNeeded = next ? Math.max(0, next.threshold - userElo) : 0

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      scrolledForOrientationRef.current = null
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
    if (!open) return
    if (scrolledForOrientationRef.current === orientation) return

    const frame = window.requestAnimationFrame(() => {
      const scroller = scrollRef.current
      if (!scroller) return

      const focusThreshold =
        next?.threshold ??
        TROPHY_ROAD_MILESTONES[TROPHY_ROAD_MILESTONES.length - 1]?.threshold ??
        userElo
      const offset = getMilestoneOffset(Math.min(focusThreshold, Math.max(userElo, 0)))

      if (orientation === "horizontal") {
        const target = Math.max(0, offset - scroller.clientWidth / 2)
        scroller.scrollTo({
          left: target,
          behavior: reduceMotion ? "auto" : "smooth",
        })
      } else {
        const target = Math.max(0, offset - scroller.clientHeight / 2)
        scroller.scrollTo({
          top: target,
          behavior: reduceMotion ? "auto" : "smooth",
        })
      }
      scrolledForOrientationRef.current = orientation
    })

    return () => window.cancelAnimationFrame(frame)
  }, [open, orientation, userElo, next, reduceMotion])

  if (!open || !mounted) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[560] flex h-[100dvh] w-screen flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Trophy Road"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      {/* Full-bleed atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[#4a9e4a]" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#7ecf6e_0%,#5bb85a_42%,#e8c87a_78%,#6ec4e8_100%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <h2
            className={`${lilita.className} text-2xl leading-none text-white [text-shadow:3px_3px_0_#1a0a4a,-1px_-1px_0_#1a0a4a,1px_-1px_0_#1a0a4a,-1px_1px_0_#1a0a4a] sm:text-3xl`}
          >
            Trophy Road
          </h2>
          <p className="mt-1 text-xs font-semibold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            Recompense permanente pe baza trofeelor tale
          </p>
          <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a]/80 px-3 py-1 text-sm font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <Trophy className="h-4 w-4 text-[#ffd000]" strokeWidth={2.5} />
            <span>{userElo.toLocaleString("ro-RO")}</span>
            {next ? (
              <span className="text-[11px] font-bold text-[#ffd000]">
                · încă {trophiesNeeded.toLocaleString("ro-RO")} până la{" "}
                {next.threshold.toLocaleString("ro-RO")}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-300">· drum complet</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Închide Trophy Road"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#1a0a4a] bg-white text-[#1a0a4a] shadow-[0_3px_0_#1a0a4a] transition-transform active:translate-y-[2px] active:shadow-none"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </header>

      {/* Scrollable map — explicit flex child height so the road fills the viewport */}
      <div
        ref={scrollRef}
        className={
          orientation === "horizontal"
            ? "trophy-road-scroll relative z-10 min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-contain"
            : "trophy-road-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        }
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <TrophyRoadMap
          userElo={userElo}
          orientation={orientation}
          className={orientation === "horizontal" ? "h-full min-h-[360px]" : undefined}
        />
      </div>

      {/* Footer hint */}
      <div className="relative z-20 shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-[11px] font-semibold text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
        Preview · colectarea recompenselor vine în curând
      </div>
    </motion.div>,
    document.body,
  )
}
