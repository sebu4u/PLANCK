"use client"

import { useMemo } from "react"
import {
  buildInitialFizicaLeaderboard,
  sliceLeaderboardAroundUser,
} from "@/lib/fizica-lesson-leaderboard"
import { cn } from "@/lib/utils"

interface ChildLeaderboardCardProps {
  childName: string
  elo: number
}

const NEIGHBOR_RADIUS = 2

function LeaderboardRow({
  rank,
  name,
  elo,
  isUser,
}: {
  rank: number
  name: string
  elo: number
  isUser: boolean
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5",
        isUser
          ? "border border-emerald-200 bg-emerald-50/95 shadow-[0_8px_24px_rgba(16,185,129,0.12)]"
          : "border border-transparent bg-[#fafafa]",
      )}
    >
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          isUser ? "text-emerald-700" : "text-[#9aa0b4]",
        )}
      >
        {rank}
      </span>
      <span
        className={cn(
          "truncate text-sm font-semibold",
          isUser ? "text-[#111111]" : "text-[#3d4255]",
        )}
      >
        {name}
      </span>
      <span className="text-sm font-medium tabular-nums text-[#9aa0b4]">{elo}</span>
    </div>
  )
}

export function ChildLeaderboardCard({ childName, elo }: ChildLeaderboardCardProps) {
  const { entries, visibleEntries, hasAbove, hasBelow } = useMemo(() => {
    const allEntries = buildInitialFizicaLeaderboard(childName, elo)
    const slice = sliceLeaderboardAroundUser(allEntries, NEIGHBOR_RADIUS)
    return {
      entries: allEntries,
      visibleEntries: slice.visible,
      hasAbove: slice.hasAbove,
      hasBelow: slice.hasBelow,
    }
  }, [childName, elo])

  const userEntry = entries.find((entry) => entry.isUser)

  return (
    <section className="flex h-full flex-col rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">
          Clasament
        </p>
        {userEntry ? (
          <p className="mt-1 text-sm text-[#6b7280]">
            Elevul tău este pe locul{" "}
            <span className="font-semibold text-[#111827]">{userEntry.rank}</span> din{" "}
            {entries.length}.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {hasAbove ? (
          <p className="px-3 py-1 text-center text-xs font-medium text-[#9ca3af]">...</p>
        ) : null}

        {visibleEntries.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            rank={entry.rank}
            name={entry.name}
            elo={entry.elo}
            isUser={entry.isUser}
          />
        ))}

        {hasBelow ? (
          <p className="px-3 py-1 text-center text-xs font-medium text-[#9ca3af]">...</p>
        ) : null}
      </div>
    </section>
  )
}
