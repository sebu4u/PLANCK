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
      case 0: return 'bg-gray-200'
      case 1: return 'bg-green-900/40'
      case 2: return 'bg-green-700/60'
      case 3: return 'bg-green-500/70'
      case 4: return 'bg-green-400/80'
      default: return 'bg-gray-200'
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
    <div className="rounded-xl bg-white border border-gray-200 p-4 hover:border-gray-300 transition-all hover:scale-105 transform origin-center">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Activitate Zilnică</h3>

      {/* Streak + Today stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-600">Streak Curent</p>
            <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
              {currentStreak ?? 0} <span className="text-base">🔥</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Best Streak</p>
            <p className="text-xl font-bold text-gray-700">{bestStreak ?? 0}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Astăzi</p>
          <p className={`text-xs ${Math.min(problemsToday ?? 0, 3) === 3
              ? 'text-green-500 font-semibold'
              : 'text-gray-700'
            }`}>
            {Math.min(problemsToday ?? 0, 3)}/3 probleme • {timeTodayActual} min
          </p>
        </div>
      </div>



      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[5px] min-w-max">
          {grid.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[5px]">
              {column.map((day, rowIndex) => (
                <TooltipProvider key={`${colIndex}-${rowIndex}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[16px] h-[16px] rounded-sm ${day.level === -1 ? 'bg-transparent' : getLevelColor(day.level)
                          } ${day.isToday ? 'ring-2 ring-gray-400' : 'hover:ring-1 hover:ring-gray-300'
                          } transition-all cursor-pointer`}
                      />
                    </TooltipTrigger>
                    {day.date && (
                      <TooltipContent side="top" className="bg-white border-gray-200">
                        <p className="text-xs text-gray-900">
                          {new Date(day.date).toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-700">
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
      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
        <span>Mai puțin</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-2.5 h-2.5 rounded-sm ${getLevelColor(level)}`} />
          ))}
        </div>
        <span>Mai mult</span>
      </div>


    </div>
  )
}

