"use client"

import { useState, useEffect } from "react"
import { DailyChallenge } from "@/lib/dashboard-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer, Trophy, Zap } from "lucide-react"
import Link from "next/link"

interface DailyChallengeCardProps {
  challenge: DailyChallenge
}

export function DailyChallengeCard({ challenge }: DailyChallengeCardProps) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(challenge.expires_at).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft("Expirat")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeLeft(`${hours}h ${minutes}m`)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [challenge.expires_at])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
      case 'Ușor':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Medium':
      case 'Mediu':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Hard':
      case 'Avansat':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 transform origin-center relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-3xl -z-0" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white/90">Daily Challenge</h3>
          <Badge className={`${getDifficultyColor(challenge.difficulty)} border`}>
            {challenge.difficulty}
          </Badge>
        </div>

        {challenge.is_completed ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-lg font-semibold text-white/90 mb-2">Challenge Completed! 🎉</p>
            <p className="text-sm text-white/60 mb-4">
              You earned <span className="text-green-400 font-semibold">+{challenge.bonus_elo} ELO</span>
            </p>
            <p className="text-xs text-white/50">Come back tomorrow for a new challenge</p>
          </div>
        ) : (
          <>
            {/* Challenge Content */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-white/90 mb-2">{challenge.title}</h4>
              <p className="text-sm text-white/60 line-clamp-2">{challenge.description}</p>
            </div>

            {/* Bonus Display */}
            <div className="flex items-center justify-between mb-6 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-white/90">Bonus Reward</span>
              </div>
              <span className="text-lg font-bold text-yellow-400">+{challenge.bonus_elo} ELO</span>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-6 text-white/60">
              <Timer className="w-4 h-4" />
              <span className="text-sm">Expires in: <span className="font-semibold text-white/80">{timeLeft}</span></span>
            </div>

            {/* CTA Button */}
            <Link href={`/probleme/${(challenge as any).problem_id || challenge.id}`}>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold">
                Solve Now
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

