"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  addDays,
  bucharestParts,
  formatWorkshopDayKey,
  startOfMonthBucharest,
  startOfWeekMonday,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"]

export function PregatireMonthCalendar({
  workshops,
  year,
  month,
  selectedDay,
  onSelectDay,
  onMonthChange,
  weekView = false,
  weekAnchor,
  onWeekChange,
}: {
  workshops: WorkshopPublic[]
  year: number
  month: number
  selectedDay: string | null
  onSelectDay: (dayKey: string | null) => void
  onMonthChange: (year: number, month: number) => void
  weekView?: boolean
  weekAnchor?: Date
  onWeekChange?: (date: Date) => void
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, WorkshopSubject[]>()
    for (const w of workshops) {
      const key = formatWorkshopDayKey(w.starts_at)
      if (!key) continue
      const list = map.get(key) ?? []
      if (!list.includes(w.subject)) list.push(w.subject)
      map.set(key, list)
    }
    return map
  }, [workshops])

  const cells = useMemo(() => {
    if (weekView && weekAnchor) {
      const start = startOfWeekMonday(weekAnchor)
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i)
        const p = bucharestParts(date)
        const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
        return { key, day: p.day, inMonth: true }
      })
    }
    const first = startOfMonthBucharest(year, month)
    const start = startOfWeekMonday(first)
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i)
      const p = bucharestParts(date)
      const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
      return { key, day: p.day, inMonth: p.month === month && p.year === year }
    })
  }, [year, month, weekView, weekAnchor])

  const monthTitle = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

  const title = useMemo(() => {
    if (!weekView || !weekAnchor) return monthTitle
    const start = startOfWeekMonday(weekAnchor)
    const end = addDays(start, 6)
    const startLabel = start.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    const endLabel = end.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    return `${startLabel} – ${endLabel}`
  }, [weekView, weekAnchor, monthTitle])

  const prev = () => {
    if (weekView && weekAnchor && onWeekChange) {
      onWeekChange(addDays(startOfWeekMonday(weekAnchor), -7))
      return
    }
    if (month === 1) onMonthChange(year - 1, 12)
    else onMonthChange(year, month - 1)
  }
  const next = () => {
    if (weekView && weekAnchor && onWeekChange) {
      onWeekChange(addDays(startOfWeekMonday(weekAnchor), 7))
      return
    }
    if (month === 12) onMonthChange(year + 1, 1)
    else onMonthChange(year, month + 1)
  }

  const prevLabel = weekView ? "Săptămâna anterioară" : "Luna anterioară"
  const nextLabel = weekView ? "Săptămâna următoare" : "Luna următoare"

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold capitalize text-[#111827]">{title}</h3>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={prev} aria-label={prevLabel}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={next} aria-label={nextLabel}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#9ca3af]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const subjects = byDay.get(cell.key) ?? []
          const selected = selectedDay === cell.key
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDay(selected ? null : cell.key)}
              className={cn(
                "flex min-h-[44px] flex-col items-center rounded-lg px-1 py-1.5 text-sm transition",
                cell.inMonth ? "text-[#111827]" : "text-[#d1d5db]",
                selected && "bg-[#111827] text-white",
                !selected && subjects.length > 0 && "bg-[#f8fafc] hover:bg-[#f1f5f9]",
                !selected && subjects.length === 0 && "hover:bg-[#f9fafb]",
              )}
            >
              <span className="leading-none">{cell.day}</span>
              {subjects.length > 0 ? (
                <span className="mt-1 flex gap-0.5">
                  {subjects.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: selected ? "#fff" : WORKSHOP_SUBJECT_COLORS[s],
                      }}
                    />
                  ))}
                </span>
              ) : (
                <span className="mt-1 h-1.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
