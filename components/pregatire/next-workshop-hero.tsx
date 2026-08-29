"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  formatWorkshopHeroDate,
  formatWorkshopStartsIn,
  isWorkshopLive,
  pickNextWorkshop,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_HERO_IMAGE_SRC,
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

export function NextWorkshopHero({
  workshops,
  loading = false,
  opening = false,
  onSelect,
}: {
  workshops: WorkshopPublic[]
  loading?: boolean
  opening?: boolean
  onSelect?: (workshop: WorkshopPublic) => void
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const next = pickNextWorkshop(workshops, now)

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm" aria-busy>
        <div className="h-3 w-24 animate-pulse rounded bg-[#e5e7eb]" />
        <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-[#f3f4f6]" />
        <span className="sr-only">Se încarcă următoarea meditație</span>
      </div>
    )
  }

  if (!next) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-4 py-3 text-center shadow-sm">
        <p className="text-sm font-medium text-[#6b7280]">Nu sunt pregătiri programate.</p>
      </div>
    )
  }

  const live = isWorkshopLive(next.starts_at, next.duration_minutes, now)
  const color = WORKSHOP_SUBJECT_COLORS[next.subject]
  const countdown = live ? "În desfășurare" : formatWorkshopStartsIn(next.starts_at, now)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(next)}
      disabled={opening}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-left shadow-sm transition",
        "hover:border-[#d1d5db] hover:shadow-md",
        opening && "pointer-events-none",
      )}
    >
      {opening ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="h-5 w-5 animate-spin text-[#6b7280]" aria-hidden />
          <span className="sr-only">Se încarcă</span>
        </div>
      ) : null}
      <div className="absolute inset-y-0 left-0 z-[1] w-1" style={{ backgroundColor: color }} />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[30%] overflow-hidden"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={WORKSHOP_HERO_IMAGE_SRC[next.subject]}
          alt=""
          className="h-full w-full object-cover object-center"
          onError={(event) => {
            event.currentTarget.parentElement?.classList.add("hidden")
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-0% via-white/75 to-transparent" />
      </div>
      <div className="relative z-[1] pl-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Următoarea meditație
          </p>
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: color }}
          >
            {WORKSHOP_SUBJECT_LABELS[next.subject]}
          </span>
        </div>
        <h2 className="mt-1 text-base font-semibold leading-snug tracking-tight text-[#111827]">
          {next.title}
        </h2>
        <p
          className={cn(
            "mt-0.5 text-sm font-semibold tracking-tight",
            live ? "text-rose-600" : "text-[#111827]",
          )}
        >
          {countdown}
          <span className="font-medium capitalize text-[#6b7280]">
            {" · "}
            {formatWorkshopHeroDate(next.starts_at)}
          </span>
        </p>
      </div>
    </button>
  )
}
