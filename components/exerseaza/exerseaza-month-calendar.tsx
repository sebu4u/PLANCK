"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import {
  addDays,
  bucharestParts,
  formatWorkshopDayKey,
  formatWorkshopTime,
  startOfMonthBucharest,
  startOfWeekMonday,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { setPregatireBackTarget } from "@/lib/pregatire/back-target"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const
const MONTH_LABELS = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
] as const

interface MonthCell {
  key: string
  day: number
  inMonth: boolean
}

function todayBucharestKey(now = new Date()): string {
  const p = bucharestParts(now)
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

function monthGridRangeIso(year: number, month: number): { from: string; to: string } {
  const first = startOfMonthBucharest(year, month)
  const gridStart = startOfWeekMonday(first)
  const from = new Date(gridStart)
  from.setUTCHours(0, 0, 0, 0)
  const to = addDays(gridStart, 42)
  to.setUTCHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: to.toISOString() }
}

function buildMonthCells(year: number, month: number): MonthCell[] {
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
    }
  })
}

export function ExerseazaMonthCalendar() {
  const initial = bucharestParts(new Date())
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        const { from, to } = monthGridRangeIso(year, month)
        const params = new URLSearchParams({ from, to })

        const response = await fetch(`/api/pregatire?${params.toString()}`, { headers })
        if (!response.ok) {
          if (isMounted) setWorkshops([])
          return
        }

        const payload = (await response.json()) as { workshops?: WorkshopPublic[] }
        if (isMounted) setWorkshops(payload.workshops ?? [])
      } catch {
        if (isMounted) setWorkshops([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [year, month])

  const subjectsByDay = useMemo(() => {
    const map = new Map<string, WorkshopSubject[]>()
    for (const workshop of workshops) {
      const key = formatWorkshopDayKey(workshop.starts_at)
      if (!key) continue
      const list = map.get(key) ?? []
      if (!list.includes(workshop.subject)) list.push(workshop.subject)
      map.set(key, list)
    }
    return map
  }, [workshops])

  const cells = useMemo(() => buildMonthCells(year, month), [year, month])
  const todayKey = useMemo(() => todayBucharestKey(), [])
  const monthLabel = MONTH_LABELS[month - 1] ?? ""

  const dayWorkshops = useMemo(() => {
    if (!selectedDayKey) return []
    return workshops
      .filter((w) => formatWorkshopDayKey(w.starts_at) === selectedDayKey)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [workshops, selectedDayKey])

  const selectedDayLabel = useMemo(() => {
    if (!selectedDayKey) return ""
    const cell = cells.find((c) => c.key === selectedDayKey)
    if (!cell) return selectedDayKey
    return `${cell.day} ${monthLabel}`
  }, [selectedDayKey, cells, monthLabel])

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-[#e5e5e5] bg-white px-5 pb-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#2c2f33]">Calendar</h2>
          <p className="mt-0.5 text-sm text-[#2c2f33]/55">
            Fii la curent cu pregătirile tale viitoare
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Luna anterioară"
            onClick={goPrev}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#9aa0a6] transition-colors hover:bg-[#f5f4f2] hover:text-[#2c2f33]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[6rem] text-center text-sm font-semibold lowercase text-[#2c2f33]">
            {monthLabel}
          </p>
          <button
            type="button"
            aria-label="Luna următoare"
            onClick={goNext}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#9aa0a6] transition-colors hover:bg-[#f5f4f2] hover:text-[#2c2f33]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={`${label}-${i}`}
              className="py-1 text-[11px] font-medium uppercase tracking-wide text-[#9aa0a6]"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className={cn("mt-1 grid grid-cols-7 gap-1", loading && "opacity-70")}
          role="grid"
          aria-label="Calendar pregătiri"
        >
          {cells.map((cell) => {
            const subjects = subjectsByDay.get(cell.key) ?? []
            const hasWorkshops = subjects.length > 0
            const isToday = cell.key === todayKey
            const isSelected = selectedDayKey === cell.key

            return (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                disabled={!hasWorkshops}
                onClick={() => {
                  if (!hasWorkshops) return
                  setSelectedDayKey(cell.key)
                }}
                className={cn(
                  "flex min-h-[2.75rem] flex-col items-center justify-center rounded-xl py-1 transition-colors",
                  hasWorkshops ? "cursor-pointer hover:bg-[#faf9f7]" : "cursor-default",
                  (isToday || isSelected) && "bg-[#f5d76e] hover:bg-[#f0cf5e]",
                )}
                aria-label={`${cell.day}${hasWorkshops ? ", are pregătiri" : ""}`}
              >
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums leading-none",
                    !cell.inMonth && "text-[#d1d5db]",
                    cell.inMonth && !(isToday || isSelected) && "text-[#2c2f33]",
                    (isToday || isSelected) && "text-[#9a3412]",
                  )}
                >
                  {cell.day}
                </span>
                <span className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                  {hasWorkshops ? (
                    subjects.slice(0, 3).map((subject) => (
                      <span
                        key={subject}
                        className="h-1 w-1 rounded-full"
                        style={{
                          backgroundColor:
                            isToday || isSelected
                              ? "#9a3412"
                              : WORKSHOP_SUBJECT_COLORS[subject],
                        }}
                      />
                    ))
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-transparent" />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <Dialog
        open={selectedDayKey != null}
        onOpenChange={(open) => {
          if (!open) setSelectedDayKey(null)
        }}
      >
        <DialogContent className="max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-0 p-0 shadow-xl sm:rounded-2xl">
          <DialogHeader className="border-b border-[#0b0c0f]/6 px-4 py-3.5 text-left">
            <DialogTitle className="text-base font-bold text-[#0b0c0f]">
              Pregătiri · {selectedDayLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-3 py-3">
            {dayWorkshops.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-[#2c2f33]/65">
                Nicio pregătire în această zi.
              </p>
            ) : (
              dayWorkshops.map((workshop) => (
                <div
                  key={workshop.id}
                  className="rounded-xl border border-[#0b0c0f]/8 bg-[#faf9f7] px-3 py-3"
                >
                  <p className="text-sm font-semibold text-[#0b0c0f]">{workshop.title}</p>
                  <p className="mt-1 text-xs text-[#2c2f33]/70">
                    {formatWorkshopTime(workshop.starts_at)}
                    {" · "}
                    {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
                    {workshop.teacher?.name ? ` · ${workshop.teacher.name}` : ""}
                  </p>
                  <Link
                    href={`/pregatire/${workshop.id}`}
                    onClick={() => {
                      setPregatireBackTarget("/exerseaza")
                      setSelectedDayKey(null)
                    }}
                    className="mt-2.5 inline-flex text-sm font-semibold text-[#2563eb] transition-opacity hover:opacity-80"
                  >
                    Vezi
                  </Link>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
