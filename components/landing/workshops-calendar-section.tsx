"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import {
  addDays,
  bucharestLocalToIso,
  bucharestParts,
  formatWorkshopDayKey,
  formatWorkshopTime,
} from "@/lib/pregatire/dates"
import type { WorkshopPublic, WorkshopSubject } from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

const CALENDAR_START = { year: 2026, month: 9, day: 4 } as const
const CALENDAR_DAYS = 21
const COLS = 7

const SUBJECT_CELL_CLASS: Record<WorkshopSubject, string> = {
  fizica: "bg-[#EDE7FF] ring-[#D4C8FF]",
  mate: "bg-[#DCFCE7] ring-[#BBF7D0]",
  info: "bg-[#DBEAFE] ring-[#BFDBFE]",
  biologie: "bg-[#ECFCCB] ring-[#D9F99D]",
  chimie: "bg-[#FFEDD5] ring-[#FED7AA]",
}

function calendarStartDate(): Date {
  return new Date(Date.UTC(CALENDAR_START.year, CALENDAR_START.month - 1, CALENDAR_START.day, 12, 0, 0))
}

function dayKeyFromUtcNoon(date: Date): string {
  const p = bucharestParts(date)
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

export function LandingWorkshopsCalendarSection() {
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)

  const days = useMemo(() => {
    const start = calendarStartDate()
    return Array.from({ length: CALENDAR_DAYS }, (_, i) => {
      const date = addDays(start, i)
      const p = bucharestParts(date)
      return {
        key: dayKeyFromUtcNoon(date),
        day: p.day,
        weekday: date.toLocaleDateString("ro-RO", {
          weekday: "short",
          timeZone: "UTC",
        }),
      }
    })
  }, [])

  const weekdayLabels = days.slice(0, COLS).map((d) => d.weekday)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const from = bucharestLocalToIso(
          `${CALENDAR_START.year}-${String(CALENDAR_START.month).padStart(2, "0")}-${String(CALENDAR_START.day).padStart(2, "0")}`,
          "00:00",
        )
        const last = days[days.length - 1]
        const to = last ? bucharestLocalToIso(last.key, "23:59") : from
        const params = new URLSearchParams({ from, to })
        const response = await fetch(`/api/pregatire?${params.toString()}`)
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
  }, [days])

  const byDay = useMemo(() => {
    const map = new Map<string, WorkshopPublic[]>()
    for (const workshop of workshops) {
      const key = formatWorkshopDayKey(workshop.starts_at)
      if (!key) continue
      const list = map.get(key) ?? []
      list.push(workshop)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    }
    return map
  }, [workshops])

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Meditații zilnice, un singur abonament
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Orarul de pe platformă, pe trei săptămâni: o meditație live în fiecare zi, cu profesori
            PLANCK, la mate, fizică, informatică, chimie și biologie. Nu cauți profesor după
            profesor — intri, vezi ce e azi, și te conectezi.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.12} className="mx-auto mt-10 max-w-4xl sm:mt-12">
          <div className="overflow-hidden rounded-[24px] bg-[#F8F7FF] p-3 shadow-[0_16px_48px_rgba(124,92,252,0.12)] ring-1 ring-[#EBE8FF] sm:p-5">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {weekdayLabels.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#7C5CFC] sm:text-xs"
                >
                  {label.replace(/\.$/, "")}
                </div>
              ))}

              {days.map((day) => {
                const items = byDay.get(day.key) ?? []
                const subjectClass = items[0] ? SUBJECT_CELL_CLASS[items[0].subject] : null

                return (
                  <div
                    key={day.key}
                    className={cn(
                      "relative flex min-h-[4.75rem] flex-col rounded-xl p-1.5 sm:min-h-[6.5rem] sm:rounded-2xl sm:p-2.5",
                      items.length > 0 && subjectClass
                        ? cn("ring-1", subjectClass)
                        : "bg-white/70 ring-1 ring-[#EBE8FF]/80",
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-4 sm:pr-5">
                      {loading ? (
                        <div className="mt-1 h-8 animate-pulse rounded-md bg-[#EBE8FF]/70 sm:h-10" />
                      ) : items.length > 0 ? (
                        <ul className="space-y-1">
                          {items.slice(0, 2).map((workshop) => (
                            <li key={workshop.id} className="min-w-0">
                              <p className="line-clamp-2 text-[10px] font-bold leading-tight text-gray-900 sm:text-xs">
                                {workshop.title}
                              </p>
                              <p className="mt-0.5 hidden text-[10px] font-medium text-gray-400 sm:block">
                                {formatWorkshopTime(workshop.starts_at)}
                              </p>
                            </li>
                          ))}
                          {items.length > 2 ? (
                            <li className="text-[10px] font-semibold text-[#7C5CFC]">
                              +{items.length - 2}
                            </li>
                          ) : null}
                        </ul>
                      ) : (
                        <p className="text-[10px] leading-tight text-gray-300 sm:text-xs">—</p>
                      )}
                    </div>
                    <span className="absolute bottom-1 right-1.5 text-[11px] font-black tabular-nums text-gray-400 sm:bottom-1.5 sm:right-2 sm:text-sm">
                      {day.day}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.2} className="mt-8 flex justify-center sm:mt-10">
          <Link
            href="/register"
            className="inline-flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 sm:w-auto"
          >
            Vreau meditație gratuită
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </FadeInUp>
      </div>
    </section>
  )
}
