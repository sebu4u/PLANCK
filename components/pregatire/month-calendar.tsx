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

const WEEKDAY_SHORT_RO: Record<string, string> = {
  Mon: "Lu",
  Tue: "Ma",
  Wed: "Mi",
  Thu: "Jo",
  Fri: "Vi",
  Sat: "Sâ",
  Sun: "Du",
}

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
  weekAlignMonday = true,
  compact = false,
  hideHeader = false,
  className,
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
  weekAlignMonday?: boolean
  compact?: boolean
  hideHeader?: boolean
  className?: string
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
      const start = weekAlignMonday ? startOfWeekMonday(weekAnchor) : weekAnchor
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i)
        const p = bucharestParts(date)
        const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
        return {
          key,
          day: p.day,
          inMonth: true,
          weekdayLabel: WEEKDAY_SHORT_RO[p.weekday] ?? WEEKDAYS[i] ?? "",
        }
      })
    }
    const first = startOfMonthBucharest(year, month)
    const start = startOfWeekMonday(first)
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i)
      const p = bucharestParts(date)
      const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
      return {
        key,
        day: p.day,
        inMonth: p.month === month && p.year === year,
        weekdayLabel: undefined as string | undefined,
      }
    })
  }, [year, month, weekView, weekAnchor, weekAlignMonday])

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
    <div
      className={cn(
        "rounded-2xl border border-[#e5e7eb] bg-white/80 shadow-sm backdrop-blur transition-[padding] duration-300",
        hideHeader || compact ? "p-2" : "p-4",
        className,
      )}
    >
      {hideHeader ? null : (
        <div className={cn("flex items-center justify-between", compact ? "mb-1.5" : "mb-3")}>
          <h3
            className={cn(
              "font-semibold capitalize text-[#111827] transition-[font-size] duration-300",
              compact ? "text-sm" : "text-base",
            )}
          >
            {title}
          </h3>
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={prev}
              aria-label={prevLabel}
              className={cn(compact && "h-8 w-8")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={next}
              aria-label={nextLabel}
              className={cn(compact && "h-8 w-8")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div
        className={cn(
          "grid grid-cols-7 gap-1 text-center font-medium text-[#9ca3af] transition-[font-size] duration-300",
          hideHeader || compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {(weekView ? cells.map((cell) => cell.weekdayLabel ?? "") : WEEKDAYS).map((d, index) => (
          <div key={`${d}-${index}`} className={cn(hideHeader || compact ? "py-0" : "py-1")}>
            {d}
          </div>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const subjects = byDay.get(cell.key) ?? []
          const selected = selectedDay === cell.key
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDay(selected ? null : cell.key)}
              className={cn(
                "flex flex-col items-center rounded-lg px-1 transition-[min-height,padding,font-size] duration-300",
                hideHeader || compact ? "min-h-[28px] py-1 text-xs" : "min-h-[44px] py-1.5 text-sm",
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
