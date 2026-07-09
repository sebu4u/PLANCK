"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  buildInitialFizicaLeaderboard,
  sliceLeaderboardAroundUser,
} from "@/lib/fizica-lesson-leaderboard"
import { getRankIconPath } from "@/lib/rank-icon"
import { cn } from "@/lib/utils"
import { DashboardDetailOverlay } from "@/components/dashboard/free-mobile/dashboard-detail-overlay"

interface StudentLeaderboardCardProps {
  studentName: string
  elo: number
  rank: string
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
      <span className={cn("text-sm font-bold tabular-nums", isUser ? "text-emerald-700" : "text-[#9aa0b4]")}>
        {rank}
      </span>
      <span className={cn("truncate text-sm font-semibold", isUser ? "text-[#111111]" : "text-[#3d4255]")}>
        {name}
      </span>
      <span className="text-sm font-medium tabular-nums text-[#9aa0b4]">{elo}</span>
    </div>
  )
}

export function StudentLeaderboardCard({ studentName, elo, rank }: StudentLeaderboardCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const rankIconPath = getRankIconPath(rank)

  const { entries, visibleEntries, hasAbove, hasBelow } = useMemo(() => {
    const allEntries = buildInitialFizicaLeaderboard(studentName, elo)
    const slice = sliceLeaderboardAroundUser(allEntries, NEIGHBOR_RADIUS)
    return {
      entries: allEntries,
      visibleEntries: slice.visible,
      hasAbove: slice.hasAbove,
      hasBelow: slice.hasBelow,
    }
  }, [studentName, elo])

  const userEntry = entries.find((entry) => entry.isUser)

  return (
    <>
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="flex w-full flex-col rounded-3xl border-2 border-[#e5e5e5] bg-white p-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Clasament</p>
            {userEntry ? (
              <p className="mt-1 text-sm text-[#6b7280]">
                Ești pe locul <span className="font-semibold text-[#111827]">{userEntry.rank}</span> din{" "}
                {entries.length}.
              </p>
            ) : null}
          </div>
          <Image
            src={rankIconPath}
            alt={rank}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {hasAbove ? <p className="px-3 py-1 text-center text-xs font-medium text-[#9ca3af]">...</p> : null}
          {visibleEntries.map((entry) => (
            <LeaderboardRow key={entry.id} rank={entry.rank} name={entry.name} elo={entry.elo} isUser={entry.isUser} />
          ))}
          {hasBelow ? <p className="px-3 py-1 text-center text-xs font-medium text-[#9ca3af]">...</p> : null}
        </div>
      </button>

      <DashboardDetailOverlay open={detailOpen} onClose={() => setDetailOpen(false)} title="Clasament">
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <LeaderboardRow key={entry.id} rank={entry.rank} name={entry.name} elo={entry.elo} isUser={entry.isUser} />
          ))}
        </div>
      </DashboardDetailOverlay>
    </>
  )
}
