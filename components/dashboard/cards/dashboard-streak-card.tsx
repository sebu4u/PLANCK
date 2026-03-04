"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardStreakDay {
  date: string
  label: string
  active: boolean
}

interface DashboardStreakCardProps {
  currentStreak: number
  problemsToday: number
  streakDays: DashboardStreakDay[]
  streakImageSrc?: string
}

export function DashboardStreakCard({
  currentStreak,
  problemsToday,
  streakDays,
  streakImageSrc,
}: DashboardStreakCardProps) {
  const helperText =
    currentStreak > 0
      ? "Ține ritmul pentru a-ți păstra streak-ul!"
      : problemsToday > 0
        ? "Felicitări! Ai rezolvat azi — streak-ul tău crește."
        : "Rezolvă o problemă ca să pornești streak-ul."

  return (
    <>
      <section className="md:hidden rounded-2xl border border-[#e5e5e5] bg-white p-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent">
            {streakImageSrc ? (
              <img src={streakImageSrc} alt="" className="h-full w-full object-contain" loading="lazy" />
            ) : (
              <div className="h-10 w-10 rounded-lg border border-dashed border-[#dddddd]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight text-[#121212]">
              {currentStreak} {currentStreak === 1 ? "zi" : "zile"} streak
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#6b6b6b]">Rezolvă azi ca să continui</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {streakDays.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                  day.active
                    ? "border-[#bfa4ff] bg-[#6e4ef2] text-white"
                    : "border-[#e5e5e5] bg-[#f5f5f5] text-[#b4b4b4]"
                )}
              >
                {day.label.slice(0, 1)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden md:block rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-5xl font-bold leading-none text-[#121212]">{currentStreak}</p>
            <p className="mt-2 text-sm font-medium text-[#2e2e2e]">{helperText}</p>
          </div>
          <div className="rounded-full bg-[#f3f3f3] p-2.5 text-[#9e9e9e]">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 flex items-start justify-between gap-1">
          {streakDays.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                  day.active
                    ? "border-[#bfa4ff] bg-gradient-to-br from-[#f5ecff] to-[#ecebff] text-[#7b4ce2]"
                    : "border-[#e5e5e5] bg-[#fafafa] text-[#c6c6c6]"
                )}
              >
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-[#6f6f6f]">{day.label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
