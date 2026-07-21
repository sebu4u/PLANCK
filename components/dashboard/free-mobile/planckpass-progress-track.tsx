"use client"

import { cn } from "@/lib/utils"
import {
  PLANCKPASS_CARD_GAP,
  PLANCKPASS_CARD_HEIGHT,
  PLANCKPASS_CARD_WIDTH,
  PLANCKPASS_SIDE_PAD,
  PLANCKPASS_VERTICAL_SIDE_PAD,
} from "./planckpass-layout"

interface PlanckPassProgressTrackProps {
  tierCount: number
  currentTier: number
  orientation?: "horizontal" | "vertical"
  /** Override vertical card metrics (desktop uses larger cards) */
  cardHeight?: number
  cardGap?: number
  className?: string
}

export function PlanckPassProgressTrack({
  tierCount,
  currentTier,
  orientation = "horizontal",
  cardHeight = PLANCKPASS_CARD_HEIGHT,
  cardGap = PLANCKPASS_CARD_GAP,
  className,
}: PlanckPassProgressTrackProps) {
  const progressRatio = Math.min(
    1,
    Math.max(0, (currentTier - 1) / Math.max(1, tierCount - 1)),
  )

  if (orientation === "vertical") {
    const step = cardHeight + cardGap
    const trackHeight =
      PLANCKPASS_VERTICAL_SIDE_PAD * 2 +
      tierCount * cardHeight +
      (tierCount - 1) * cardGap
    const filledHeight =
      PLANCKPASS_VERTICAL_SIDE_PAD +
      progressRatio * (trackHeight - PLANCKPASS_VERTICAL_SIDE_PAD * 2)

    return (
      <div className={cn("relative w-8 shrink-0", className)} style={{ height: trackHeight }}>
        <div
          className="absolute bottom-0 top-0 left-1/2 w-[6px] -translate-x-1/2 rounded-full bg-[#2a1570]"
          style={{
            marginTop: PLANCKPASS_VERTICAL_SIDE_PAD,
            marginBottom: PLANCKPASS_VERTICAL_SIDE_PAD,
          }}
        />
        <div
          className="absolute left-1/2 top-0 w-[6px] -translate-x-1/2 rounded-full bg-[#ffd000] shadow-[0_0_8px_rgba(255,208,0,0.55)]"
          style={{
            marginTop: PLANCKPASS_VERTICAL_SIDE_PAD,
            height: Math.max(0, filledHeight - PLANCKPASS_VERTICAL_SIDE_PAD),
          }}
        />

        {Array.from({ length: tierCount }, (_, i) => {
          const tier = i + 1
          const reached = tier <= currentTier
          const top = PLANCKPASS_VERTICAL_SIDE_PAD + i * step + cardHeight / 2

          return (
            <div
              key={tier}
              className={cn(
                "absolute left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[16px] font-bold leading-none text-white shadow-md",
                reached ? "bg-[#ffd000]" : "bg-[#4a2bb8]",
              )}
              style={{
                top,
                WebkitTextStroke: "1px black",
                paintOrder: "stroke fill",
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

  const step = PLANCKPASS_CARD_WIDTH + PLANCKPASS_CARD_GAP
  const trackWidth =
    PLANCKPASS_SIDE_PAD * 2 +
    tierCount * PLANCKPASS_CARD_WIDTH +
    (tierCount - 1) * PLANCKPASS_CARD_GAP
  const filledWidth =
    PLANCKPASS_SIDE_PAD + progressRatio * (trackWidth - PLANCKPASS_SIDE_PAD * 2)

  return (
    <div className={cn("relative h-8", className)} style={{ width: trackWidth }}>
      {/* Base track */}
      <div
        className="absolute left-0 right-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#2a1570]"
        style={{ marginLeft: PLANCKPASS_SIDE_PAD, marginRight: PLANCKPASS_SIDE_PAD }}
      />
      {/* Filled yellow progress */}
      <div
        className="absolute left-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#ffd000] shadow-[0_0_8px_rgba(255,208,0,0.55)]"
        style={{
          marginLeft: PLANCKPASS_SIDE_PAD,
          width: Math.max(0, filledWidth - PLANCKPASS_SIDE_PAD),
        }}
      />

      {Array.from({ length: tierCount }, (_, i) => {
        const tier = i + 1
        const reached = tier <= currentTier
        const left = PLANCKPASS_SIDE_PAD + i * step + PLANCKPASS_CARD_WIDTH / 2

        return (
          <div
            key={tier}
            className={cn(
              "absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[16px] font-bold leading-none text-white shadow-md",
              reached ? "bg-[#ffd000]" : "bg-[#4a2bb8]",
            )}
            style={{
              left,
              WebkitTextStroke: "1px black",
              paintOrder: "stroke fill",
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
