"use client"

import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"
import Image from "next/image"

interface RankEloCardProps {
  elo: number
  rank: string
  nextRank: string
  nextThreshold: number
  progress: number
  currentStreak?: number
  bestStreak?: number
}

export function RankEloCard({
  elo,
  rank,
  nextRank,
  nextThreshold,
  progress,
  currentStreak = 0,
  bestStreak = 0,
}: RankEloCardProps) {

  // Get rank color
  const getRankColor = (rankName: string) => {
    if (rankName.includes('Bronze')) return 'text-amber-700'
    if (rankName.includes('Silver')) return 'text-gray-400'
    if (rankName.includes('Gold')) return 'text-yellow-400'
    if (rankName.includes('Platinum')) return 'text-cyan-400'
    if (rankName.includes('Diamond')) return 'text-blue-400'
    if (rankName.includes('Masters')) return 'text-purple-400'
    if (rankName.includes('Ascendant')) return 'text-indigo-400'
    if (rankName.includes('Singularity')) return 'text-pink-400'
    return 'text-gray-400'
  }

  // Get rank icon path (extract rank name from full rank string, e.g., "Bronze III" -> "bronze")
  const getRankIconPath = (rankName: string): string => {
    const rankLower = rankName.toLowerCase()
    if (rankLower.includes('bronze')) return '/ranks/bronze.png'
    if (rankLower.includes('silver')) return '/ranks/silver.png'
    if (rankLower.includes('gold')) return '/ranks/gold.png'
    if (rankLower.includes('platinum')) return '/ranks/platinum.png'
    if (rankLower.includes('diamond')) return '/ranks/diamond.png'
    if (rankLower.includes('masters')) return '/ranks/masters.png'
    if (rankLower.includes('ascendant')) return '/ranks/ascendant.png'
    if (rankLower.includes('singularity')) return '/ranks/singularity.png'
    return '/ranks/bronze.png' // Default fallback
  }

  const eloGain = nextThreshold - elo
  const rankColor = getRankColor(rank)
  const rankIconPath = getRankIconPath(rank)

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-4 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
      <h3 className="text-base font-semibold text-white/90 mb-3">Rank & ELO</h3>

      {/* Rank Icon and Name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
            <Image
              src={rankIconPath}
              alt={rank}
              width={48}
              height={48}
              className="object-contain"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = document.createElement('div')
                fallback.className = 'text-2xl'
                fallback.textContent = '🏅'
                target.parentElement?.appendChild(fallback)
              }}
            />
          </div>
          <div>
            <h4 className={`text-xl font-bold ${rankColor}`}>{rank}</h4>
            <p className="text-xs text-white/60">Current Rank</p>
          </div>
        </div>

        {/* ELO Display */}
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <p className="text-3xl font-bold text-white/90">{elo}</p>
          </div>
          <p className="text-xs text-white/60">ELO Rating</p>
        </div>
      </div>

      {/* Progress to Next Rank */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-white/70">Progress to {nextRank}</p>
          <p className="text-xs text-white/60">+{eloGain} ELO</p>
        </div>
        <Progress
          value={progress}
          className="h-1.5 bg-white/5"
          indicatorClassName="bg-white"
        />
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/5">
          <p className="text-xs text-white/60">Streak Curent</p>
          <p className="text-xl font-bold text-white/90 flex items-center justify-center gap-1.5">
            {currentStreak} <span className="text-lg">🔥</span>
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/5">
          <p className="text-xs text-white/60">Best Streak</p>
          <p className="text-xl font-bold text-white/70 flex items-center justify-center gap-1.5">
            {bestStreak} <span className="text-lg">🏆</span>
          </p>
        </div>
      </div>
    </div>
  )
}

