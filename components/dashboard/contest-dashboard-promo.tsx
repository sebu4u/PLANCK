"use client"

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock3, Trophy } from "lucide-react"

import type { ContestStatus, ContestSummary } from "@/lib/contest-utils"
import { formatCountdown } from "@/lib/contest-utils"
import { cn } from "@/lib/utils"

type Variant = "mobile" | "desktop"

interface ActivePayload {
  status: ContestStatus
  remaining_seconds: number
  contest: ContestSummary | null
}

function formatContestStartRo(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  })
}

export function ContestDashboardPromo({ variant }: { variant: Variant }) {
  const [payload, setPayload] = useState<ActivePayload | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [fetchedAtMs, setFetchedAtMs] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [, setTick] = useState(0)
  const zeroCountdownRefetchDone = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/contest/active", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok || data.error) {
        setFetchError(true)
        setPayload(null)
        return
      }
      setFetchError(false)
      setPayload({
        status: data.status,
        remaining_seconds: data.remaining_seconds ?? 0,
        contest: data.contest ?? null,
      })
      setFetchedAtMs(Date.now())
    } catch {
      setFetchError(true)
      setPayload(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(id)
  }, [load])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") void load()
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [load])

  const elapsedSec = fetchedAtMs ? Math.floor((Date.now() - fetchedAtMs) / 1000) : 0
  const liveRemaining =
    payload != null ? Math.max(0, payload.remaining_seconds - elapsedSec) : 0

  useEffect(() => {
    if (!payload || payload.status !== "not_started") {
      zeroCountdownRefetchDone.current = false
      return
    }
    if (liveRemaining > 0) {
      zeroCountdownRefetchDone.current = false
      return
    }
    if (zeroCountdownRefetchDone.current) return
    zeroCountdownRefetchDone.current = true
    void load()
  }, [payload, liveRemaining, load])

  const isMobile = variant === "mobile"

  const status = payload?.status ?? "none"
  const contest = payload?.contest

  const showLiveNow = loaded && status === "active"
  const showCountdown = loaded && status === "not_started" && !!contest
  const showEndedCard =
    loaded &&
    (status === "ended" || (status === "none" && !contest) || fetchError)

  const title = contest?.name ?? "Concurs PLANCK"
  const subtitle = !loaded ? (
    <span className="text-[#5f5f5f]">Se încarcă programul competițiilor…</span>
  ) : contest && status === "not_started" ? (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <Clock3 className="inline h-3.5 w-3.5 flex-shrink-0 text-[#6f43db]" aria-hidden />
      <span className="font-medium capitalize">{formatContestStartRo(contest.start_time)}</span>
    </span>
  ) : showLiveNow ? null : !fetchError ? (
    <span className="text-[#5f5f5f]">Intră pentru detalii și probă.</span>
  ) : (
    <span className="text-[#6b4f6b]">Nu am putut încărca ora concursului. Poți deschide pagina probei oricum.</span>
  )

  const rightBlock = showLiveNow ? (
    <div
      className={cn(
        "flex max-w-[min(100%,20rem)] flex-col items-end text-right",
        isMobile ? "gap-0.5" : "gap-1"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1.5 font-bold uppercase tracking-wide text-white shadow-[0_2px_0_#047857]",
          "animate-pulse",
          isMobile ? "text-[11px] leading-tight" : "text-sm"
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        Concursul are loc acum!
      </span>
    </div>
  ) : showCountdown ? (
    <div
      className={cn(
        "flex flex-shrink-0 items-center rounded-2xl border border-[#ececec] bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
        isMobile ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2.5 sm:gap-3 sm:px-4"
      )}
    >
      <span
        className={cn(
          "font-bold uppercase tracking-wider text-[#636363]",
          isMobile ? "text-[9px] leading-none" : "text-[10px] sm:text-xs"
        )}
      >
        Începe în
      </span>
      <span
        className={cn(
          "font-mono font-bold tabular-nums tracking-tight text-[#191919]",
          isMobile ? "text-sm" : "text-lg sm:text-xl"
        )}
      >
        {formatCountdown(liveRemaining)}
      </span>
      <ArrowUpRight
        className={cn(
          "flex-shrink-0 text-[#6f43db] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          isMobile ? "h-3.5 w-3.5" : "h-5 w-5"
        )}
      />
    </div>
  ) : (
    <div
      className={cn(
        "flex flex-shrink-0 items-center rounded-2xl border border-[#ececec] bg-white/95",
        isMobile ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2"
      )}
    >
      <span
        className={cn(
          "font-semibold text-[#2f2a3c]",
          isMobile ? "max-w-[10rem] text-[11px] leading-snug" : "text-sm"
        )}
      >
        {!loaded
          ? "…"
          : showEndedCard && contest
            ? "Competiția din calendar s-a încheiat — vezi pagina probei"
            : "Deschide pagina probei"}
      </span>
      <ArrowUpRight
        className={cn(
          "flex-shrink-0 text-[#6f43db] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          isMobile ? "h-3.5 w-3.5" : "h-5 w-5"
        )}
      />
    </div>
  )

  return (
    <Link
      href="/concurs/proba"
      prefetch={false}
      style={{ "--start-glow-tint": "rgba(250, 238, 245, 0.88)" } as CSSProperties}
      className={cn(
        "dashboard-start-glow group relative block w-full flex-shrink-0 overflow-hidden",
        "bg-gradient-to-r from-[#efe0f5] via-[#f8dce4] to-[#fce8d4]",
        "transition-[transform,box-shadow] duration-300",
        showLiveNow && "ring-1 ring-emerald-400/35 ring-inset",
        isMobile
          ? "lg:hidden rounded-none border-0 shadow-none hover:translate-y-0 hover:shadow-none active:shadow-none px-4 py-3.5"
          : "hidden lg:block rounded-3xl border border-[#e5e5e5] shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.06)] active:translate-y-0 active:shadow-[0_12px_30px_rgba(0,0,0,0.03)] mb-4 px-5 py-5 md:mb-6 md:px-7 md:py-6"
      )}
    >
      <div
        className={cn(
          "relative z-[1] flex",
          isMobile
            ? "flex-row items-center justify-between gap-3"
            : "flex-row items-center justify-between gap-6"
        )}
      >
        <div className={cn("flex min-w-0 flex-1 items-center", isMobile ? "gap-2.5" : "items-start gap-4")}>
          <div
            className={cn(
              "flex flex-shrink-0 items-center justify-center rounded-2xl border border-[#ececec] bg-white/90 text-[#7c3aed] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]",
              isMobile ? "h-10 w-10" : "h-14 w-14"
            )}
          >
            <Trophy className={isMobile ? "h-4 w-4" : "h-7 w-7"} />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold leading-tight tracking-tight text-[#141414]",
                isMobile ? "text-sm" : "text-base md:text-lg"
              )}
            >
              {title}
            </p>
            {!isMobile && subtitle && (
              <p className="mt-1.5 text-[12px] leading-snug text-[#666666] sm:text-sm">{subtitle}</p>
            )}
            {isMobile && subtitle && (
              <p className="mt-1 text-[11px] leading-snug text-[#666666] line-clamp-2">{subtitle}</p>
            )}
          </div>
        </div>

        {rightBlock}
      </div>
    </Link>
  )
}
