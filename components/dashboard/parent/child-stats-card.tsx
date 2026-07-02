"use client"

import { Calendar, CheckCircle2, Clock, Flame, Trophy } from "lucide-react"
import type { ChildProgressSnapshot } from "@/lib/parent/server"

interface ChildStatsCardProps {
  stats: ChildProgressSnapshot["stats"]
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Niciodată"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min"
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

const STAT_ITEMS = [
  {
    key: "last_activity",
    label: "Ultima activitate",
    icon: Calendar,
  },
  {
    key: "total_time",
    label: "Timp petrecut",
    icon: Clock,
  },
  {
    key: "streak",
    label: "Streak curent",
    icon: Flame,
  },
  {
    key: "problems",
    label: "Probleme rezolvate",
    icon: CheckCircle2,
  },
  {
    key: "rank",
    label: "Rank",
    icon: Trophy,
  },
] as const

export function ChildStatsCard({ stats }: ChildStatsCardProps) {
  const values: Record<(typeof STAT_ITEMS)[number]["key"], string> = {
    last_activity: formatDate(stats.last_activity_date),
    total_time: formatDuration(stats.total_time_minutes),
    streak: `${stats.current_streak} zile`,
    problems: String(stats.problems_solved_total),
    rank: stats.rank,
  }

  return (
    <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div className="mb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-[#080808]">Statistici</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          Rezumatul activității elevului pe platformă.
        </p>
      </div>

      <div className="space-y-3">
        {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-[#eceff3] bg-[#fafafa] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f3f3f3] p-2.5 text-[#9e9e9e]">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-[#6b7280]">{label}</span>
            </div>
            <span className="text-sm font-semibold text-[#111827]">{values[key]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
