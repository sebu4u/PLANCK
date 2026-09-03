"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Users, Zap } from "lucide-react"
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
  formatWorkshopTime,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECTS,
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

const CALENDAR_START = { year: 2026, month: 9, day: 4 } as const
const CALENDAR_DAYS = 21
const COLS = 7

type CalendarAccent = "violet" | "green"

const ACCENT_VARS: Record<CalendarAccent, CSSProperties> = {
  violet: {
    "--cal-accent": "#7C5CFC",
    "--cal-accent-dark": "#5B47D6",
    "--cal-tint": "#F8F7FF",
    "--cal-ring": "#EBE8FF",
    "--cal-glow": "124, 92, 252",
  } as CSSProperties,
  green: {
    "--cal-accent": "#2BCC56",
    "--cal-accent-dark": "#1FA344",
    "--cal-tint": "#F4F4F5",
    "--cal-ring": "#E5E7EB",
    "--cal-glow": "43, 204, 86",
  } as CSSProperties,
}

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

function workshopSeatsLabel(workshop: WorkshopPublic): string | null {
  if (workshop.max_seats == null) return null
  return `${workshop.seats_remaining ?? 0}/${workshop.max_seats} locuri`
}

function mondayIndexInWeek(days: CalendarDay[]): number {
  const index = days.findIndex((day) => {
    const [year, month, date] = day.key.split("-").map(Number)
    if (!year || !month || !date) return false
    const utcDay = new Date(Date.UTC(year, month - 1, date, 12, 0, 0)).getUTCDay()
    return utcDay === 1
  })
  return index >= 0 ? index : 0
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
  const seats = items[0] ? workshopSeatsLabel(items[0]) : null

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => onOpen(items)}
      className={cn(
        "relative flex h-[6rem] w-full flex-col overflow-hidden rounded-xl p-1.5 text-left sm:h-[6.5rem] sm:rounded-2xl sm:p-2",
        items.length > 0 && subjectClass
          ? cn("ring-1", subjectClass)
          : "bg-[var(--cal-tint)] ring-1 ring-[var(--cal-ring)] sm:bg-white/70 sm:ring-[color-mix(in_srgb,var(--cal-ring)_80%,transparent)]",
        clickable && "cursor-pointer transition hover:brightness-[0.97] active:scale-[0.98]",
        !clickable && "cursor-default",
      )}
    >
      <div className="min-h-0 min-w-0 flex-1 pr-4">
        {loading ? (
          <div className="h-full animate-pulse rounded-md bg-[var(--cal-ring)]" />
        ) : items.length > 0 ? (
          <ul className="h-full">
            {items.slice(0, 1).map((workshop) => (
              <li key={workshop.id} className="h-full min-w-0">
                <p className="line-clamp-3 break-words text-[13px] font-bold leading-[1.2] text-gray-900 sm:text-[13px] sm:leading-[1.2]">
                  {workshop.title}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] leading-tight text-gray-300">—</p>
        )}
      </div>
      {seats ? (
        <span className="absolute bottom-1 left-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums text-gray-500 sm:bottom-1.5 sm:left-2 sm:text-[11px]">
          <Users className="h-3 w-3" aria-hidden />
          {seats}
        </span>
      ) : null}
      <span className="absolute bottom-1 right-1.5 text-[11px] font-black tabular-nums text-gray-400 sm:bottom-1.5 sm:right-2 sm:text-sm">
        {day.day}
      </span>
    </button>
  )
}

function SubjectLegend() {
  return (
    <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 sm:mt-6">
      {WORKSHOP_SUBJECTS.map((subject) => (
        <li key={subject} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <span
            className={cn("h-3 w-3 shrink-0 rounded-sm ring-1", SUBJECT_CELL_CLASS[subject])}
            aria-hidden
          />
          {WORKSHOP_SUBJECT_LABELS[subject]}
        </li>
      ))}
    </ul>
  )
}

function WorkshopDayListCard({
  workshop,
  onOpen,
}: {
  workshop: WorkshopPublic
  onOpen: () => void
}) {
  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]
  const time = formatWorkshopTime(workshop.starts_at)
  const seats = workshopSeatsLabel(workshop)
  const full = workshop.seats_remaining === 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full overflow-hidden rounded-2xl border border-[var(--cal-ring)] bg-white text-left shadow-[0_8px_24px_rgba(var(--cal-glow),0.08)] transition active:scale-[0.99]"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: color }}
          >
            {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
          </span>
          {time ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {time}
            </span>
          ) : null}
          {full ? (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
              Locuri epuizate
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[15px] font-black leading-snug tracking-tight text-gray-900">
          {workshop.title}
        </p>
        <p className="mt-1.5 text-sm text-gray-500">
          {workshop.teacher?.name ?? "Profesor PLANCK"}
        </p>
        {seats ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {seats}
          </p>
        ) : null}
      </div>
    </button>
  )
}

