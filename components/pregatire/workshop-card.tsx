"use client"

import Link from "next/link"
import { Clock, Loader2, Users, Video } from "lucide-react"
import {
  formatWorkshopTime,
  isWorkshopPast,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
} from "@/lib/pregatire/types"
import { WorkshopBacBadge } from "@/components/pregatire/workshop-bac-badge"
import { cn } from "@/lib/utils"

export function WorkshopCard({
  workshop,
  href,
  onSelect,
  loading = false,
}: {
  workshop: WorkshopPublic
  href?: string
  onSelect?: () => void
  loading?: boolean
}) {
  const past = isWorkshopPast(workshop.starts_at, workshop.duration_minutes)
  const full = workshop.seats_remaining === 0
  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]

  const content = (
    <article
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-4 text-left shadow-sm transition",
        "hover:border-[#d1d5db] hover:shadow-md",
        workshop.unlocked && "ring-1 ring-emerald-200",
        loading && "pointer-events-none",
      )}
    >
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-[#6b7280]" aria-hidden />
          <span className="sr-only">Se încarcă</span>
        </div>
      ) : null}
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: color }}
            >
              {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
            </span>
            {workshop.is_bac ? <WorkshopBacBadge /> : null}
            {workshop.unlocked ? (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Înscris
              </span>
            ) : null}
            {past && workshop.has_recording ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                <Video className="h-3 w-3" />
                Înregistrare
              </span>
            ) : null}
            {full && !workshop.unlocked ? (
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                Locuri epuizate
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold tracking-tight text-[#111827] group-hover:text-[#0f172a]">
            {workshop.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#6b7280]">
            {workshop.teacher?.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={workshop.teacher.icon_url}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3f4f6] text-[10px] font-semibold text-[#374151]">
                {(workshop.teacher?.name ?? "?").slice(0, 1)}
              </span>
            )}
            <span className="truncate">{workshop.teacher?.name ?? "Profesor"}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-[#111827]">
            {formatWorkshopTime(workshop.starts_at)}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">Gratuit</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 pl-2 text-xs text-[#9ca3af]">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {workshop.duration_minutes} min
        </span>
        {workshop.max_seats != null ? (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {workshop.seats_remaining ?? 0}/{workshop.max_seats} locuri
          </span>
        ) : null}
      </div>
    </article>
  )

  if (href) {
    return (
      <Link href={href} className="block" aria-busy={loading}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="block w-full"
      onClick={onSelect}
      disabled={loading}
      aria-busy={loading}
    >
      {content}
    </button>
  )
}
