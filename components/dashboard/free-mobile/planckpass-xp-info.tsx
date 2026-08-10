"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { BookOpen, Pencil, X, Zap } from "lucide-react"
import { PLANCKPASS_XP } from "@/lib/planckpass/xp"

interface PlanckPassXpInfoProps {
  xpTotal: number
  xpCurrent: number
  xpMax: number
  currentTier: number
  onClose: () => void
}

const WAYS = [
  {
    label: "Probleme ușoare",
    xp: PLANCKPASS_XP.problemEasy,
    href: "/probleme",
  },
  {
    label: "Probleme medii",
    xp: PLANCKPASS_XP.problemMedium,
    href: "/probleme",
  },
  {
    label: "Probleme grele",
    xp: PLANCKPASS_XP.problemHard,
    href: "/probleme",
  },
  {
    label: "Lecții pe traseu",
    xp: PLANCKPASS_XP.lpItem,
    href: "/invata",
  },
  {
    label: "Exerciții interactive",
    xp: PLANCKPASS_XP.lpInteractive,
    href: "/invata",
  },
  {
    label: "Teste pe traseu",
    xp: PLANCKPASS_XP.lpTest,
    href: "/invata",
  },
] as const

export function PlanckPassXpInfo({
  xpTotal,
  xpCurrent,
  xpMax,
  currentTier,
  onClose,
}: PlanckPassXpInfoProps) {
  const reduceMotion = useReducedMotion()
  const xpPct = xpMax > 0 ? Math.min(100, Math.round((xpCurrent / xpMax) * 100)) : 0

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[550] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Informații XP PlanckPass"
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border-[3px] border-[#1a0a4a] bg-[linear-gradient(165deg,#6a2cff_0%,#5020F0_50%,#3a12c4_100%)] shadow-[0_12px_0_#1a0a4a,0_20px_50px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1a0a4a] bg-white/90 text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a] active:translate-y-px active:shadow-none"
        >
          <X className="h-4 w-4" strokeWidth={2.75} />
        </button>

        <div className="px-5 pb-5 pt-5">
          <div className="mb-4 flex items-center gap-2 pr-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-[3px] border-[#1a0a4a] bg-[#ffd000] shadow-[0_2px_0_#1a0a4a]">
              <Zap className="h-4 w-4 text-[#1a0a4a]" strokeWidth={2.75} fill="currentColor" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                PlanckPass
              </p>
              <h2 className="title-font text-lg italic leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
                Experiența ta
              </h2>
            </div>
          </div>

          <div className="mb-4 rounded-xl border-[3px] border-[#1a0a4a] bg-[#1a0a4a]/45 px-4 py-3 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              XP total acumulat
            </p>
            <p className="mt-0.5 text-3xl font-black tabular-nums text-[#ffd000] drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
              {xpTotal.toLocaleString("ro-RO")}
              <span className="ml-1.5 text-sm font-black text-yellow-300/90">XP</span>
            </p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-white/75">
                  {xpCurrent >= xpMax && currentTier > 0
                    ? `Tier ${currentTier} complet`
                    : `Progres spre tier ${Math.max(currentTier + 1, 1)}`}
                </span>
                <span className="text-[10px] font-bold tabular-nums text-white/90">
                  {xpCurrent}/{xpMax}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border-2 border-[#0d0528] bg-[#0d0528]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ffd000] to-[#ffb800]"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>

          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-yellow-300">
            Cum obții mai mult XP
          </p>
          <ul className="mb-4 space-y-1.5">
            {WAYS.map((way) => (
              <li key={way.label}>
                <Link
                  href={way.href}
                  onClick={onClose}
                  className="flex items-center justify-between gap-2 rounded-lg border-2 border-[#1a0a4a]/40 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/18 active:bg-white/22"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {way.href === "/invata" ? (
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-yellow-300" strokeWidth={2.5} />
                    ) : (
                      <Pencil className="h-3.5 w-3.5 shrink-0 text-yellow-300" strokeWidth={2.5} />
                    )}
                    <span className="truncate">{way.label}</span>
                  </span>
                  <span className="shrink-0 rounded-md border border-[#1a0a4a]/50 bg-[#ffd000] px-1.5 py-0.5 text-[11px] font-black tabular-nums text-[#1a0a4a]">
                    +{way.xp}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border-[3px] border-[#1a0a4a] bg-[#ffd000] py-2.5 text-sm font-black uppercase tracking-wide text-[#1a0a4a] shadow-[0_3px_0_#1a0a4a] active:translate-y-[2px] active:shadow-[0_1px_0_#1a0a4a]"
          >
            Am înțeles
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
