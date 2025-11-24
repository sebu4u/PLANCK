"use client"

import { DailyActivity } from "@/lib/dashboard-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DailyActivityCardProps {
  activities: DailyActivity[]
  currentStreak: number
  bestStreak: number
  problemsToday: number
  timeToday: number
}

export function DailyActivityCard({
  activities,
  currentStreak,
  bestStreak,
  problemsToday,
  timeToday,
}: DailyActivityCardProps) {
  const today = new Date()
  const todayString = today.toISOString().split("T")[0]
  
  // Get today's time from activities array (more accurate than total_time_minutes)
  const todayActivity = activities.find(a => a.activity_date === todayString)
  const timeTodayActual = todayActivity?.time_minutes || 0

  // Formatter pentru header (data de azi, format complet)
  const todayFullLabel = today.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  // Generate calendar-style heatmap for current month (30/31/28/29 days)
  const generateMonthlyHeatmapData = () => {
    const year = today.getFullYear()
    const month = today.getMonth() // 0-11

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()

    const heatmapDays: Array<{ date: string; level: number; count: number; isToday: boolean }> = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0]
      // Normalize activity_date to ensure proper comparison (handle both date strings and Date objects)
      const activity = activities.find(a => {
        const activityDate = typeof a.activity_date === 'string' 
          ? a.activity_date 
          : new Date(a.activity_date).toISOString().split('T')[0]
        return activityDate === dateString
      })

      heatmapDays.push({
        date: dateString,
        level: activity?.activity_level ?? 0,
        count: activity?.problems_solved ?? 0,
        isToday: dateString === todayString,
      })
    }

    return { firstDayOfMonth, heatmapDays }
  }

  const { firstDayOfMonth, heatmapDays } = generateMonthlyHeatmapData()

  // Get level color
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-white/[0.05]'
      case 1: return 'bg-green-900/40'
      case 2: return 'bg-green-700/60'
      case 3: return 'bg-green-500/70'
      case 4: return 'bg-green-400/80'
      default: return 'bg-white/[0.05]'
    }
  }

  // Organizăm zilele din lună într-o grilă: 4 rânduri x 7–8 coloane (max 32 zile)
  const rows = 4
  const cols = Math.min(8, Math.ceil(heatmapDays.length / rows))
  const grid: Array<Array<{ date: string; level: number; count: number; isToday?: boolean }>> = []

  for (let col = 0; col < cols; col++) {
    const columnDays: Array<{ date: string; level: number; count: number; isToday?: boolean }> = []
    for (let row = 0; row < rows; row++) {
      const index = col * rows + row
      const day = heatmapDays[index]
      if (day) {
        columnDays.push(day)
      } else {
        columnDays.push({ date: "", level: -1, count: 0 })
      }
    }
    grid.push(columnDays)
  }

  return (
    <div className="rounded-xl bg-[#131316] border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
      <h3 className="text-lg font-semibold text-white/90 mb-4">Activitate Zilnică</h3>

      {/* Streak + Today stats (în stânga sus) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-white/60">Streak Curent</p>
            <p className="text-2xl font-bold text-white/90 flex items-center gap-1">
              {currentStreak ?? 0} <span className="text-lg">🔥</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60">Best Streak</p>
            <p className="text-2xl font-bold text-white/70">{bestStreak ?? 0}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Astăzi</p>
          <p className={`text-sm ${
            Math.min(problemsToday ?? 0, 3) === 3 
              ? 'text-green-500 font-semibold' 
              : 'text-white/85'
          }`}>
            {Math.min(problemsToday ?? 0, 3)}/3 probleme
          </p>
          <p className="text-sm text-white/85">{timeTodayActual} min</p>
        </div>
      </div>

      {/* Data de azi deasupra heatmap-ului */}
      <div className="mb-3">
        <p className="text-xs text-white/60">Data de azi</p>
        <p className="text-sm font-medium text-white/85">{todayFullLabel}</p>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[6px] min-w-max">
          {grid.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[6px]">
              {column.map((day, rowIndex) => (
                <TooltipProvider key={`${colIndex}-${rowIndex}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[18px] h-[18px] rounded-md ${
                          day.level === -1 ? 'bg-transparent' : getLevelColor(day.level)
                        } ${
                          day.isToday ? 'ring-2 ring-white/80' : 'hover:ring-1 hover:ring-white/30'
                        } transition-all cursor-pointer`}
                      />
                    </TooltipTrigger>
                    {day.date && (
                      <TooltipContent side="top" className="bg-[#1f1f23] border-white/20">
                        <p className="text-xs text-white/90">
                          {new Date(day.date).toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-white/70">
                          {day.count} {day.count === 1 ? 'problemă' : 'probleme'}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-white/60">
        <span>Mai puțin</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`} />
          ))}
        </div>
        <span>Mai mult</span>
      </div>

      {/* Motivational Message */}
      {(currentStreak ?? 0) > 0 && (
        <div className="mt-4 p-3 bg-white/[0.03] rounded-lg border border-white/5">
          <p className="text-sm text-white/70">
            {(problemsToday ?? 0) === 0
              ? `🔥 Complete 1 more problem to save your ${currentStreak ?? 0}-day streak!`
              : `✨ Great work! Your streak is ${currentStreak ?? 0} days and counting!`}
          </p>
        </div>
      )}
    </div>
  )
}