function MobileWeekAgenda({
  days,
  byDay,
  loading,
  onOpen,
}: {
  days: CalendarDay[]
  byDay: Map<string, WorkshopPublic[]>
  loading: boolean
  onOpen: (workshops: WorkshopPublic[]) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(Math.min(days.length - 1, Math.max(0, next)))
  }, [days.length])

  const goTo = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" })
    setActiveIndex(index)
  }

  return (
    <div className="sm:hidden">
      <div
        className="flex gap-1 px-4"
        role="tablist"
        aria-label="Zilele săptămânii"
      >
        {days.map((day, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => goTo(index)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-2 transition-colors",
                isActive ? "bg-gray-900 text-white" : "bg-[var(--cal-tint)] text-gray-600",
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {weekdayShort(day.weekday)}
              </span>
              <span className="mt-0.5 text-sm font-black tabular-nums">{day.day}</span>
            </button>
          )
        })}
      </div>

      <div
        ref={scrollerRef}
        onScroll={syncActiveFromScroll}
        className="mt-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => {
          const items = byDay.get(day.key) ?? []
          return (
            <div
              key={day.key}
              className="w-full shrink-0 snap-start px-4"
              role="tabpanel"
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-2xl bg-[var(--cal-ring)]" />
                  <div className="h-24 animate-pulse rounded-2xl bg-[var(--cal-ring)]" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((workshop) => (
                    <WorkshopDayListCard
                      key={workshop.id}
                      workshop={workshop}
                      onOpen={() => onOpen([workshop])}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-[var(--cal-tint)] px-4 py-8 text-center text-sm leading-relaxed text-gray-500">
                  Nu sunt meditații în această zi.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WorkshopPreviewCard({
  workshop,
  onReserve,
  reserveLabel = "Rezervă-ți locul",
}: {
  workshop: WorkshopPublic
  onReserve?: () => void
  reserveLabel?: string
}) {
  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]
  const seats = workshopSeatsLabel(workshop)
  const full = workshop.seats_remaining === 0
  const ctaClassName =
    "mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[var(--cal-accent)] px-6 text-sm font-bold text-white shadow-[0_4px_0_var(--cal-accent-dark)] transition-[filter] duration-200 hover:brightness-110"

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--cal-ring)] bg-white">
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
          {full ? (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
              Locuri epuizate
            </span>
          ) : null}
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--cal-tint)] text-lg font-semibold text-[var(--cal-accent)]">
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

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
            {workshop.energy_cost} energie
          </p>
          {seats ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <Users className="h-4 w-4" aria-hidden />
              {seats}
            </p>
          ) : null}
        </div>

        {workshop.description ? (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-600">
            {workshop.description}
          </p>
        ) : null}

        {onReserve ? (
          <button type="button" onClick={onReserve} className={ctaClassName}>
            {reserveLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <Link href={`/rezerva?subject=${workshop.subject}`} className={ctaClassName}>
            Rezervă-ți locul
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  )
}

export function LandingWorkshopsCalendarSection({
  title = "Vezi exact ce se explică, în fiecare zi",
  campaignStyle = false,
  cta,
  onReserve,
  reserveLabel,
  mobileDayFrom,
  mobileDayTo,
  accent = "violet",
}: {
  title?: string
  campaignStyle?: boolean
  cta?: ReactNode
  onReserve?: () => void
  reserveLabel?: string
  mobileDayFrom?: string
  mobileDayTo?: string
  accent?: CalendarAccent
}) {
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
  const mobileDays = useMemo(() => {
    if (mobileDayFrom && mobileDayTo) {
      return days.filter((day) => day.key >= mobileDayFrom && day.key <= mobileDayTo)
    }
    const start = mondayIndexInWeek(days)
    return days.slice(start, start + 7)
  }, [days, mobileDayFrom, mobileDayTo])

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
    <section className="bg-white py-20 sm:py-28" style={ACCENT_VARS[accent]}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className={campaignStyle ? "max-w-3xl text-left" : "mx-auto max-w-3xl text-center"}>
          {campaignStyle ? (
            <span className="inline-flex rounded-md bg-[var(--cal-accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Cum funcționează?
            </span>
          ) : null}
          <h2
            className={
              campaignStyle
                ? "mt-5 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl lg:leading-tight"
                : "text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight"
            }
          >
            {title}
          </h2>
          {campaignStyle ? <div className="mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden /> : null}
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Alege materia, vezi ce se predă azi, și intri direct. Fără să cauți profesor după
            profesor. Înveți de la olimpici naționali și internaționali la aceste discipline.
          </p>
        </FadeInUp>
      </div>

        <FadeInUp delay={0.12} className="mt-10 w-full sm:mx-auto sm:mt-12 sm:max-w-4xl sm:px-6 lg:px-8">
          <MobileWeekAgenda
            days={mobileDays}
            byDay={byDay}
            loading={loading}
            onOpen={setSelected}
          />

          <div className="hidden overflow-hidden rounded-[24px] bg-[var(--cal-tint)] p-5 shadow-[0_16px_48px_rgba(var(--cal-glow),0.12)] ring-1 ring-[var(--cal-ring)] sm:block">
            <div className="grid grid-cols-7 gap-1.5">
              {weekdayLabels.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-[var(--cal-accent)]"
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

          <SubjectLegend />
        </FadeInUp>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeInUp delay={0.2} className="mt-8 flex justify-center sm:mt-10">
          {cta ?? (
            <Link
              href="/register"
              className="inline-flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-[var(--cal-accent)] px-8 text-base font-bold text-white shadow-[0_4px_0_var(--cal-accent-dark)] transition-[filter] duration-200 hover:brightness-110 sm:w-auto"
            >
              Vreau meditație gratuită
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </FadeInUp>
      </div>

      <Dialog open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--cal-ring)] bg-[var(--cal-tint)] p-4 shadow-[0_24px_64px_rgba(var(--cal-glow),0.18)] sm:max-w-lg sm:p-5"
          style={ACCENT_VARS[accent]}
        >
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
              <WorkshopPreviewCard
                key={workshop.id}
                workshop={workshop}
                onReserve={
                  onReserve
                    ? () => {
                        setSelected(null)
                        onReserve()
                      }
                    : undefined
                }
                reserveLabel={reserveLabel}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
