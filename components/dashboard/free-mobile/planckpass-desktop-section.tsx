"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePlanckPass } from "@/hooks/use-planckpass"
import { PlanckPassBgPattern } from "./planckpass-bg-pattern"
import { PlanckPassClaimReveal } from "./planckpass-claim-reveal"
import {
  PLANCKPASS_DESKTOP_CARD_GAP,
  PLANCKPASS_DESKTOP_CARD_HEIGHT,
  PLANCKPASS_DESKTOP_CARD_WIDTH,
  PLANCKPASS_VERTICAL_SIDE_PAD,
  planckPassDesktopCardSide,
} from "./planckpass-layout"
import { PlanckPassProgressTrack } from "./planckpass-progress-track"
import { PlanckPassRewardCard } from "./planckpass-reward-card"

interface PlanckPassDesktopSectionProps {
  className?: string
}

export function PlanckPassDesktopSection({ className }: PlanckPassDesktopSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { state, loading, claiming, reveal, claim, dismissReveal, error } = usePlanckPass()
  const { season, currentTier, xpCurrent, xpMax, tiers } = state
  const seasonTitle = season?.title ?? "PLANCKPASS"
  const xpPct = xpMax > 0 ? Math.min(100, Math.round((xpCurrent / xpMax) * 100)) : 0
  const displayTiers = tiers.length > 0 ? tiers : []

  useEffect(() => {
    const el = scrollRef.current
    if (!el || currentTier <= 0) return
    const step = PLANCKPASS_DESKTOP_CARD_HEIGHT + PLANCKPASS_DESKTOP_CARD_GAP
    const targetTop =
      PLANCKPASS_VERTICAL_SIDE_PAD +
      (currentTier - 1) * step -
      el.clientHeight * 0.3
    el.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" })
  }, [currentTier, displayTiers.length])

  return (
    <section
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden select-none",
        className,
      )}
      aria-label={seasonTitle}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#6a2cff_0%,#5020F0_45%,#3a12c4_100%)]"
      />
      <PlanckPassBgPattern />

      <div className="relative z-10 flex shrink-0 flex-col gap-2 px-4 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="title-font text-base italic leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] lg:text-lg">
            {loading ? "Se încarcă…" : seasonTitle}
          </h2>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-[3px] border-[#1a0a4a] bg-[#ffd000] text-base font-black text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a]">
            {currentTier}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
              XP
            </span>
            <span className="text-[10px] font-bold text-white/90">
              {xpCurrent}/{xpMax}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a] shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ffd000] to-[#ffb800] shadow-[0_0_6px_rgba(255,208,0,0.5)]"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="relative z-10 shrink-0 px-4 text-xs font-semibold text-red-200">{error}</p>
      ) : null}

      {!loading && displayTiers.length === 0 ? (
        <p className="relative z-10 px-4 pt-8 text-center text-sm font-semibold text-white/80">
          Niciun sezon activ încă.
        </p>
      ) : null}

      <div
        ref={scrollRef}
        className="scrollbar-hide relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-2 pb-4"
      >
        {displayTiers.length > 0 ? (
          <div
            className="relative mx-auto"
            style={{
              width: PLANCKPASS_DESKTOP_CARD_WIDTH * 2 + 32 + 12,
            }}
          >
            {/* Center progress track — height includes vertical side pads */}
            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
              <PlanckPassProgressTrack
                orientation="vertical"
                tierCount={displayTiers.length}
                currentTier={Math.max(currentTier, 1)}
                cardHeight={PLANCKPASS_DESKTOP_CARD_HEIGHT}
                cardGap={PLANCKPASS_DESKTOP_CARD_GAP}
              />
            </div>

            {/* Cards zigzag left / right of the track */}
            <div
              className="relative flex flex-col"
              style={{
                gap: PLANCKPASS_DESKTOP_CARD_GAP,
                paddingTop: PLANCKPASS_VERTICAL_SIDE_PAD,
                paddingBottom: PLANCKPASS_VERTICAL_SIDE_PAD,
              }}
            >
              {displayTiers.map((tier) => {
                const side = planckPassDesktopCardSide(tier.tier)
                return (
                  <div
                    key={tier.tier}
                    className="flex w-full items-center"
                    style={{ height: PLANCKPASS_DESKTOP_CARD_HEIGHT }}
                  >
                    <div className="flex flex-1 justify-end pr-2">
                      {side === "left" ? (
                        <PlanckPassRewardCard
                          size="desktop"
                          tier={tier}
                          currentTier={currentTier}
                          claiming={claiming}
                          onClaim={(t) => {
                            void claim(t.tier).catch(() => {})
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="w-8 shrink-0" aria-hidden />
                    <div className="flex flex-1 justify-start pl-2">
                      {side === "right" ? (
                        <PlanckPassRewardCard
                          size="desktop"
                          tier={tier}
                          currentTier={currentTier}
                          claiming={claiming}
                          onClaim={(t) => {
                            void claim(t.tier).catch(() => {})
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {reveal ? <PlanckPassClaimReveal reward={reveal} onClose={dismissReveal} /> : null}
    </section>
  )
}
