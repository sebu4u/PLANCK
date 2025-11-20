"use client"

import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import Image from "next/image"

interface RankEloCardProps {
  elo: number
  rank: string
  nextRank: string
  nextThreshold: number
  progress: number
  eloHistory?: number[]
  todayGain?: number
  weekGain?: number
}

export function RankEloCard({
  elo,
  rank,
  nextRank,
  nextThreshold,
  progress,
  eloHistory = [500, 510, 505, 520, 515, 525, 520],
  todayGain = 0,
  weekGain = 0,
}: RankEloCardProps) {
  // Generate sparkline data
  const sparklineData = eloHistory.map((value, index) => ({
    index,
    elo: value,
  }))

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
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
      <h3 className="text-lg font-semibold text-white/90 mb-6">Rank & ELO</h3>

      {/* Rank Icon and Name */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
            <Image
              src={rankIconPath}
              alt={rank}
              width={64}
              height={64}
              className="object-contain"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = document.createElement('div')
                fallback.className = 'text-3xl'
                fallback.textContent = '🏅'
                target.parentElement?.appendChild(fallback)
              }}
            />
          </div>
          <div>
            <h4 className={`text-2xl font-bold ${rankColor}`}>{rank}</h4>
            <p className="text-sm text-white/60">Current Rank</p>
          </div>
        </div>

        {/* ELO Display */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <p className="text-4xl font-bold text-white/90">{elo}</p>
          </div>
          <p className="text-xs text-white/60 mt-1">ELO Rating</p>
        </div>
      </div>

      {/* Progress to Next Rank */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white/70">Progress to {nextRank}</p>
          <p className="text-sm text-white/60">+{eloGain} ELO needed</p>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-white/5"
          indicatorClassName="bg-white"
        />
        <p className="text-xs text-white/50 mt-1">{Math.round(progress)}% complete</p>
      </div>

      {/* ELO History Sparkline */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white/70 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Last 7 Days
          </p>
          <p className="text-xs text-green-500">+{eloHistory[eloHistory.length - 1] - eloHistory[0]} ELO</p>
        </div>
        <div className="h-16 w-full bg-white/[0.02] rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="elo"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <p className="text-xs text-white/60">Today</p>
          <p className="text-lg font-semibold text-white/90">+{todayGain}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <p className="text-xs text-white/60">This Week</p>
          <p className="text-lg font-semibold text-white/90">+{weekGain}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <p className="text-xs text-white/60">Peak</p>
          <p className="text-lg font-semibold text-white/90">{elo}</p>
        </div>
      </div>
    </div>
  )
}

