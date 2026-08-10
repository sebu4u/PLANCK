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
  startOfWeekMonday,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
} from "@/lib/pregatire/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface WeekDay {
  key: string
  label: string
  dayNumber: number
  isToday: boolean
  hasWorkshops: boolean
}

function todayBucharestKey(now = new Date()): string {
  const p = bucharestParts(now)
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

function buildWeekDays(weekStart: Date, workshopDayKeys: Set<string>, now = new Date()): WeekDay[] {
  const todayKey = todayBucharestKey(now)

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const parts = bucharestParts(date)
    const key = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
    return {
      key,
      label: WEEKDAY_LABELS[i] ?? "?",
      dayNumber: parts.day,
      isToday: key === todayKey,
      hasWorkshops: workshopDayKeys.has(key),
    }
  })
}

function weekRangeIso(weekStart: Date): { from: string; to: string } {
  const from = new Date(weekStart)
  from.setUTCHours(0, 0, 0, 0)
  const to = addDays(weekStart, 7)
  to.setUTCHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function ExerseazaWeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))
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
        const { from, to } = weekRangeIso(weekStart)
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
  }, [weekStart])

  const workshopDayKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const workshop of workshops) {
      const key = formatWorkshopDayKey(workshop.starts_at)
      if (key) keys.add(key)
    }
    return keys
  }, [workshops])

  const weekDays = useMemo(
    () => buildWeekDays(weekStart, workshopDayKeys),
    [weekStart, workshopDayKeys],
  )

  const monthLabel = useMemo(() => {
    const mid = addDays(weekStart, 3)
    const parts = bucharestParts(mid)
    return MONTH_LABELS[parts.month - 1] ?? ""
  }, [weekStart])

  const dayWorkshops = useMemo(() => {
    if (!selectedDayKey) return []
    return workshops
      .filter((w) => formatWorkshopDayKey(w.starts_at) === selectedDayKey)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [workshops, selectedDayKey])

  const selectedDayLabel = useMemo(() => {
    if (!selectedDayKey) return ""
    const day = weekDays.find((d) => d.key === selectedDayKey)
    if (!day) return selectedDayKey
    return `${day.label} ${day.dayNumber}`
  }, [selectedDayKey, weekDays])

  return (
    <>
      <section className="rounded-2xl border-2 border-[#e5e5e5] bg-white px-4 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#2c2f33]">Calendar</h2>
            <p className="mt-0.5 text-sm text-[#2c2f33]/55">
              Fii la curent cu pregătirile tale viitoare
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Săptămâna anterioară"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#9aa0a6] transition-colors hover:bg-[#f5f4f2] hover:text-[#2c2f33]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[5.5rem] text-center text-sm font-semibold capitalize text-[#2c2f33]">
            {monthLabel}
          </p>
          <button
            type="button"
            aria-label="Săptămâna următoare"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#9aa0a6] transition-colors hover:bg-[#f5f4f2] hover:text-[#2c2f33]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn("mt-3 grid grid-cols-7 gap-1", loading && "opacity-70")}
          role="list"
          aria-label="Zilele săptămânii"
        >
          {weekDays.map((day) => (
            <button
              key={day.key}
              type="button"
              role="listitem"
              disabled={!day.hasWorkshops}
              onClick={() => {
                if (!day.hasWorkshops) return
                setSelectedDayKey(day.key)
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors",
                day.hasWorkshops
                  ? "cursor-pointer hover:bg-[#faf9f7]"
                  : "cursor-default opacity-90",
              )}
              aria-label={`${day.label} ${day.dayNumber}${day.hasWorkshops ? ", are pregătiri" : ""}`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0a6]">
                {day.label}
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 flex-col items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                  day.isToday
                    ? "bg-[#f5d76e] text-[#3d2e00]"
                    : "text-[#2c2f33]",
                )}
              >
                {day.dayNumber}
                <span
                  className={cn(
                    "mt-0.5 h-1 w-1 rounded-full",
                    day.hasWorkshops ? "bg-[#7c3aed]" : "bg-transparent",
                    day.isToday && day.hasWorkshops && "bg-[#9a3412]",
                  )}
                />
              </span>
            </button>
          ))}
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
                    onClick={() => setSelectedDayKey(null)}
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
