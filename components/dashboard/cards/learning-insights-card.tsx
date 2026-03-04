"use client"

import { LearningInsights, formatDuration } from "@/lib/dashboard-data"
import { Clock, Target, TrendingUp, Activity } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

interface LearningInsightsCardProps {
  insights: LearningInsights
}

export function LearningInsightsCard({ insights }: LearningInsightsCardProps) {
  // Generate sparkline data
  const activityData = insights.weekly_activity.map((value, index) => ({
    day: index,
    count: value,
  }))

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 hover:border-gray-300 transition-all hover:scale-105 transform origin-center">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900">Learning Insights</h3>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <p className="text-xs text-gray-600">Total Time</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatDuration(insights.total_time_minutes)}</p>
          <p className="text-xs text-green-400 mt-0.5">+2h this week</p>
        </div>

        <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <p className="text-xs text-gray-600">This Week</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{insights.problems_solved_week}</p>
          <p className="text-xs text-gray-600 mt-0.5">problems solved</p>
        </div>
      </div>

      {/* Average Difficulty */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-700">Average Difficulty</p>
          <p className="text-xs font-semibold text-gray-900">{insights.average_difficulty.toFixed(1)}/5</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full ${
                level <= Math.round(insights.average_difficulty)
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-700">Weekly Activity</p>
          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
        </div>
        <div className="h-16 w-full bg-gray-50 rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                fill="url(#colorGradient)"
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-base font-bold text-gray-900">85%</p>
          <p className="text-xs text-gray-600">Success Rate</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-900">24</p>
          <p className="text-xs text-gray-600">Topics</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-900">4.2</p>
          <p className="text-xs text-gray-600">Avg Score</p>
        </div>
      </div>
    </div>
  )
}

