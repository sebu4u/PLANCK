"use client"

import { Check, Coins, Frame, Gift, Lock, Snowflake, Sparkles, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatMilestoneAmount,
  getRewardKindLabel,
  toDisplayKind,
  type TrophyRoadMilestone,
  type TrophyRoadNodeState,
} from "@/lib/trophy-road/types"

function RewardIcon({
  kind,
  className,
}: {
  kind: TrophyRoadMilestone["kind"]
  className?: string
}) {
  switch (toDisplayKind(kind)) {
    case "coins":
      return <Coins className={cn(className, "text-amber-500")} strokeWidth={2.4} />
    case "elo_boost":
      return <Zap className={cn(className, "text-sky-500")} strokeWidth={2.4} />
    case "freeze":
      return <Snowflake className={cn(className, "text-cyan-500")} strokeWidth={2.4} />
    case "cosmetic":
      return <Frame className={cn(className, "text-rose-500")} strokeWidth={2.4} />
    case "special":
      return <Sparkles className={cn(className, "text-orange-500")} strokeWidth={2.4} />
  }
}

function nodeFaceClasses(state: TrophyRoadNodeState) {
  if (state === "claimed") {
    return "border-[#1a9f6e] bg-[#34d399] text-white shadow-[0_4px_0_#1a9f6e]"
  }
  if (state === "claimable") {
    return "border-[#d4a012] bg-[#ffd84d] text-[#4a3200] shadow-[0_4px_0_#c48900] trophy-road-node-pulse"
  }
  if (state === "current") {
    return "border-[#d4a012] bg-[#ffd84d] text-[#4a3200] shadow-[0_4px_0_#c48900] trophy-road-node-pulse"
  }
  if (state === "soon") {
    return "border-[#c5d4e8] bg-[#eef3f9] text-[#7a8aa0] shadow-[0_4px_0_#b8c8dc]"
  }
  return "border-[#c5d4e8] bg-white text-[#7a8aa0] shadow-[0_4px_0_#b8c8dc]"
}

export function TrophyRoadCircleNode({
  milestone,
  state,
}: {
  milestone: TrophyRoadMilestone
  state: TrophyRoadNodeState
}) {
  const showGift = state === "claimable"

  return (
    <div
      data-map-node={milestone.id}
      className={cn(
        "relative z-[3] flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-[3px] burger:h-[72px] burger:w-[72px]",
        nodeFaceClasses(state),
      )}
      aria-hidden
    >
      {state === "claimed" ? (
        <Check className="h-6 w-6 burger:h-7 burger:w-7" strokeWidth={3} />
      ) : showGift ? (
        <Gift className="h-6 w-6 !text-[#4a3200] burger:h-7 burger:w-7" strokeWidth={2.4} />
      ) : state === "locked" || state === "soon" ? (
        <div className="relative flex items-center justify-center">
          <RewardIcon kind={milestone.kind} className="h-6 w-6 opacity-45 burger:h-7 burger:w-7" />
          <Lock
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white text-[#7a8aa0] burger:h-4 burger:w-4"
            strokeWidth={2.5}
          />
        </div>
      ) : (
        <RewardIcon kind={milestone.kind} className="h-6 w-6 !text-[#4a3200] burger:h-7 burger:w-7" />
      )}
    </div>
  )
}

export function TrophyRoadRewardChip({
  milestone,
  state,
  trophiesNeeded,
  side,
  claiming,
  onClaim,
}: {
  milestone: TrophyRoadMilestone
  state: TrophyRoadNodeState
  trophiesNeeded?: number
  side: "left" | "right"
  claiming?: boolean
  onClaim?: (milestoneId: string) => void
}) {
  const isClaimed = state === "claimed"
  const isClaimable = state === "claimable"
  const isCurrent = state === "current"
  const isLocked = state === "locked"
  const isSoon = state === "soon"
  const amountLabel = formatMilestoneAmount({
    kind: milestone.kind,
    coinsAmount: milestone.coinsAmount,
    eloAmount: milestone.eloAmount,
    eloMultiplierMinutes: milestone.eloMultiplierMinutes,
    streakFreezeHours: milestone.streakFreezeHours,
    label: milestone.label,
  })
  const showAmount =
    milestone.configured &&
    (milestone.kind === "coins" ||
      milestone.kind === "elo" ||
      milestone.kind === "elo_2x" ||
      milestone.kind === "streak_freeze")

  return (
    <article
      data-map-card={milestone.id}
      className={cn(
        "relative z-[3] flex min-w-0 flex-col gap-1.5 rounded-2xl border-2 bg-white/90 px-3 py-2.5 backdrop-blur-sm burger:gap-2 burger:px-4 burger:py-3",
        isClaimable || isCurrent
          ? "border-[#ffd84d] shadow-[0_6px_0_rgba(196,137,0,0.35)]"
          : isClaimed
            ? "border-[#a7f3d0] shadow-[0_4px_0_rgba(26,159,110,0.2)]"
            : "border-[#e2ebf5] shadow-[0_4px_0_rgba(148,163,184,0.18)]",
        (isLocked || isSoon) && "opacity-75",
        side === "left" ? "text-right" : "text-left",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-wide burger:text-[11px]",
          isClaimable || isCurrent
            ? "text-[#9a6800]"
            : isClaimed
              ? "text-[#1a9f6e]"
              : "text-[#8a9bb0]",
        )}
      >
        {milestone.configured ? getRewardKindLabel(milestone.kind) : "Recompensă"}
      </p>

      <h3 className="text-sm font-black leading-snug text-[#1e2a3a] burger:text-base">
        {milestone.label}
        {showAmount ? ` · ${amountLabel}` : null}
      </h3>

      <div
        className={cn(
          "mt-0.5 flex flex-wrap items-center gap-1.5",
          side === "left" ? "justify-end" : "justify-start",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-bold burger:px-2 burger:text-xs",
            isClaimable || isCurrent
              ? "bg-[#ffd84d] text-[#4a3200]"
              : isClaimed
                ? "bg-[#d1fae5] text-[#065f46]"
                : "bg-[#eef3f9] text-[#5b6b7f]",
          )}
        >
          <Trophy className="h-3 w-3 burger:h-3.5 burger:w-3.5" strokeWidth={2.5} />
          {milestone.threshold.toLocaleString("ro-RO")}
        </span>

        {isClaimed ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#34d399] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white burger:px-2 burger:text-[11px]">
            <Check className="h-3 w-3" strokeWidth={3} />
            Colectat
          </span>
        ) : isClaimable ? (
          <button
            type="button"
            disabled={claiming}
            onClick={() => onClaim?.(milestone.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#1e2a3a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white transition active:translate-y-px disabled:opacity-60 burger:px-2.5 burger:text-[11px]"
          >
            <Gift className="h-3 w-3" strokeWidth={2.5} />
            {claiming ? "…" : "Colectează"}
          </button>
        ) : isSoon ? (
          <span className="rounded-lg bg-[#eef3f9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9bb0] burger:px-2 burger:text-[11px]">
            În curând
          </span>
        ) : isCurrent && trophiesNeeded != null && trophiesNeeded > 0 ? (
          <span className="rounded-lg bg-[#fff1b8] px-1.5 py-0.5 text-[10px] font-bold text-[#7a5200] burger:px-2 burger:text-[11px]">
            încă {trophiesNeeded.toLocaleString("ro-RO")}
          </span>
        ) : isLocked ? (
          <span className="rounded-lg bg-[#eef3f9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9bb0] burger:px-2 burger:text-[11px]">
            Blocat
          </span>
        ) : null}
      </div>
    </article>
  )
}
