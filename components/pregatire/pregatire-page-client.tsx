"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { EnergyBadge } from "@/components/pregatire/energy-badge"
import { FloatingWeekCalendar } from "@/components/pregatire/floating-week-calendar"
import { NextWorkshopHero } from "@/components/pregatire/next-workshop-hero"
import { PregatireHubTabBar } from "@/components/pregatire/pregatire-hub-tab-bar"
import { PregatireIntroCard } from "@/components/pregatire/pregatire-intro-card"
import { PregatireMonthCalendar } from "@/components/pregatire/month-calendar"
import { PushPrompt } from "@/components/pregatire/push-prompt"
import { WorkshopCard } from "@/components/pregatire/workshop-card"
import { WorkshopDetailPanel } from "@/components/pregatire/workshop-detail-panel"
import { WorkshopMaterialsFeed } from "@/components/pregatire/workshop-materials-feed"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabase } from "@/lib/supabaseClient"
import {
  addDays,
  bucharestParts,
  formatWorkshopDayKey,
  startOfWeekMonday,
} from "@/lib/pregatire/dates"
import {
  DEFAULT_PREGATIRE_HUB_TAB,
  readStoredPregatireHubTab,
  writeStoredPregatireHubTab,
  type PregatireHubTab,
} from "@/lib/pregatire-hub-tab"
import {
  WORKSHOP_SUBJECTS,
  WORKSHOP_SUBJECT_LABELS,
  isWorkshopSubject,
  type WorkshopDetail,
  type WorkshopMaterialsHubItem,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
import { PlanckWeekPregatireBanner } from "@/components/planck-week/pregatire-week-banner"
import { cn } from "@/lib/utils"

const BURGER_BREAKPOINT = 948

function useIsMobile(breakpoint = BURGER_BREAKPOINT) {
  const [mobile, setMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [breakpoint])
  return mobile
}

function usePregatireHubTab() {
  const [tab, setTab] = useState<PregatireHubTab>(DEFAULT_PREGATIRE_HUB_TAB)

  useLayoutEffect(() => {
    setTab(readStoredPregatireHubTab())
  }, [])

  const selectTab = (next: PregatireHubTab) => {
    setTab(next)
    writeStoredPregatireHubTab(next)
  }

  return { tab, selectTab }
}

function SubjectChips({
  subject,
  onChange,
}: {
  subject: WorkshopSubject | "all"
  onChange: (next: WorkshopSubject | "all") => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
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
          onClick={() => onChange(s)}
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
  )
}

export function PregatirePageClient() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const { tab, selectTab } = usePregatireHubTab()

  const nowParts = bucharestParts()
  const [year, setYear] = useState(nowParts.year)
  const [month, setMonth] = useState(nowParts.month)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const subjectParam = searchParams.get("subject")
  const subject: WorkshopSubject | "all" = isWorkshopSubject(subjectParam) ? subjectParam : "all"

  const setSubject = useCallback(
    (next: WorkshopSubject | "all") => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === "all") params.delete("subject")
      else params.set("subject", next)
      const query = params.toString()
      router.replace(query ? `/pregatire?${query}` : "/pregatire", { scroll: false })
    },
    [router, searchParams],
  )
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [energy, setEnergy] = useState<number | null>(null)
  const [carryoverEnergy, setCarryoverEnergy] = useState(0)
  const [energyLoading, setEnergyLoading] = useState(false)
  const [sheetWorkshop, setSheetWorkshop] = useState<WorkshopDetail | null>(null)
  const [openingKey, setOpeningKey] = useState<string | null>(null)
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(new Date()))
  const [materials, setMaterials] = useState<WorkshopMaterialsHubItem[] | null>(null)
  const [materialsLoading, setMaterialsLoading] = useState(false)

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const refreshEnergy = useCallback(async () => {
    if (!user) {
      setEnergy(null)
      setCarryoverEnergy(0)
      return
    }
    setEnergyLoading(true)
    try {
      const headers = await authHeaders()
      const response = await fetch("/api/pregatire/energy", { headers })
      if (response.ok) {
        const data = await response.json()
        setEnergy(data.balance ?? 0)
        setCarryoverEnergy(data.carryoverBalance ?? 0)
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

  const refreshMaterials = useCallback(async () => {
    setMaterialsLoading(true)
    try {
      const headers = await authHeaders()
      const response = await fetch("/api/pregatire/materials", { headers })
      if (response.ok) {
        const data = (await response.json()) as { items?: WorkshopMaterialsHubItem[] }
        setMaterials(data.items ?? [])
      } else {
        setMaterials([])
      }
    } catch {
      setMaterials([])
    } finally {
      setMaterialsLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    void refreshWorkshops()
  }, [refreshWorkshops])

  useEffect(() => {
    void refreshEnergy()
  }, [refreshEnergy])

  useEffect(() => {
    if (tab !== "teme" && tab !== "notite") return
    if (materials !== null) return
    void refreshMaterials()
  }, [tab, materials, refreshMaterials])

  useEffect(() => {
    if (isMobile !== false || !sheetWorkshop) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetWorkshop(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isMobile, sheetWorkshop])

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

  const openWorkshop = async (
    workshop: WorkshopPublic,
    source: "week" | "list" | "hero" | "materials",
  ) => {
    const key = `${source}:${workshop.id}`
    if (openingKey) return
    setOpeningKey(key)
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

  const closeWorkshopSheet = () => setSheetWorkshop(null)

  const workshopDetail = sheetWorkshop ? (
    <WorkshopDetailPanel
      workshop={sheetWorkshop}
      isLoggedIn={Boolean(user)}
      showBack={false}
      compact
      className={isMobile === false ? "pr-12" : undefined}
      onBalanceChange={(next) => {
        setEnergy(next.balance)
        setCarryoverEnergy(next.carryoverBalance)
      }}
      onUnlocked={(next) => {
        setSheetWorkshop(next)
        setWorkshops((list) =>
          list.map((w) => (w.id === next.id ? { ...w, unlocked: true } : w)),
        )
        void refreshMaterials()
      }}
    />
  ) : null

  const onMonthChange = (y: number, m: number) => {
    setYear(y)
    setMonth(m)
  }

  const onWeekChange = (date: Date) => {
    setWeekAnchor(date)
    const p = bucharestParts(date)
    setYear(p.year)
    setMonth(p.month)
  }

  const workshopList = (
    <>
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
    </>
  )

  const desktopSidebarOpen = isMobile === false && Boolean(sheetWorkshop)

  return (
    <div className={cn("relative", isMobile === false && "h-[calc(100dvh-4rem)] overflow-hidden bg-white")}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18),_transparent_55%),radial-gradient(ellipse_at_80%_0%,_rgba(37,99,235,0.08),_transparent_45%)]",
          isMobile === false && "hidden",
        )}
      />

      {isMobile === true ? (
        <div className="relative mx-auto max-w-6xl px-4 pt-4">
          <PlanckWeekPregatireBanner />
          <div className="flex justify-end">
            <PushPrompt isLoggedIn={Boolean(user)} />
          </div>

          <div className="mt-3">
            <NextWorkshopHero
              workshops={workshops}
              loading={loading}
              opening={openingKey?.startsWith("hero:") ?? false}
              onSelect={(w) => void openWorkshop(w, "hero")}
            />
          </div>

          <PregatireHubTabBar value={tab} onChange={selectTab} className="mt-5" />

          {tab === "pregatiri" ? (
            <div className="pb-36 pt-4">
              <SubjectChips subject={subject} onChange={setSubject} />
              <div className="mb-3 mt-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#111827]">
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
              {workshopList}
            </div>
          ) : (
            <div className="py-4">
              <WorkshopMaterialsFeed
                kind={tab === "notite" ? "notes" : "homework"}
                items={materials ?? []}
                loading={materialsLoading || materials === null}
                openingId={
                  openingKey?.startsWith("materials:") ? openingKey.slice("materials:".length) : null
                }
                onSelect={(w) => void openWorkshop(w, "materials")}
              />
            </div>
          )}
        </div>
      ) : isMobile === false ? (
        <div
          className={cn(
            "relative h-full min-w-0 transition-[margin] duration-300 ease-out",
            desktopSidebarOpen ? "mr-[min(28rem,38vw)]" : "mr-0",
          )}
        >
          <div className="absolute inset-[3px] overflow-hidden rounded-xl bg-[#f5f4f2]">
            <div className="h-full overflow-y-auto">
              <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6">
                <PlanckWeekPregatireBanner />
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
                    {user ? (
                      <EnergyBadge balance={energy} carryoverBalance={carryoverEnergy} loading={energyLoading} />
                    ) : null}
                    <PushPrompt isLoggedIn={Boolean(user)} />
                  </div>
                </header>

                <div className="mt-6">
                  <SubjectChips subject={subject} onChange={setSubject} />
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <PregatireMonthCalendar
                      workshops={workshops}
                      year={year}
                      month={month}
                      selectedDay={selectedDay}
                      onSelectDay={setSelectedDay}
                      onMonthChange={onMonthChange}
                      weekAnchor={weekAnchor}
                      onWeekChange={onWeekChange}
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
                    {workshopList}
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isMobile === true ? (
        <FloatingWeekCalendar
          visible={tab === "pregatiri"}
          workshops={workshops}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onMonthChange={onMonthChange}
        />
      ) : null}

      {searchParams.get("from") === "planck-week" ? null : <PregatireIntroCard />}

      {isMobile === true ? (
        <Sheet open={Boolean(sheetWorkshop)} onOpenChange={(open) => !open && closeWorkshopSheet()}>
          <SheetContent
            side="bottom"
            overlayClassName="!z-[400] bg-black/30"
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="!z-[401] flex h-[70dvh] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border-x border-t border-[#d1d5db] bg-white p-0 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] sm:max-w-lg sm:rounded-none"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{sheetWorkshop?.title ?? "Pregătire"}</SheetTitle>
            </SheetHeader>
            {workshopDetail}
          </SheetContent>
        </Sheet>
      ) : null}

      {isMobile === false ? (
        <aside
          aria-hidden={!desktopSidebarOpen}
          aria-label="Detalii pregătire"
          className={cn(
            "fixed bottom-0 right-0 top-16 z-20 flex min-h-0 w-[min(28rem,38vw)] flex-col bg-white transition-transform duration-300 ease-out",
            desktopSidebarOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
          )}
        >
          {sheetWorkshop ? (
            <>
              <button
                type="button"
                onClick={closeWorkshopSheet}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827]"
                aria-label="Închide detaliile pregătirii"
              >
                <X className="h-4 w-4" />
              </button>
              {workshopDetail}
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}
