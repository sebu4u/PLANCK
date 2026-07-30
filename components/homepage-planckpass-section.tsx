"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Coins, Snowflake, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanckPassBgPattern } from "@/components/dashboard/free-mobile/planckpass-bg-pattern"

type ShowcaseKind = "coins" | "elo" | "streak_freeze" | "badge"

type ShowcaseTier = {
  tier: number
  kind: ShowcaseKind
  label: string
  claimed: boolean
  claimable: boolean
}

type LayoutMetrics = {
  cardW: number
  cardH: number
  cardGap: number
  sidePad: number
}

/** Mobile: many cards bleed off-screen */
const MOBILE_LAYOUT: LayoutMetrics = {
  cardW: 108,
  cardH: 128,
  cardGap: 18,
  sidePad: 36,
}

/** Desktop: 5 large cards, taller purple band */
const DESKTOP_LAYOUT: LayoutMetrics = {
  cardW: 148,
  cardH: 196,
  cardGap: 28,
  sidePad: 56,
}

const CURRENT_TIER = 3
const DESKTOP_TIER_COUNT = 5

const SHOWCASE_TIERS: ShowcaseTier[] = [
  { tier: 1, kind: "coins", label: "50 monede", claimed: true, claimable: false },
  { tier: 2, kind: "elo", label: "+ELO", claimed: true, claimable: false },
  { tier: 3, kind: "badge", label: "Badge", claimed: false, claimable: true },
  { tier: 4, kind: "streak_freeze", label: "Freeze", claimed: false, claimable: false },
  { tier: 5, kind: "coins", label: "100 monede", claimed: false, claimable: false },
  { tier: 6, kind: "elo", label: "+ELO", claimed: false, claimable: false },
  { tier: 7, kind: "badge", label: "Skin", claimed: false, claimable: false },
  { tier: 8, kind: "coins", label: "200 monede", claimed: false, claimable: false },
  { tier: 9, kind: "streak_freeze", label: "Freeze", claimed: false, claimable: false },
  { tier: 10, kind: "badge", label: "Badge", claimed: false, claimable: false },
  { tier: 11, kind: "elo", label: "+ELO", claimed: false, claimable: false },
  { tier: 12, kind: "coins", label: "300 monede", claimed: false, claimable: false },
]

function RewardIcon({
  kind,
  claimable,
  large,
}: {
  kind: ShowcaseKind
  claimable?: boolean
  large?: boolean
}) {
  const cls = cn(
    "drop-shadow-sm",
    large ? "h-11 w-11" : "h-9 w-9",
    claimable ? "text-[#1a0a4a]" : null,
  )
  switch (kind) {
    case "coins":
      return <Coins className={cn(cls, !claimable && "text-amber-300")} strokeWidth={2.5} />
    case "elo":
      return <Zap className={cn(cls, !claimable && "text-yellow-300")} strokeWidth={2.5} />
    case "streak_freeze":
      return <Snowflake className={cn(cls, !claimable && "text-sky-300")} strokeWidth={2.5} />
    case "badge":
      return <Sparkles className={cn(cls, !claimable && "text-fuchsia-300")} strokeWidth={2.5} />
  }
}

