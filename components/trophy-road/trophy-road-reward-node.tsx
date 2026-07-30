"use client"

import { Check, Coins, Frame, Lock, Snowflake, Sparkles, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatMilestoneAmount,
  getRewardKindLabel,
  type TrophyRoadMilestone,
  type TrophyRoadNodeState,
} from "@/lib/trophy-road/milestones"

function RewardIcon({
  kind,
  className,
}: {
  kind: TrophyRoadMilestone["kind"]
  className?: string
}) {
  const shared = cn(className)
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

function nodeColors(state: TrophyRoadNodeState) {
  if (state === "claimed") {
    return {
      face: "bg-emerald-500 text-white",
      depth: "bg-emerald-700",
    }
  }
  if (state === "current") {
    return {
      face: "bg-[#ffc800] text-[#3d2800]",
      depth: "bg-[#9a6800]",
    }
  }
  return {
    face: "bg-[#5020F0] text-white",
    depth: "bg-[#1a0a4a]",
  }
}

export function TrophyRoadCircleNode({
  milestone,
  state,
  size = "md",
}: {
  milestone: TrophyRoadMilestone
  state: TrophyRoadNodeState
  size?: "md" | "lg"
}) {
  const colors = nodeColors(state)
  const isSpecial = milestone.kind === "special"
  const isLg = size === "lg"

  return (
    <div
      data-map-node={milestone.id}
      className={cn(
        "relative shrink-0",
        isLg ? "h-[104px] w-[104px]" : "h-[72px] w-[72px]",
        state === "current" && "fizica-map-node-glow",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-full",
          isLg ? "h-[96px]" : "h-[66px]",
          colors.depth,
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-center rounded-full shadow-[inset_0_2px_0_rgba(255,255,255,0.22)]",
          isLg ? "h-[96px]" : "h-[66px]",
          colors.face,
          isSpecial && state === "locked" && "bg-[#3a12c4]",
        )}
      >
        {state === "claimed" ? (
          <Check className={isLg ? "h-10 w-10" : "h-7 w-7"} strokeWidth={3} />
        ) : state === "locked" ? (
          <Lock className={isLg ? "h-9 w-9 opacity-90" : "h-6 w-6 opacity-90"} strokeWidth={2.5} />
        ) : (
          <Trophy className={isLg ? "h-10 w-10" : "h-7 w-7"} strokeWidth={2.5} />
        )}
      </div>
    </div>
  )
}

export function TrophyRoadRewardCard({
  milestone,
  state,
  trophiesNeeded,
  compact = false,
  size = "md",
}: {
  milestone: TrophyRoadMilestone
  state: TrophyRoadNodeState
  trophiesNeeded?: number
  compact?: boolean
  size?: "md" | "lg"
}) {
  const isClaimed = state === "claimed"
  const isCurrent = state === "current"
  const isLocked = state === "locked"
  const isSpecial = milestone.kind === "special"
  const amountLabel = formatMilestoneAmount(milestone)
  const isLg = size === "lg" && !compact

  return (
    <article
      data-map-card={milestone.id}
      className={cn(
        "relative z-[3] flex flex-col rounded-2xl border-[3px] border-b-[6px]",
        compact
          ? "h-[100px] max-w-none px-4 py-2.5"
          : isLg
            ? "h-[176px] w-[min(100%,340px)] px-5 py-4"
            : "h-[132px] w-[min(100%,280px)] px-4 py-3",
        isCurrent
          ? "border-[#ffc800] border-b-[#c68a00] bg-[#ffc800] text-[#2a1f00]"
          : isClaimed
            ? "border-[#34d399] border-b-[#059669] bg-[#ecfdf5] text-[#065f46]"
            : isSpecial
              ? "border-[#6a2cff] border-b-[#1a0a4a] bg-[#5020F0] text-[#f3e8ff]"
              : "border-[#2b5797] border-b-[#143660] bg-[#234a7a] text-[#d8e8ff]",
        isLocked && !isSpecial && "opacity-70",
      )}
    >
      <div className={cn("flex items-start", isLg ? "gap-4" : "gap-3")}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border-2",
            isLg ? "h-14 w-14 rounded-2xl" : "h-11 w-11",
            isCurrent
              ? "border-[#9a6800] bg-[#c68a00]"
              : isClaimed
                ? "border-emerald-600 bg-emerald-500"
                : "border-black/20 bg-black/15",
          )}
        >
          <RewardIcon
            kind={milestone.kind}
            className={cn(
              isLg ? "h-8 w-8" : "h-6 w-6",
              isCurrent && "!text-[#2a1f00]",
              isClaimed && "!text-white",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-bold uppercase tracking-wide",
              isLg ? "text-xs" : "text-[10px]",
              isCurrent ? "text-[#6b4a00]" : isClaimed ? "text-emerald-700" : "text-white/70",
            )}
          >
            {getRewardKindLabel(milestone.kind)}
          </p>
          <h3
            className={cn(
              "line-clamp-2 font-bold leading-snug",
              isLg ? "text-base" : "text-sm",
              isCurrent ? "text-[#2a1f00]" : isClaimed ? "text-[#065f46]" : "text-white",
            )}
          >
            {milestone.label}
            {milestone.kind === "coins" || milestone.kind === "elo_boost" || milestone.kind === "freeze"
              ? ` · ${amountLabel}`
              : null}
          </h3>
        </div>
      </div>

      <div className={cn("mt-auto flex flex-wrap items-center gap-2", isLg ? "pt-3" : "pt-2")}>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg font-bold",
            isLg ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs",
            isCurrent
              ? "bg-[#c68a00] text-white"
              : isClaimed
                ? "bg-emerald-500 text-white"
                : "bg-black/20 text-white/90",
          )}
        >
          <Trophy className={isLg ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2.5} />
          {milestone.threshold.toLocaleString("ro-RO")}
        </span>
        {isClaimed ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-lg bg-emerald-500 font-bold uppercase tracking-wide text-white",
              isLg ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            Deblocat
          </span>
        ) : isCurrent && trophiesNeeded != null && trophiesNeeded > 0 ? (
          <span
            className={cn(
              "rounded-lg bg-[#c68a00] font-bold text-white",
              isLg ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
            )}
          >
            încă {trophiesNeeded.toLocaleString("ro-RO")}
          </span>
        ) : isLocked ? (
          <span
            className={cn(
              "rounded-lg bg-black/20 font-bold uppercase tracking-wide text-white/80",
              isLg ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
            )}
          >
            Blocat
          </span>
        ) : null}
      </div>
    </article>
  )
}
