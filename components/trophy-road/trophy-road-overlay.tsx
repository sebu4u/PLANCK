"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Lilita_One } from "next/font/google"
import { motion, useReducedMotion } from "framer-motion"
import { Trophy, X } from "lucide-react"
import { getNextMilestone } from "@/lib/trophy-road/milestones"
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

  const next = getNextMilestone(userElo)
  const trophiesNeeded = next ? Math.max(0, next.threshold - userElo) : 0

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
    if (!open || didScrollRef.current) return

    const findFocusMarker = (scroller: HTMLElement) => {
      const markers = Array.from(
        scroller.querySelectorAll<HTMLElement>("[data-trophy-road-marker]"),
      )
      if (markers.length === 0) return null

      if (next) {
        const nextMarker = markers.find(
          (el) => Number(el.dataset.threshold ?? 0) === next.threshold,
        )
        if (nextMarker) return nextMarker
      }

      const claimed = markers.filter(
        (el) => Number(el.dataset.threshold ?? 0) <= userElo,
      )
      return claimed[claimed.length - 1] ?? markers[0]
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
  }, [open, userElo, next, reduceMotion])

  if (!open || !mounted) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[560] flex h-[100dvh] w-screen flex-col overflow-hidden bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Trophy Road"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <header className="relative z-20 flex shrink-0 items-start justify-between gap-3 border-b border-[#eee] bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <h2
            className={`${lilita.className} text-2xl leading-none text-[#1a0a4a] sm:text-3xl`}
          >
            Trophy Road
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#666]">
            Recompense permanente pe baza trofeelor tale
          </p>
          <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a] px-3 py-1 text-sm font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.15)]">
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

      <div
        ref={scrollRef}
        className="trophy-road-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6">
          <TrophyRoadMap userElo={userElo} />
        </div>
      </div>

      <div className="relative z-20 shrink-0 border-t border-[#eee] bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-[11px] font-semibold text-[#888]">
        Preview · colectarea recompenselor vine în curând
      </div>
    </motion.div>,
    document.body,
  )
}