function ShowcaseCard({
  tier,
  layout,
  large,
}: {
  tier: ShowcaseTier
  layout: LayoutMetrics
  large?: boolean
}) {
  const dimmed = !tier.claimed && !tier.claimable
  const claimable = tier.claimable

  return (
    <div
      className="relative shrink-0"
      style={{ width: layout.cardW, height: layout.cardH }}
      aria-label={`Tier ${tier.tier}: ${tier.label}${tier.claimed ? ", revendicat" : claimable ? ", gata de revendicat" : ", blocat"}`}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-[12px]",
          claimable ? "bg-[#8a5a00]" : "bg-[#1a0a4a]",
        )}
        style={{ transform: "skewX(-12deg) translate(3px, 4px)" }}
      />

      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[12px] border-2",
          claimable
            ? "planckpass-claimable-card border-[#ffd000]"
            : "border-[#2a1570] bg-gradient-to-b from-[#7c4dff] to-[#4a1fd6]",
          dimmed && "opacity-55",
        )}
        style={{ transform: "skewX(-12deg)" }}
      >
        {claimable ? <span aria-hidden className="planckpass-claimable-shine" /> : null}

        <div
          className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1 px-2"
          style={{ transform: "skewX(12deg)" }}
        >
          <RewardIcon kind={tier.kind} claimable={claimable} large={large} />
          <span
            className={cn(
              "max-w-full truncate text-center font-extrabold uppercase leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]",
              large ? "text-[13px]" : "text-[11px]",
              claimable ? "text-[#1a0a4a]" : "text-white",
            )}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {claimable ? (
        <>
          <span aria-hidden className="planckpass-claimable-spark -left-0.5 -top-1" style={{ animationDelay: "0s" }} />
          <span aria-hidden className="planckpass-claimable-spark -right-1 top-2" style={{ animationDelay: "0.35s" }} />
          <span aria-hidden className="planckpass-claimable-spark bottom-3 -left-1" style={{ animationDelay: "0.7s" }} />
          <span aria-hidden className="planckpass-claimable-spark -bottom-0.5 right-1" style={{ animationDelay: "1.05s" }} />
          <span className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#ffd000]/60 bg-[#1a0a4a] px-2 py-0.5 text-[9px] font-bold text-[#ffd000] shadow-md lg:text-[10px]">
            Gata de revendicat
          </span>
        </>
      ) : null}

      {tier.claimed ? (
        <span
          className="absolute -left-0.5 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-md lg:h-7 lg:w-7"
          aria-hidden
        >
          <Check className="h-3.5 w-3.5 text-white lg:h-4 lg:w-4" strokeWidth={3} />
        </span>
      ) : null}

      {!tier.claimed ? (
        <span className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-sm bg-emerald-400 px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-[#0a3d1f] shadow lg:text-[10px]">
          Free
        </span>
      ) : null}
    </div>
  )
}

function ShowcaseTrack({
  filled,
  tierCount,
  layout,
}: {
  filled: boolean
  tierCount: number
  layout: LayoutMetrics
}) {
  const { cardW, cardGap, sidePad } = layout
  const step = cardW + cardGap
  const trackWidth = sidePad * 2 + tierCount * cardW + (tierCount - 1) * cardGap
  const center = sidePad + (CURRENT_TIER - 1) * step + cardW / 2
  const targetFill = Math.min(center + step * 0.18, sidePad + (tierCount - 1) * step + cardW)
  const fillWidth = Math.max(0, targetFill - sidePad)
  const nodeSize = layout.cardH >= 180 ? 40 : 36

  return (
    <div className="relative" style={{ width: trackWidth, height: nodeSize }}>
      <div
        className="absolute left-0 right-0 top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-[#2a1570] lg:h-2"
        style={{ marginLeft: sidePad, marginRight: sidePad }}
      />
      <div
        className="absolute left-0 top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-[#ffd000] shadow-[0_0_8px_rgba(255,208,0,0.55)] transition-[width] duration-1000 ease-out lg:h-2"
        style={{
          marginLeft: sidePad,
          width: filled ? fillWidth : 0,
        }}
      />

      {Array.from({ length: tierCount }, (_, i) => {
        const tier = i + 1
        const reached = filled && tier <= CURRENT_TIER
        const left = sidePad + i * step + cardW / 2

        return (
          <div
            key={tier}
            className={cn(
              "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-bold leading-none text-white shadow-md transition-colors duration-500",
              reached ? "bg-[#ffd000]" : "bg-[#4a2bb8]",
            )}
            style={{
              left,
              width: nodeSize,
              height: nodeSize,
              fontSize: nodeSize >= 40 ? 19 : 17,
              WebkitTextStroke: "1px black",
              paintOrder: "stroke fill",
              transitionDelay: filled ? `${120 + i * 50}ms` : "0ms",
            }}
            aria-hidden
          >
            {tier}
          </div>
        )
      })}
    </div>
  )
}

