"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  buildTrophyRoadClimbItems,
  type TrophyRoadClimbItem,
} from "@/lib/trophy-road/map-layout"
import {
  getMilestoneNodeState,
  getNextMilestone,
  type TrophyRoadMilestone,
} from "@/lib/trophy-road/types"
import {
  TrophyRoadCircleNode,
  TrophyRoadRewardChip,
} from "./trophy-road-reward-node"

const POP_STAGGER_MS = 28

function ClimbMarker({
  item,
  userElo,
  milestones,
  trophiesNeeded,
  visualIndex,
  claimingId,
  onClaim,
}: {
  item: TrophyRoadClimbItem
  userElo: number
  milestones: readonly TrophyRoadMilestone[]
  trophiesNeeded?: number
  visualIndex: number
  claimingId?: string | null
  onClaim?: (milestoneId: string) => void
}) {
  const state = getMilestoneNodeState(item, userElo, milestones)
  const isLeft = item.side === "left"

  const chip = (
    <TrophyRoadRewardChip
      milestone={item}
      state={state}
      trophiesNeeded={state === "current" ? trophiesNeeded : undefined}
      side={item.side}
      claiming={claimingId === item.id}
      onClaim={onClaim}
    />
  )

  return (
    <div
      data-trophy-road-marker={item.id}
      data-threshold={item.threshold}
      className={cn(
        "trophy-road-row relative z-[2] scroll-my-24",
        (state === "current" || state === "claimable") && "z-[4]",
      )}
      style={{
        animationDelay: `${Math.min(visualIndex, 16) * POP_STAGGER_MS}ms`,
        contentVisibility: "auto",
        containIntrinsicSize: "100% 120px",
      }}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 burger:gap-x-8">
        <div
          className={cn(
            "min-w-0 burger:max-w-[280px]",
            isLeft ? "justify-self-end" : "invisible",
          )}
        >
          {isLeft ? chip : null}
        </div>

        <div className="relative z-[5] justify-self-center">
          <TrophyRoadCircleNode milestone={item} state={state} />
        </div>

        <div
          className={cn(
            "min-w-0 burger:max-w-[280px]",
            !isLeft ? "justify-self-start" : "invisible",
          )}
        >
          {!isLeft ? chip : null}
        </div>
      </div>
    </div>
  )
}

interface TrophyRoadMapProps {
  userElo: number
  milestones: TrophyRoadMilestone[]
  claimingId?: string | null
  onClaim?: (milestoneId: string) => void
  className?: string
}

export function TrophyRoadMap({
  userElo,
  milestones,
  claimingId,
  onClaim,
  className,
}: TrophyRoadMapProps) {
  const items = useMemo(() => buildTrophyRoadClimbItems(milestones), [milestones])
  const next = getNextMilestone(userElo, milestones)
  const trophiesNeeded = next ? Math.max(0, next.threshold - userElo) : undefined
  const summitThreshold = items[0]?.threshold ?? 15_000

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-3xl px-2 pb-10 pt-6 burger:max-w-4xl burger:px-6",
        className,
      )}
    >
      <div className="mb-8 flex flex-col items-center gap-1 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a8aa0]">
          Summit
        </span>
        <span className="text-sm font-black text-[#1e2a3a]">
          {summitThreshold.toLocaleString("ro-RO")} trofee
        </span>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/2 top-2 z-0 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ffd84d]/70 via-[#9ec5ff]/55 to-[#7dd3a8]/60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/2 top-2 z-0 w-[3px] -translate-x-1/2 rounded-full bg-white/50"
        />

        <div className="relative z-[1] flex flex-col gap-y-20 burger:gap-y-24">
          {items.map((item, visualIndex) => (
            <ClimbMarker
              key={item.id}
              item={item}
              userElo={userElo}
              milestones={milestones}
              trophiesNeeded={trophiesNeeded}
              visualIndex={visualIndex}
              claimingId={claimingId}
              onClaim={onClaim}
            />
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-1 text-center">
        <span className="inline-flex h-3 w-3 rounded-full bg-[#34d399] shadow-[0_0_0_6px_rgba(52,211,153,0.25)]" />
        <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a8aa0]">
          Start
        </span>
        <span className="text-sm font-black text-[#1e2a3a]">0 trofee</span>
      </div>
    </div>
  )
}
