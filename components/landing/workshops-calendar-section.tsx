"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Zap } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  addDays,
  bucharestLocalToIso,
  bucharestParts,
  formatWorkshopDateTime,
  formatWorkshopDayKey,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
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

type CalendarDay = {
  key: string
  day: number
  weekday: string
}

function calendarStartDate(): Date {
  return new Date(Date.UTC(CALENDAR_START.year, CALENDAR_START.month - 1, CALENDAR_START.day, 12, 0, 0))
}

function dayKeyFromUtcNoon(date: Date): string {
  const p = bucharestParts(date)
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

function weekdayShort(label: string): string {
  return label.replace(/\.$/, "")
}

function DayCell({
  day,
  items,
  loading,
  onOpen,
}: {
  day: CalendarDay
  items: WorkshopPublic[]
  loading: boolean
  onOpen: (workshops: WorkshopPublic[]) => void
}) {
  const subjectClass = items[0] ? SUBJECT_CELL_CLASS[items[0].subject] : null
  const clickable = !loading && items.length > 0

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => onOpen(items)}
      className={cn(
        "relative flex h-[6rem] w-full flex-col overflow-hidden rounded-xl p-1.5 text-left sm:h-[6.5rem] sm:rounded-2xl sm:p-2",
        items.length > 0 && subjectClass
          ? cn("ring-1", subjectClass)
          : "bg-[#F8F7FF] ring-1 ring-[#EBE8FF] sm:bg-white/70 sm:ring-[#EBE8FF]/80",
        clickable && "cursor-pointer transition hover:brightness-[0.97] active:scale-[0.98]",
        !clickable && "cursor-default",
      )}
    >
      <div className="min-h-0 min-w-0 flex-1 pr-4">
        {loading ? (
          <div className="h-full animate-pulse rounded-md bg-[#EBE8FF]/70" />
        ) : items.length > 0 ? (
          <ul className="h-full">
            {items.slice(0, 1).map((workshop) => (
              <li key={workshop.id} className="h-full min-w-0">
                <p className="line-clamp-4 break-words text-[13px] font-bold leading-[1.2] text-gray-900 sm:text-[13px] sm:leading-[1.2]">
                  {workshop.title}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] leading-tight text-gray-300">—</p>
        )}
      </div>
      <span className="absolute bottom-1 right-1.5 text-[11px] font-black tabular-nums text-gray-400 sm:bottom-1.5 sm:right-2 sm:text-sm">
        {day.day}
      </span>
    </button>
  )
}

function WorkshopPreviewCard({ workshop }: { workshop: WorkshopPublic }) {
  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]

  return (
    <article className="overflow-hidden rounded-2xl border border-[#EBE8FF] bg-white">
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: color }}
          >
            {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {formatWorkshopDateTime(workshop.starts_at)}
          </span>
        </div>

        <h3 className="mt-3 text-xl font-black tracking-tight text-gray-900">{workshop.title}</h3>

        <div className="mt-4 flex items-start gap-3">
          {workshop.teacher?.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workshop.teacher.icon_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F8F7FF] text-lg font-semibold text-[#7C5CFC]">
              {(workshop.teacher?.name ?? "?").slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{workshop.teacher?.name ?? "Profesor PLANCK"}</p>
            {workshop.teacher?.description ? (
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{workshop.teacher.description}</p>
            ) : null}
          </div>
        </div>

        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
          <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
          {workshop.energy_cost} energie
        </p>

        {workshop.description ? (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-600">
            {workshop.description}
          </p>
        ) : null}

        <Link
          href={`/rezerva?subject=${workshop.subject}`}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
        >
          Rezervă-ți locul
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

export function LandingWorkshopsCalendarSection() {
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<WorkshopPublic[] | null>(null)

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
  const weeks = useMemo(() => {
    const grouped: CalendarDay[][] = []
    for (let i = 0; i < days.length; i += COLS) {
      grouped.push(days.slice(i, i + COLS))
    }
    return grouped
  }, [days])

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
      </div>

        <FadeInUp delay={0.12} className="mt-10 w-full sm:mx-auto sm:mt-12 sm:max-w-4xl sm:px-6 lg:px-8">
          <div
            className="flex max-w-full gap-1 overflow-x-auto overscroll-x-contain pl-2 pr-3 sm:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="sticky left-0 z-10 flex w-8 shrink-0 flex-col gap-1 bg-white pr-1">
              {weekdayLabels.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="flex h-[6rem] items-center justify-center text-[10px] font-bold uppercase tracking-wide text-[#7C5CFC]"
                >
                  {weekdayShort(label)}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div
                key={week[0]?.key ?? weekIndex}
                className="flex w-[8.75rem] shrink-0 flex-col gap-1"
              >
                {week.map((day) => (
                  <DayCell
                    key={day.key}
                    day={day}
                    items={byDay.get(day.key) ?? []}
                    loading={loading}
                    onOpen={setSelected}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] bg-[#F8F7FF] p-5 shadow-[0_16px_48px_rgba(124,92,252,0.12)] ring-1 ring-[#EBE8FF] sm:block">
            <div className="grid grid-cols-7 gap-1.5">
              {weekdayLabels.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-[#7C5CFC]"
                >
                  {weekdayShort(label)}
                </div>
              ))}

              {days.map((day) => (
                <DayCell
                  key={day.key}
                  day={day}
                  items={byDay.get(day.key) ?? []}
                  loading={loading}
                  onOpen={setSelected}
                />
              ))}
            </div>
          </div>
        </FadeInUp>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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

      <Dialog open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl border border-[#EBE8FF] bg-[#F8F7FF] p-4 shadow-[0_24px_64px_rgba(124,92,252,0.18)] sm:max-w-lg sm:p-5">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="text-lg font-black tracking-tight text-gray-900">
              Detalii meditație
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Profesor, oră, energie și ce vei lucra.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {(selected ?? []).map((workshop) => (
              <WorkshopPreviewCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
