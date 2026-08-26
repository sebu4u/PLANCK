"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import {
  formatWorkshopShortDateTime,
  isWorkshopPast,
} from "@/lib/pregatire/dates"
import { WORKSHOP_SUBJECT_COLORS, type WorkshopPublic } from "@/lib/pregatire/types"
import { setPregatireBackTarget } from "@/lib/pregatire/back-target"

const LIVE_LOOKBACK_MS = 4 * 60 * 60 * 1000

interface StudentPregatireCardProps {
  preferredMaterie: unknown
}

function isWorkshopLive(workshop: WorkshopPublic, now = new Date()): boolean {
  const start = new Date(workshop.starts_at).getTime()
  if (Number.isNaN(start)) return false
  return start <= now.getTime() && !isWorkshopPast(workshop.starts_at, workshop.duration_minutes, now)
}

export function StudentPregatireCard(_props: StudentPregatireCardProps) {
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [showingAvailableWorkshops, setShowingAvailableWorkshops] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

        const from = new Date(Date.now() - LIVE_LOOKBACK_MS).toISOString()
        const params = new URLSearchParams({
          enrolled: "1",
          from,
        })

        const response = await fetch(`/api/pregatire?${params.toString()}`, { headers })
        if (!response.ok) {
          if (isMounted) setWorkshops([])
          return
        }

        const payload = (await response.json()) as { workshops?: WorkshopPublic[] }
        const enrolledWorkshops = (payload.workshops ?? [])
          .filter((w) => !isWorkshopPast(w.starts_at, w.duration_minutes))
          .slice(0, 2)

        if (enrolledWorkshops.length > 0) {
          if (isMounted) {
            setWorkshops(enrolledWorkshops)
            setShowingAvailableWorkshops(false)
          }
          return
        }

        const availableParams = new URLSearchParams({ from })
        const availableResponse = await fetch(`/api/pregatire?${availableParams.toString()}`, { headers })
        if (!availableResponse.ok) {
          if (isMounted) setWorkshops([])
          return
        }

        const availablePayload = (await availableResponse.json()) as { workshops?: WorkshopPublic[] }
        const availableWorkshops = (availablePayload.workshops ?? [])
          .filter((w) => !isWorkshopPast(w.starts_at, w.duration_minutes))
          .slice(0, 2)

        if (isMounted) {
          setWorkshops(availableWorkshops)
          setShowingAvailableWorkshops(true)
        }
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
  }, [])

  return (
    <Link
      href="/pregatire"
      onClick={() => setPregatireBackTarget("/dashboard")}
      aria-label="Deschide calendarul de pregătiri"
      className="flex w-full flex-col rounded-3xl border-2 border-[#e5e5e5] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-opacity active:opacity-90"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Pregătiri</p>
          <p className="mt-1 truncate text-sm text-[#6b7280]">
            {showingAvailableWorkshops
              ? "Următoarele pregătiri disponibile"
              : "Pregătirea la care ești înscris"}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#111827]">
          Calendar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5" aria-busy>
          <div className="h-[3.25rem] animate-pulse rounded-2xl bg-[#f3f4f6]" />
          <div className="h-[3.25rem] animate-pulse rounded-2xl bg-[#f3f4f6]" />
          <span className="sr-only">Se încarcă pregătirile</span>
        </div>
      ) : workshops.length === 0 ? (
        <div className="rounded-2xl bg-[#f9fafb] px-3 py-4 text-center">
          <p className="text-sm text-[#6b7280]">
            Nu ești înscris la nicio pregătire.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#111827]">
            Vezi calendarul
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
            {workshops.map((workshop) => {
              const live = isWorkshopLive(workshop)
              const workshopAccent = WORKSHOP_SUBJECT_COLORS[workshop.subject]
              return (
                <li key={workshop.id}>
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#eef0f4] bg-[#fafafa] px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: workshopAccent }}
                          aria-hidden
                        />
                        <p className="truncate text-sm font-semibold text-[#111827]">{workshop.title}</p>
                        {live ? (
                          <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                            Acum
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate pl-3.5 text-xs text-[#6b7280]">
                        {formatWorkshopShortDateTime(workshop.starts_at)}
                        {workshop.teacher?.name ? ` · ${workshop.teacher.name}` : ""}
                      </p>
                    </div>
                    {showingAvailableWorkshops ? (
                      <span className="shrink-0 pt-0.5 text-xs font-semibold text-[#6b7280]">
                        Disponibilă
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        Înscris
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      )}
    </Link>
  )
}
