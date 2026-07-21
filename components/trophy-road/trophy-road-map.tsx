"use client"

import { cn } from "@/lib/utils"
import {
  TROPHY_ROAD_MILESTONES,
  getMilestoneOffset,
  getMilestoneState,
  getNextMilestone,
  getProgressFillLength,
  getTrophyRoadTrackLength,
} from "@/lib/trophy-road/milestones"
import { TrophyRoadRewardNode } from "./trophy-road-reward-node"

interface TrophyRoadMapProps {
  userElo: number
  orientation: "horizontal" | "vertical"
  className?: string
}

function DecorShape({ shape }: { shape: "tree" | "crate" | "bench" }) {
  if (shape === "tree") {
    return (
      <div className="relative h-10 w-8" aria-hidden>
        <div className="absolute bottom-3 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-[#1a3a12] bg-[#3d9e3a]" />
        <div className="absolute bottom-0 left-1/2 h-4 w-2 -translate-x-1/2 rounded-sm bg-[#6b3e1a]" />
      </div>
    )
  }
  if (shape === "crate") {
    return (
      <div
        className="h-7 w-7 rounded-md border-2 border-[#5c3a14] bg-[#c4843a] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.12)]"
        aria-hidden
      />
    )
  }
  return (
    <div className="relative h-5 w-12" aria-hidden>
      <div className="absolute inset-x-1 top-0 h-2 rounded-sm border border-[#3a2a12] bg-[#8b6914]" />
      <div className="absolute bottom-0 left-1 h-3 w-1.5 rounded-sm bg-[#5c3a14]" />
      <div className="absolute bottom-0 right-1 h-3 w-1.5 rounded-sm bg-[#5c3a14]" />
    </div>
  )
}

export function TrophyRoadMap({ userElo, orientation, className }: TrophyRoadMapProps) {
  const trackLength = getTrophyRoadTrackLength(orientation)
  const fillLength = getProgressFillLength(userElo)
  const next = getNextMilestone(userElo)
  const isHorizontal = orientation === "horizontal"

  const decorItems = isHorizontal
    ? [
        { at: 0.08, side: "above" as const, shape: "tree" as const },
        { at: 0.18, side: "below" as const, shape: "crate" as const },
        { at: 0.32, side: "above" as const, shape: "bench" as const },
        { at: 0.48, side: "below" as const, shape: "tree" as const },
        { at: 0.62, side: "above" as const, shape: "crate" as const },
        { at: 0.78, side: "below" as const, shape: "bench" as const },
        { at: 0.9, side: "above" as const, shape: "tree" as const },
      ]
    : [
        { at: 0.08, side: "left" as const, shape: "tree" as const },
        { at: 0.22, side: "right" as const, shape: "crate" as const },
        { at: 0.38, side: "left" as const, shape: "bench" as const },
        { at: 0.52, side: "right" as const, shape: "tree" as const },
        { at: 0.68, side: "left" as const, shape: "crate" as const },
        { at: 0.82, side: "right" as const, shape: "bench" as const },
        { at: 0.94, side: "left" as const, shape: "tree" as const },
      ]

  return (
    <div
      className={cn("trophy-road-map relative", className)}
      style={
        isHorizontal
          ? { width: trackLength, height: "100%", minHeight: 360 }
          : { height: trackLength, width: "100%", minWidth: 280 }
      }
    >
      {/* Atmosphere layers */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,200,0.35),transparent_50%),radial-gradient(ellipse_at_80%_70%,rgba(80,180,255,0.25),transparent_45%)]" />
        <div
          className={cn(
            "absolute bg-[#5bb85a]",
            isHorizontal ? "inset-x-0 top-0 h-[42%]" : "inset-y-0 left-0 w-[38%]",
          )}
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,0,0,0.04) 18px, rgba(0,0,0,0.04) 19px)",
          }}
        />
        <div
          className={cn(
            "absolute bg-[#7ecf6e]",
            isHorizontal ? "inset-x-0 bottom-[28%] h-[30%]" : "inset-y-0 right-0 w-[34%]",
          )}
        />
        <div
          className={cn(
            "absolute bg-gradient-to-t from-[#e8c87a] via-[#d4b06a] to-[#6ec4e8]",
            isHorizontal ? "inset-x-0 bottom-0 h-[28%]" : "inset-y-0 right-0 w-[28%] opacity-90",
          )}
        />
      </div>

      {/* Decor */}
      {decorItems.map((item, i) => {
        const along = item.at * trackLength
        const style = isHorizontal
          ? {
              left: along,
              ...(item.side === "above" ? { top: "18%" } : { bottom: "22%" }),
            }
          : {
              top: along,
              ...(item.side === "left" ? { left: "10%" } : { right: "10%" }),
            }
        return (
          <div
            key={i}
            className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2 opacity-90"
            style={style}
          >
            <DecorShape shape={item.shape} />
          </div>
        )
      })}

      {/* Tiled path */}
      <div
        className={cn(
          "absolute z-[2] rounded-2xl border-[3px] border-[#9a4a5a] shadow-[0_4px_0_rgba(0,0,0,0.2)]",
          isHorizontal
            ? "left-0 right-0 top-1/2 h-[72px] -translate-y-1/2"
            : "top-0 bottom-0 left-1/2 w-[72px] -translate-x-1/2",
        )}
        style={{
          backgroundColor: "#e87888",
          backgroundImage: isHorizontal
            ? "repeating-linear-gradient(90deg, #e87888 0 28px, #d86878 28px 56px)"
            : "repeating-linear-gradient(180deg, #e87888 0 28px, #d86878 28px 56px)",
        }}
      />

      {/* Progress line base + fill */}
      <div
        className={cn(
          "absolute z-[3] rounded-full bg-[#2a1570]",
          isHorizontal
            ? "left-0 top-1/2 h-3.5 -translate-y-1/2"
            : "top-0 left-1/2 w-3.5 -translate-x-1/2",
        )}
        style={isHorizontal ? { width: trackLength } : { height: trackLength }}
      />
      <div
        className={cn(
          "absolute z-[4] rounded-full bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.55)]",
          isHorizontal
            ? "left-0 top-1/2 h-3.5 -translate-y-1/2"
            : "top-0 left-1/2 w-3.5 -translate-x-1/2",
        )}
        style={isHorizontal ? { width: fillLength } : { height: fillLength }}
      />

      {/* Milestone nodes */}
      {TROPHY_ROAD_MILESTONES.map((milestone) => {
        const state = getMilestoneState(milestone.threshold, userElo)
        const offset = getMilestoneOffset(milestone.threshold)
        const trophiesNeeded =
          state === "current" && next
            ? Math.max(0, next.threshold - userElo)
            : undefined

        return (
          <TrophyRoadRewardNode
            key={milestone.id}
            milestone={milestone}
            state={state}
            orientation={orientation}
            offset={offset}
            trophiesNeeded={trophiesNeeded}
          />
        )
      })}
    </div>
  )
}
