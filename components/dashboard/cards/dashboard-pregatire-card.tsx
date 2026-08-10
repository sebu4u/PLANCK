"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Zap } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import {
  addDays,
  bucharestParts,
  formatWorkshopDayKey,
  formatWorkshopShortDateTime,
  isWorkshopPast,
} from "@/lib/pregatire/dates"
import {
  practiceSubjectToWorkshopSubject,
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
} from "@/lib/pregatire/types"
import {
  getPracticeSubjectLabel,
  normalizePracticeSubject,
} from "@/lib/practice-subject"
import { cn } from "@/lib/utils"

const LIVE_LOOKBACK_MS = 4 * 60 * 60 * 1000
const MAX_LIST_ITEMS = 2
const WEEKDAY_LABELS = ["D", "L", "Ma", "Mi", "J", "V", "S"] as const

interface DashboardPregatireCardProps {
  preferredMaterie: unknown
}

interface WeekDay {
  key: string
  label: string
  dayNumber: number
  isToday: boolean
  hasWorkshops: boolean
}

function isWorkshopLive(workshop: WorkshopPublic, now = new Date()): boolean {
  const start = new Date(workshop.starts_at).getTime()
  if (Number.isNaN(start)) return false
  return start <= now.getTime() && !isWorkshopPast(workshop.starts_at, workshop.duration_minutes, now)
}

function todayBucharestKey(now = new Date()): string {
  const p = bucharestParts(now)
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

function buildNextFiveDays(workshopDayKeys: Set<string>, now = new Date()): WeekDay[] {
  const todayKey = todayBucharestKey(now)
  const p = bucharestParts(now)
  const todayNoonUtc = new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0))

  return Array.from({ length: 5 }, (_, i) => {
    const date = addDays(todayNoonUtc, i)
    const parts = bucharestParts(date)
    const key = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
    return {
      key,
      label: WEEKDAY_LABELS[date.getUTCDay()] ?? "?",
      dayNumber: parts.day,
      isToday: key === todayKey,
      hasWorkshops: workshopDayKeys.has(key),
    }
  })
}

export function DashboardPregatireCard({ preferredMaterie }: DashboardPregatireCardProps) {
  const router = useRouter()
  const practiceSubject = normalizePracticeSubject(preferredMaterie)
  const workshopSubject = practiceSubjectToWorkshopSubject(practiceSubject)
  const subjectLabel = getPracticeSubjectLabel(practiceSubject)
  const accent = WORKSHOP_SUBJECT_COLORS[workshopSubject]

  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setSelectedDayKey(null)
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

        const from = new Date(Date.now() - LIVE_LOOKBACK_MS).toISOString()
        const params = new URLSearchParams({
          subject: workshopSubject,
          from,
        })

        const response = await fetch(`/api/pregatire?${params.toString()}`, { headers })
        if (!response.ok) {
          if (isMounted) setWorkshops([])
          return
        }

        const payload = (await response.json()) as { workshops?: WorkshopPublic[] }
        const upcoming = (payload.workshops ?? []).filter(
          (w) => !isWorkshopPast(w.starts_at, w.duration_minutes),
        )

        if (isMounted) setWorkshops(upcoming)
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
  }, [workshopSubject])

  const workshopDayKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const workshop of workshops) {
      const key = formatWorkshopDayKey(workshop.starts_at)
      if (key) keys.add(key)
    }
    return keys
  }, [workshops])

  const weekDays = useMemo(() => buildNextFiveDays(workshopDayKeys), [workshopDayKeys])

  const listedWorkshops = useMemo(() => {
    const filtered = selectedDayKey
      ? workshops.filter((w) => formatWorkshopDayKey(w.starts_at) === selectedDayKey)
      : workshops
    return filtered.slice(0, MAX_LIST_ITEMS)
  }, [workshops, selectedDayKey])

  return (
    <section
      role="link"
      tabIndex={0}
      aria-label="Deschide calendarul de pregătiri"
      onClick={() => router.push("/pregatire")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push("/pregatire")
        }
      }}
      className="cursor-pointer rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-colors hover:border-[#d1d5db]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Pregătiri</p>
          <p className="mt-0.5 truncate text-sm text-[#6b7280]">
            Următoarele pentru {WORKSHOP_SUBJECT_LABELS[workshopSubject]}
          </p>
        </div>
        <Link
          href="/pregatire"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-70"
        >
          Calendar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-0.5" role="list" aria-label="Următoarele 5 zile">
        {weekDays.map((day) => {
          const selected = selectedDayKey === day.key
          return (
            <button
              key={day.key}
              type="button"
              role="listitem"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDayKey((prev) => (prev === day.key ? null : day.key))
              }}
              className="flex min-w-0 flex-col items-center gap-1 rounded-lg py-0.5 transition-colors hover:bg-[#f9fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1d5db]"
              aria-pressed={selected}
              aria-label={`${day.label} ${day.dayNumber}${day.hasWorkshops ? ", are pregătiri" : ""}`}
            >
              <span
                className={cn(
                  "flex aspect-square w-full max-w-[2rem] items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                  selected
                    ? "border-transparent text-white"
                    : day.isToday
                      ? "border-[#d1d5db] bg-[#111827] text-white"
                      : day.hasWorkshops
                        ? "border-[#e5e5e5] bg-[#fafafa] text-[#111827]"
                        : "border-[#e5e5e5] bg-[#fafafa] text-[#c6c6c6]",
                )}
                style={selected ? { backgroundColor: accent, borderColor: accent } : undefined}
              >
                {day.dayNumber}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  day.isToday || selected ? "text-[#2e2e2e]" : "text-[#6f6f6f]",
                )}
              >
                {day.label}
              </span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-opacity",
                  day.hasWorkshops ? "opacity-100" : "opacity-0",
                )}
                style={{ backgroundColor: accent }}
                aria-hidden
              />
            </button>
          )
        })}
      </div>

      <div className="mt-3 border-t border-[#f0f0f0] pt-3">
        {loading ? (
          <div className="flex flex-col gap-2" aria-busy>
            <div className="h-12 animate-pulse rounded-2xl bg-[#f3f4f6]" />
            <div className="h-12 animate-pulse rounded-2xl bg-[#f3f4f6]" />
            <span className="sr-only">Se încarcă pregătirile</span>
          </div>
        ) : listedWorkshops.length === 0 ? (
          <div className="rounded-2xl bg-[#f9fafb] px-3 py-3 text-center">
            <p className="text-sm text-[#6b7280]">
              {selectedDayKey
                ? "Nicio pregătire în ziua selectată."
                : `Nu sunt pregătiri programate pentru ${subjectLabel}.`}
            </p>
            <Link
              href="/pregatire"
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-70"
            >
              Vezi calendarul
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {listedWorkshops.map((workshop) => {
              const live = isWorkshopLive(workshop)
              return (
                <li key={workshop.id}>
                  <Link
                    href={`/pregatire/${workshop.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-2xl border border-[#eef0f4] bg-[#fafafa] px-2.5 py-2 transition",
                      "hover:bg-[#f3f4f6] active:scale-[0.99]",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                          aria-hidden
                        />
                        <p className="truncate text-sm font-semibold text-[#111827]">{workshop.title}</p>
                        {live ? (
                          <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                            Acum
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate pl-3.5 text-xs text-[#6b7280]">
                        {formatWorkshopShortDateTime(workshop.starts_at)}
                        {workshop.teacher?.name ? ` · ${workshop.teacher.name}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-xs font-semibold tabular-nums text-amber-700">
                      <Zap className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden />
                      {workshop.energy_cost}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
