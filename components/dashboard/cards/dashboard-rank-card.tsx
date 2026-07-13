"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  buildInitialFizicaLeaderboard,
  sliceLeaderboardAroundUser,
} from "@/lib/fizica-lesson-leaderboard"
import {
  getRankLeaderboardRevealed,
  setRankLeaderboardRevealed,
} from "@/lib/dashboard-rank-leaderboard-storage"
import { getRankIconPath } from "@/lib/rank-icon"
import { cn } from "@/lib/utils"
import { DesktopRankLeaderboardRevealOverlay } from "@/components/dashboard/cards/desktop-rank-leaderboard-reveal-overlay"
import { LeaderboardRow } from "@/components/dashboard/leaderboard-row"

interface DashboardRankCardProps {
  rank: string
  elo: number
  studentName: string
  userId: string
}

const NEIGHBOR_RADIUS = 2

export function DashboardRankCard({ rank, elo, studentName, userId }: DashboardRankCardProps) {
  const rankIconPath = getRankIconPath(rank)
  const [hasRevealedLeaderboard, setHasRevealedLeaderboard] = useState(false)
  const [showReveal, setShowReveal] = useState(false)

  useEffect(() => {
    setHasRevealedLeaderboard(getRankLeaderboardRevealed(userId))
    setShowReveal(false)
  }, [userId])

  const { entries, visibleEntries, hasAbove, hasBelow, userEntry } = useMemo(() => {
    const allEntries = buildInitialFizicaLeaderboard(studentName, elo)
    const slice = sliceLeaderboardAroundUser(allEntries, NEIGHBOR_RADIUS)

    return {
      entries: allEntries,
      visibleEntries: slice.visible,
      hasAbove: slice.hasAbove,
      hasBelow: slice.hasBelow,
      userEntry: allEntries.find((entry) => entry.isUser),
    }
  }, [studentName, elo])

  const completeReveal = useCallback(() => {
    setRankLeaderboardRevealed(userId)
    setHasRevealedLeaderboard(true)
    setShowReveal(false)
  }, [userId])

  return (
    <>
      <section
        className={cn(
          "rounded-[2rem] border-2 border-[#e5e5e5] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.02)]",
          hasRevealedLeaderboard ? "px-4 py-3" : "px-6 py-8",
        )}
      >
        {hasRevealedLeaderboard ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Clasament</p>
                {userEntry ? (
                  <p className="mt-0.5 text-sm text-[#6b7280]">
                    Ești pe locul <span className="font-semibold text-[#111827]">{userEntry.rank}</span> din{" "}
                    {entries.length}.
                  </p>
                ) : null}
              </div>
              <Image
                src={rankIconPath}
                alt={rank}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 object-contain"
              />
            </div>

            <div className="flex flex-col gap-1">
              {hasAbove ? <p className="px-2 py-0.5 text-center text-xs font-medium text-[#9ca3af]">...</p> : null}
              {visibleEntries.map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  rank={entry.rank}
                  name={entry.name}
                  elo={entry.elo}
                  isUser={entry.isUser}
                  className="gap-2 px-2.5 py-1.5"
                />
              ))}
              {hasBelow ? <p className="px-2 py-0.5 text-center text-xs font-medium text-[#9ca3af]">...</p> : null}
            </div>
          </>
        ) : (
          <div className="text-center">
            <Image
              src={rankIconPath}
              alt={rank}
              width={112}
              height={112}
              className="mx-auto h-24 w-24 object-contain"
              priority={false}
            />

            <h3 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight text-[#080808]">
              Esti in {rank}
            </h3>
            <p className="mx-auto mt-3 max-w-[260px] text-base leading-relaxed text-[#111111]">
              Ai {elo} ELO. Continua sa rezolvi probleme si sa urci in clasament.
            </p>

            <button
              type="button"
              onClick={() => setShowReveal(true)}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-full border-2 border-[#e5e5e5] bg-white px-6 text-lg font-extrabold text-[#080808] transition-[border-color,background-color,transform] hover:border-[#d4d4d4] hover:bg-[#fafafa] active:translate-y-0.5"
            >
              Continua
            </button>
          </div>
        )}
      </section>

      {showReveal ? (
        <DesktopRankLeaderboardRevealOverlay studentName={studentName} elo={elo} onComplete={completeReveal} />
      ) : null}
    </>
  )
}
