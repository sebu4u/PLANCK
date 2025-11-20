"use client"

import { Achievement, formatRelativeTime } from "@/lib/dashboard-data"
import { Progress } from "@/components/ui/progress"
import { Award, Trophy } from "lucide-react"

interface AchievementsCardProps {
  achievements: Achievement[]
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  // Calculate next milestone (placeholder logic)
  const nextMilestone = {
    name: "50 Problems Solved",
    current: 15,
    target: 50,
    progress: (15 / 50) * 100,
  }

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-4 hover:border-white/20 transition-all hover:scale-105 transform origin-center h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-white/90">Achievements</h3>
      </div>

      {/* Earned Badges */}
      {achievements.length > 0 ? (
        <div className="space-y-2.5 mb-5">
          {achievements.slice(0, 2).map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-2 p-2.5 bg-white/[0.03] rounded-lg border border-white/5 hover:border-white/10 transition-all"
            >
              {/* Badge Icon */}
              <div className={`w-10 h-10 rounded-full ${achievement.color} flex items-center justify-center text-xl border border-white/10 flex-shrink-0`}>
                {achievement.icon}
              </div>

              {/* Badge Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">{achievement.name}</p>
                <p className="text-xs text-white/50 truncate">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 mb-5">
          <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-white/[0.03] flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white/30" />
          </div>
          <p className="text-xs text-white/60">No achievements yet</p>
        </div>
      )}

      {/* Next Milestone */}
      <div className="pt-4 border-t border-white/10 mb-5">
        <p className="text-xs text-white/70 mb-2.5">Next Milestone</p>
        <div className="p-3.5 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-white/90 truncate">{nextMilestone.name}</p>
            <p className="text-xs text-white/70">
              {nextMilestone.current}/{nextMilestone.target}
            </p>
          </div>
          <Progress value={nextMilestone.progress} className="h-1.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all rounded-full"
              style={{ width: `${nextMilestone.progress}%` }}
            />
          </Progress>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 mt-auto">
        <div className="text-center p-2.5 bg-white/[0.03] rounded-lg">
          <p className="text-xl font-bold text-white/90">{achievements.length}</p>
          <p className="text-xs text-white/60">Badges Earned</p>
        </div>
        <div className="text-center p-2.5 bg-white/[0.03] rounded-lg">
          <p className="text-xl font-bold text-white/90">12</p>
          <p className="text-xs text-white/60">Total Available</p>
        </div>
      </div>
    </div>
  )
}