function ShowcasePassBand({
  inView,
  tiers,
  layout,
  desktop,
}: {
  inView: boolean
  tiers: ShowcaseTier[]
  layout: LayoutMetrics
  desktop?: boolean
}) {
  const tierCount = tiers.length
  const bandWidth =
    layout.sidePad * 2 + tierCount * layout.cardW + (tierCount - 1) * layout.cardGap

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-l-2xl border border-r-0 border-white/20 shadow-[0_24px_60px_-16px_rgba(26,10,74,0.45)] ring-1 ring-black/10",
        desktop && "min-h-[340px]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#6a2cff_0%,#5020F0_45%,#3a12c4_100%)]"
      />
      <PlanckPassBgPattern />

      <div
        className={cn(
          "relative z-10 flex items-center justify-between gap-3 px-4 pb-1 pt-4 sm:px-5 sm:pt-5",
          desktop && "px-8 pb-2 pt-8",
        )}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-yellow-300 lg:text-[11px]">
            Progresul tău
          </p>
          <p className="title-font truncate text-sm italic leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-base lg:text-lg">
            PLANCKPASS
          </p>
        </div>

        <div className="flex items-center gap-2.5 pr-2 lg:gap-3 lg:pr-4">
          <div className="min-w-0">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-yellow-300 lg:text-[10px]">
                XP
              </span>
              <span className="text-[9px] font-bold text-white/90 lg:text-[10px]">180/250</span>
            </div>
            <div className="h-2.5 w-[100px] overflow-hidden rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a] shadow-inner sm:w-[130px] lg:h-3 lg:w-[160px]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ffd000] to-[#ffb800] shadow-[0_0_6px_rgba(255,208,0,0.5)] transition-[width] duration-1000 ease-out"
                style={{ width: inView ? "72%" : "0%" }}
              />
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-[3px] border-[#1a0a4a] bg-[#ffd000] text-base font-black text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a] lg:h-11 lg:w-11 lg:text-lg">
            {CURRENT_TIER}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 overflow-hidden pb-6 pt-3",
          desktop && "flex flex-1 flex-col justify-center pb-10 pt-6",
        )}
      >
        <div style={{ width: bandWidth }}>
          <div
            className="flex items-end"
            style={{
              paddingLeft: layout.sidePad,
              paddingRight: layout.sidePad,
              gap: layout.cardGap,
              minHeight: layout.cardH + (desktop ? 28 : 20),
            }}
          >
            {tiers.map((tier) => (
              <ShowcaseCard key={tier.tier} tier={tier} layout={layout} large={desktop} />
            ))}
          </div>

          <div className={cn("mt-3", desktop && "mt-5")}>
            <ShowcaseTrack filled={inView} tierCount={tierCount} layout={layout} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomePagePlanckPassSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const desktopTiers = SHOWCASE_TIERS.slice(0, DESKTOP_TIER_COUNT)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion) {
      setInView(true)
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="home-planckpass"
      className="relative overflow-hidden bg-[#f2f2f2] py-14 sm:py-16 lg:py-20"
      aria-labelledby="home-planckpass-heading"
    >
      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 transition-all duration-700 ease-out sm:px-6 lg:px-8",
          revealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        )}
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7C5CFC] sm:text-[13px]">
          PLANCKPASS
        </p>
        <h2
          id="home-planckpass-heading"
          className="mt-2 max-w-2xl text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
        >
          Cu fiecare lecție, câștigi ceva
        </h2>
      </div>

      {/* Pass band: left inset aligns with content, right edge bleeds off-screen */}
      <div
        className={cn(
          "mt-8 transition-all duration-700 ease-out delay-100 sm:mt-10",
          revealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        )}
      >
        {/* Mobile */}
        <div className="pl-4 sm:pl-6 lg:hidden">
          <ShowcasePassBand
            inView={inView}
            tiers={SHOWCASE_TIERS}
            layout={MOBILE_LAYOUT}
          />
        </div>

        {/* Desktop: 5 cards, taller band, more left space */}
        <div className="hidden pl-[max(4rem,calc((100vw-80rem)/2+4.5rem))] lg:block">
          <ShowcasePassBand
            inView={inView}
            tiers={desktopTiers}
            layout={DESKTOP_LAYOUT}
            desktop
          />
        </div>
      </div>

      <div
        className={cn(
          "relative mx-auto mt-8 max-w-7xl px-4 transition-all duration-700 ease-out delay-200 sm:mt-10 sm:px-6 lg:px-8",
          revealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        )}
      >
        <p className="max-w-2xl text-base leading-relaxed text-gray-700 sm:text-lg">
          Rezolvă probleme, termină lecții, avansezi pe PlanckPass. Recompensele vin pe măsură ce
          progresezi — monede, boost-uri și cosmetică, gratuit.
        </p>
      </div>
    </section>
  )
}
