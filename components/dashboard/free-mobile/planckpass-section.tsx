"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePlanckPass } from "@/hooks/use-planckpass"
import { PlanckPassBgPattern } from "./planckpass-bg-pattern"
import { PlanckPassClaimReveal } from "./planckpass-claim-reveal"
import {
  PLANCKPASS_CARD_GAP,
  PLANCKPASS_CARD_WIDTH,
  PLANCKPASS_SIDE_PAD,
} from "./planckpass-layout"
import { PlanckPassProgressTrack } from "./planckpass-progress-track"
import { PlanckPassRewardCard } from "./planckpass-reward-card"

interface PlanckPassSectionProps {
  className?: string
}

export function PlanckPassSection({ className }: PlanckPassSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { state, loading, claiming, reveal, claim, dismissReveal, error } = usePlanckPass()
  const {
    season,
    currentTier,
    xpCurrent,
    xpMax,
    tiers,
  } = state
  const seasonTitle = season?.title ?? "PLANCKPASS"
  const xpPct = xpMax > 0 ? Math.min(100, Math.round((xpCurrent / xpMax) * 100)) : 0
  const displayTiers = tiers.length > 0 ? tiers : []

  useEffect(() => {
    const el = scrollRef.current
    if (!el || currentTier <= 0) return
    const step = PLANCKPASS_CARD_WIDTH + PLANCKPASS_CARD_GAP
    const targetLeft =
      PLANCKPASS_SIDE_PAD + (currentTier - 1) * step - el.clientWidth * 0.35
    el.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" })
  }, [currentTier, displayTiers.length])

  return (
    <section
      className={cn(
        "relative flex h-full flex-col overflow-hidden select-none",
        className,
      )}
      aria-label={seasonTitle}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#6a2cff_0%,#5020F0_45%,#3a12c4_100%)]"
      />
      <PlanckPassBgPattern />

      <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-3 pb-1 pt-2.5">
        <h2 className="title-font max-w-[55%] text-[13px] italic leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-sm">
          {loading ? "Se încarcă…" : seasonTitle}
        </h2>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <div className="min-w-0 flex-1 max-w-[140px]">
            <div className="mb-0.5 flex items-center justify-between gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-yellow-300">
                XP
              </span>
              <span className="truncate text-[9px] font-bold text-white/90">
                {xpCurrent}/{xpMax}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a] shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ffd000] to-[#ffb800] shadow-[0_0_6px_rgba(255,208,0,0.5)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[3px] border-[#1a0a4a] bg-[#ffd000] text-sm font-black text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a]">
            {currentTier}
          </div>
        </div>
      </div>

      {error ? (
        <p className="relative z-10 shrink-0 px-3 text-[10px] font-semibold text-red-200">{error}</p>
      ) : null}

      {!loading && displayTiers.length === 0 ? (
        <p className="relative z-10 px-3 pt-6 text-center text-xs font-semibold text-white/80">
          Niciun sezon activ încă.
        </p>
      ) : null}

      <div
        ref={scrollRef}
        className="scrollbar-hide relative z-10 min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        <div
          className="flex h-full min-h-full flex-col justify-center"
          style={{
            width:
              PLANCKPASS_SIDE_PAD * 2 +
              Math.max(displayTiers.length, 1) * PLANCKPASS_CARD_WIDTH +
              Math.max(displayTiers.length - 1, 0) * PLANCKPASS_CARD_GAP,
          }}
        >
          <div
            className="flex items-end"
            style={{
              paddingLeft: PLANCKPASS_SIDE_PAD,
              paddingRight: PLANCKPASS_SIDE_PAD,
              gap: PLANCKPASS_CARD_GAP,
            }}
          >
            {displayTiers.map((tier) => (
              <PlanckPassRewardCard
                key={tier.tier}
                tier={tier}
                currentTier={currentTier}
                claiming={claiming}
                onClaim={(t) => {
                  void claim(t.tier).catch(() => {})
                }}
              />
            ))}
          </div>

          {displayTiers.length > 0 ? (
            <div className="mt-2">
              <PlanckPassProgressTrack
                tierCount={displayTiers.length}
                currentTier={Math.max(currentTier, 1)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {reveal ? <PlanckPassClaimReveal reward={reveal} onClose={dismissReveal} /> : null}
    </section>
  )
}
