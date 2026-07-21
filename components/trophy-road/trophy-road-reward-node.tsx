"use client"

import {
  Coins,
  Frame,
  Lock,
  Snowflake,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatMilestoneAmount,
  type TrophyRoadMilestone,
  type TrophyRoadNodeState,
} from "@/lib/trophy-road/milestones"

interface TrophyRoadRewardNodeProps {
  milestone: TrophyRoadMilestone
  state: TrophyRoadNodeState
  orientation: "horizontal" | "vertical"
  /** Offset along the path axis (px from start) */
  offset: number
  /** Distance remaining until unlock — only for current node */
  trophiesNeeded?: number
}

function RewardIcon({
  kind,
  className,
}: {
  kind: TrophyRoadMilestone["kind"]
  className?: string
}) {
  const shared = cn("drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]", className)
  switch (kind) {
    case "coins":
      return <Coins className={cn(shared, "text-amber-300")} strokeWidth={2.5} />
    case "elo_boost":
      return <Zap className={cn(shared, "text-yellow-300")} strokeWidth={2.5} />
    case "freeze":
      return <Snowflake className={cn(shared, "text-sky-300")} strokeWidth={2.5} />
    case "cosmetic":
      return <Frame className={cn(shared, "text-fuchsia-200")} strokeWidth={2.5} />
    case "special":
      return <Sparkles className={cn(shared, "text-violet-200")} strokeWidth={2.5} />
  }
}

export function TrophyRoadRewardNode({
  milestone,
  state,
  orientation,
  offset,
  trophiesNeeded,
}: TrophyRoadRewardNodeProps) {
  const isSpecial = milestone.kind === "special"
  const isLocked = state === "locked"
  const isCurrent = state === "current"
  const amountLabel = formatMilestoneAmount(milestone)

  const positionStyle =
    orientation === "horizontal"
      ? { left: offset, top: "50%" as const }
      : { top: offset, left: "50%" as const }

  return (
    <div
      data-trophy-road-node={milestone.id}
      data-threshold={milestone.threshold}
      className={cn(
        "trophy-road-node absolute z-10 flex flex-col items-center",
        orientation === "horizontal"
          ? "-translate-x-1/2 -translate-y-1/2"
          : "-translate-x-1/2 -translate-y-1/2",
        isCurrent && "z-20",
      )}
      style={{
        ...positionStyle,
        contentVisibility: "auto",
        containIntrinsicSize: isSpecial ? "120px 140px" : "88px 110px",
      }}
    >
      {/* Quantity / label pill */}
      <div
        className={cn(
          "mb-1 max-w-[7.5rem] truncate rounded-md border-2 border-[#1a0a4a] px-1.5 py-0.5 text-center text-[10px] font-black leading-tight text-white shadow-[0_2px_0_#1a0a4a]",
          isSpecial ? "bg-[#3a12c4]" : "bg-[#1a0a4a]",
          isLocked && "opacity-70",
        )}
        title={amountLabel}
      >
        {amountLabel}
      </div>

      {/* Reward visual */}
      {isSpecial ? (
        <div
          className={cn(
            "relative flex w-[4.75rem] flex-col overflow-hidden rounded-xl border-[3px] border-[#1a0a4a] shadow-[0_6px_0_rgba(0,0,0,0.25)]",
            isLocked && "grayscale-[0.35] opacity-80",
            isCurrent && "ring-2 ring-[#ffd000] ring-offset-2 ring-offset-transparent",
          )}
        >
          <div className="bg-[#5020F0] px-1 py-0.5 text-center text-[8px] font-black uppercase tracking-wide text-white">
            Unlock
          </div>
          <div className="relative flex h-14 items-center justify-center bg-gradient-to-b from-[#6a2cff] to-[#3a12c4]">
            <RewardIcon kind={milestone.kind} className="h-8 w-8" />
            {isLocked ? (
              <Lock className="absolute bottom-1 right-1 h-3.5 w-3.5 text-white/90" strokeWidth={2.5} />
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-[#1a0a4a] bg-gradient-to-b from-[#6a2cff] to-[#3a12c4] shadow-[0_6px_0_rgba(0,0,0,0.25)]",
            isLocked && "grayscale-[0.35] opacity-80",
            isCurrent && "ring-2 ring-[#ffd000] ring-offset-2 ring-offset-transparent",
            state === "claimed" && "from-emerald-400 to-emerald-600",
          )}
        >
          <RewardIcon kind={milestone.kind} className="h-7 w-7" />
          {isLocked ? (
            <Lock className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#1a0a4a] p-0.5 text-white" strokeWidth={2.5} />
          ) : null}
        </div>
      )}

      {/* Soft ground shadow */}
      <div
        className="mt-1 h-2 w-10 rounded-[100%] bg-black/25 blur-[2px]"
        aria-hidden
      />

      {/* Threshold */}
      <div className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-black text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
        <Trophy className="h-3 w-3 text-[#ffd000]" strokeWidth={2.5} />
        {milestone.threshold.toLocaleString("ro-RO")}
      </div>

      {isCurrent && trophiesNeeded != null && trophiesNeeded > 0 ? (
        <div className="mt-1 rounded-full border-2 border-[#1a0a4a] bg-[#ffd000] px-2 py-0.5 text-[9px] font-black text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a]">
          încă {trophiesNeeded.toLocaleString("ro-RO")}
        </div>
      ) : null}
    </div>
  )
}
