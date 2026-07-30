"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { EnergyBadge } from "@/components/pregatire/energy-badge"
import { PregatireMonthCalendar } from "@/components/pregatire/month-calendar"
import { PushPrompt } from "@/components/pregatire/push-prompt"
import { WorkshopCard } from "@/components/pregatire/workshop-card"
import { WorkshopDetailPanel } from "@/components/pregatire/workshop-detail-panel"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabase } from "@/lib/supabaseClient"
import {
  addDays,
  bucharestParts,
  formatWorkshopDayKey,
  startOfWeekMonday,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECTS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopDetail,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [breakpoint])
  return mobile
}

export function PregatirePageClient() {
  const { user } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()

  const nowParts = bucharestParts()
  const [year, setYear] = useState(nowParts.year)
  const [month, setMonth] = useState(nowParts.month)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [subject, setSubject] = useState<WorkshopSubject | "all">("all")
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [energy, setEnergy] = useState<number | null>(null)
  const [energyLoading, setEnergyLoading] = useState(false)
  const [sheetWorkshop, setSheetWorkshop] = useState<WorkshopDetail | null>(null)
  const [openingKey, setOpeningKey] = useState<string | null>(null)
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(new Date()))

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const refreshEnergy = useCallback(async () => {
    if (!user) {
      setEnergy(null)
      return
    }
    setEnergyLoading(true)
    try {
      const headers = await authHeaders()
      const response = await fetch("/api/pregatire/energy", { headers })
      if (response.ok) {
        const data = await response.json()
        setEnergy(data.balance ?? 0)
      }
    } finally {
      setEnergyLoading(false)
    }
  }, [authHeaders, user])

  const refreshWorkshops = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await authHeaders()
      const params = new URLSearchParams()
      if (subject !== "all") params.set("subject", subject)
      const response = await fetch(`/api/pregatire?${params.toString()}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data.workshops ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [authHeaders, subject])

  useEffect(() => {
    void refreshWorkshops()
  }, [refreshWorkshops])

  useEffect(() => {
    void refreshEnergy()
  }, [refreshEnergy])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekAnchor, i)
      const p = bucharestParts(date)
      const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
      return { key, date, label: date.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) }
    })
  }, [weekAnchor])

  const filtered = useMemo(() => {
    let list = workshops
    if (selectedDay) {
      list = list.filter((w) => formatWorkshopDayKey(w.starts_at) === selectedDay)
    }
    return list
  }, [workshops, selectedDay])

  const weekWorkshops = useMemo(() => {
    const keys = new Set(weekDays.map((d) => d.key))
    return workshops
      .filter((w) => keys.has(formatWorkshopDayKey(w.starts_at)))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  }, [workshops, weekDays])

  const openWorkshop = async (workshop: WorkshopPublic, source: "week" | "list") => {
    const key = `${source}:${workshop.id}`
    if (openingKey) return
    setOpeningKey(key)
    if (!isMobile) {
      router.push(`/pregatire/${workshop.id}`)
      return
    }
    try {
      const headers = await authHeaders()
      const response = await fetch(`/api/pregatire/${workshop.id}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setSheetWorkshop(data.workshop)
      } else {
        setSheetWorkshop(workshop as WorkshopDetail)
      }
    } catch {
      setSheetWorkshop(workshop as WorkshopDetail)
    } finally {
      setOpeningKey(null)
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18),_transparent_55%),radial-gradient(ellipse_at_80%_0%,_rgba(37,99,235,0.08),_transparent_45%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700/90">Workshop-uri live</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Pregatire
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
              Sesiuni pe materii, cu profesori Planck. Folosește energia pentru a debloca Meet-ul
              sau înregistrarea.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user ? <EnergyBadge balance={energy} loading={energyLoading} /> : null}
            <PushPrompt isLoggedIn={Boolean(user)} />
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubject("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              subject === "all"
                ? "bg-[#111827] text-white"
                : "bg-white/80 text-[#4b5563] ring-1 ring-[#e5e7eb] hover:bg-white",
            )}
          >
            Toate
          </button>
          {WORKSHOP_SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                subject === s
                  ? "bg-[#111827] text-white"
                  : "bg-white/80 text-[#4b5563] ring-1 ring-[#e5e7eb] hover:bg-white",
              )}
            >
              {WORKSHOP_SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <PregatireMonthCalendar
              workshops={workshops}
              year={year}
              month={month}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onMonthChange={(y, m) => {
                setYear(y)
                setMonth(m)
              }}
            />

            <div className="rounded-2xl border border-[#e5e7eb] bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#111827]">Săptămâna asta</h3>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="text-[#6b7280] hover:text-[#111827]"
                    onClick={() => setWeekAnchor((d) => addDays(d, -7))}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="text-[#6b7280] hover:text-[#111827]"
                    onClick={() => setWeekAnchor(startOfWeekMonday(new Date()))}
                  >
                    Azi
                  </button>
                  <button
                    type="button"
                    className="text-[#6b7280] hover:text-[#111827]"
                    onClick={() => setWeekAnchor((d) => addDays(d, 7))}
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {weekWorkshops.length === 0 ? (
                  <p className="text-sm text-[#9ca3af]">Nicio pregătire în această săptămână.</p>
                ) : (
                  weekWorkshops.map((w) => (
                    <WorkshopCard
                      key={w.id}
                      workshop={w}
                      loading={openingKey === `week:${w.id}`}
                      onSelect={() => void openWorkshop(w, "week")}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111827]">
                {selectedDay ? "Pregătiri în ziua selectată" : "Toate pregătirile"}
              </h2>
              {selectedDay ? (
                <button
                  type="button"
                  className="text-sm text-[#6b7280] hover:text-[#111827]"
                  onClick={() => setSelectedDay(null)}
                >
                  Resetează filtrul
                </button>
              ) : null}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#9ca3af]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white/50 px-6 py-16 text-center">
                <p className="text-sm text-[#6b7280]">Nu există pregătiri pentru filtrele alese.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-1">
                {filtered.map((w) => (
                  <WorkshopCard
                    key={w.id}
                    workshop={w}
                    loading={openingKey === `list:${w.id}`}
                    onSelect={() => void openWorkshop(w, "list")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Sheet open={Boolean(sheetWorkshop)} onOpenChange={(open) => !open && setSheetWorkshop(null)}>
        <SheetContent
          side="bottom"
          overlayClassName="!z-[400]"
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="!z-[401] max-h-[70dvh] overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom,0px)] sm:max-w-lg sm:rounded-none"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{sheetWorkshop?.title ?? "Pregătire"}</SheetTitle>
          </SheetHeader>
          {sheetWorkshop ? (
            <div className="p-4 pb-8">
              <WorkshopDetailPanel
                workshop={sheetWorkshop}
                isLoggedIn={Boolean(user)}
                showBack={false}
                compact
                onBalanceChange={setEnergy}
                onUnlocked={(next) => {
                  setSheetWorkshop(next)
                  setWorkshops((list) =>
                    list.map((w) => (w.id === next.id ? { ...w, unlocked: true } : w)),
                  )
                }}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
