"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Loader2, X } from "lucide-react"

import confetti from "canvas-confetti"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import {
  getPrizeWheelPrizeLabel,
  nextWheelRotation,
  segmentIndexForResult,
  type PrizeWheelPrizeView,
  type PrizeWheelSpinResponse,
  type PrizeWheelStatusResponse,
} from "@/lib/prize-wheel/types"
import { PRIZE_WHEEL_CAMPAIGN_START_AT } from "@/lib/prize-wheel/campaign"
import { CastigaInstagramBonusCard } from "@/components/prize-wheel/castiga-instagram-bonus"
import { PrizeWheelVisual } from "@/components/prize-wheel/prize-wheel-visual"

export type PrizeWheelCloseInfo = {
  hasSpunOnce: boolean
  hasPrize: boolean
}

type PrizeWheelExperienceProps = {
  compact?: boolean
  variant?: "card" | "page"
  onClose?: (info?: PrizeWheelCloseInfo) => void
  onStatusChange?: (info: PrizeWheelCloseInfo) => void
  onWon?: (prize: PrizeWheelPrizeView) => void
  onAuthRequired?: () => void
}

const CONFETTI_COLORS = ["#5B47D6", "#7C5CFC", "#f2b93d", "#cd83db", "#ffffff"]

type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function getCountdownParts(target: Date, now = Date.now()): CountdownParts {
  const remaining = Math.max(0, target.getTime() - now)
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: remaining <= 0,
  }
}

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function CampaignCountdown({ variant = "card" }: { variant?: "card" | "page" }) {
  const [parts, setParts] = useState(() => getCountdownParts(PRIZE_WHEEL_CAMPAIGN_START_AT))

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(PRIZE_WHEEL_CAMPAIGN_START_AT))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (parts.done) {
    return (
      <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-gray-600 ring-1 ring-[#EBE8FF]">
        Campania pornește în curând. Revino peste câteva momente.
      </p>
    )
  }

  if (variant === "page") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C5CFC]">
          Se deschide 1 septembrie, 12:00
        </p>
        <div className="mt-4 flex max-w-full flex-wrap items-end justify-center gap-2 sm:gap-3">
          <CountdownUnit value={parts.days} label="zile" />
          <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
          <CountdownUnit value={parts.hours} label="ore" />
          <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
          <CountdownUnit value={parts.minutes} label="min" />
          <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
          <CountdownUnit value={parts.seconds} label="sec" />
        </div>
      </div>
    )
  }

  const units = [
    { label: "zile", value: parts.days },
    { label: "ore", value: parts.hours },
    { label: "min", value: parts.minutes },
    { label: "sec", value: parts.seconds },
  ]

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#f6f4ff] to-[#fff7e8] px-4 py-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C5CFC]">Se deschide 1 septembrie, 12:00</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div key={unit.label} className="rounded-2xl bg-white px-1 py-3 shadow-[0_8px_24px_-16px_rgba(92,71,214,0.55)]">
            <p className="text-4xl font-black tabular-nums tracking-tight text-gray-900 sm:text-5xl">
              {unit.label === "zile" ? unit.value : pad2(unit.value)}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{unit.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function fireWinConfetti() {
  const defaults = { zIndex: 4000, colors: CONFETTI_COLORS, disableForReducedMotion: true }
  confetti({ ...defaults, particleCount: 140, spread: 90, origin: { y: 0.45 } })
  confetti({ ...defaults, particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.65 } })
  confetti({ ...defaults, particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.65 } })
}

export function PrizeWheelExperience({
  compact = false,
  variant = "card",
  onClose,
  onStatusChange,
  onWon,
  onAuthRequired,
}: PrizeWheelExperienceProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState<PrizeWheelStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<PrizeWheelSpinResponse | null>(null)
  const [prizeAccepted, setPrizeAccepted] = useState(false)
  const bonusStepRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prizeAccepted) return
    bonusStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [prizeAccepted])

  const loadStatus = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    const response = await fetch("/api/prize-wheel", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const payload = (await response.json()) as PrizeWheelStatusResponse & { error?: string }
    if (!response.ok) {
      throw new Error(payload.error || "Nu am putut încărca roata.")
    }
    setStatus(payload)
    return payload
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        const payload = await loadStatus()
        if (cancelled) return
        setStatus(payload)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Nu am putut încărca roata.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [loadStatus, user?.id])

  const handleSpin = async () => {
    if (spinning) return
    setError(null)

    if (!user) {
      if (onAuthRequired) {
        onAuthRequired()
        return
      }
      window.location.assign("/login?redirect=/castiga")
      return
    }

    setSpinning(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        if (onAuthRequired) {
          setSpinning(false)
          onAuthRequired()
          return
        }
        window.location.assign("/login?redirect=/castiga")
        return
      }

      const response = await fetch("/api/prize-wheel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as PrizeWheelSpinResponse & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Nu am putut învârti roata.")
      }

      const segmentIndex = segmentIndexForResult(payload.result, payload.segmentIndex)
      setRotation((current) => nextWheelRotation(current, segmentIndex))
      window.setTimeout(() => {
        setLastResult(payload)
        setSpinning(false)
        if (payload.prize) {
          fireWinConfetti()
          onWon?.(payload.prize)
        }
        void loadStatus()
      }, 4500)
    } catch (err) {
      setSpinning(false)
      setError(err instanceof Error ? err.message : "Nu am putut învârti roata.")
    }
  }

  const campaign = status?.campaign
  const userState = status?.user
  const prize = lastResult?.prize ?? userState?.prize ?? null
  const isLive = Boolean(campaign?.isLive)
  const closeInfo = {
    hasSpunOnce: Boolean(userState?.hasSpunOnce || lastResult),
    hasPrize: Boolean(prize),
  }

  useEffect(() => {
    onStatusChange?.(closeInfo)
  }, [closeInfo.hasSpunOnce, closeInfo.hasPrize, onStatusChange])

  const isPage = variant === "page"
  const requestAuth = () => {
    if (onAuthRequired) {
      onAuthRequired()
      return
    }
    window.location.assign("/login?redirect=/castiga")
  }

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" />
      </div>
    )
  }

  return (
    <div className={cn("relative w-full", compact || isPage ? "max-w-[440px]" : "max-w-xl")}>
      {onClose ? (
        <button
          type="button"
          onClick={() => onClose?.(closeInfo)}
          className="absolute -right-1 -top-1 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-md transition hover:text-gray-800"
          aria-label="Închide"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="text-center">
        {isPage ? (
          <>
            <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(124,92,252,0.28)]">
              1 septembrie · ora 12:00
            </span>
            <h1 className="mt-5 text-[2rem] font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl">
              Roata cu premii
            </h1>
            <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
              Învârte și poți lua 7 zile Premium, reduceri sau anualul la 1 leu.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C5CFC]">Planck Câștigă</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Roata cu premii</h2>
            <p className="mt-2 text-sm text-gray-600">
              Învârte și poți lua 7 zile Premium, reduceri sau anualul la 1 leu.
            </p>
          </>
        )}
      </div>

      <div className={cn("flex justify-center", isPage ? "mt-6 sm:mt-8" : "mt-6")}>
        <PrizeWheelVisual
          rotation={rotation}
          spinning={spinning}
          size={compact ? 280 : isPage ? 264 : 320}
        />
      </div>

      <div className={cn("space-y-3 text-center", isPage ? "mt-6 sm:mt-8" : "mt-6")}>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        {!isLive ? <CampaignCountdown variant={variant} /> : null}

        {!user ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {isLive
                ? "Autentifică-te ca elev ca să învârți roata."
                : "Intră în cont ca să fii gata marți, la 12:00."}
            </p>
            <button
              type="button"
              onClick={requestAuth}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-[15px] font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110 active:brightness-[0.98]"
            >
              Intră în cont
            </button>
          </div>
        ) : null}

        {isLive && user && userState && !userState.isStudent ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Roata este disponibilă doar pentru conturile de elev.
          </p>
        ) : null}

        {isLive && userState?.canSpin && !prize ? (
          <button
            type="button"
            onClick={() => void handleSpin()}
            disabled={spinning}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C5CFC] via-[#cd83db] to-[#f2b93d] text-sm font-bold text-white shadow-[0_4px_0_#6d4de0] transition hover:translate-y-0.5 hover:shadow-[0_2px_0_#6d4de0] disabled:cursor-not-allowed disabled:opacity-70 sm:h-14 sm:text-base"
          >
            {spinning ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se învârte...
              </span>
            ) : userState.hasSpunOnce ? (
              "Învârte din nou"
            ) : (
              "Învârte roata"
            )}
          </button>
        ) : null}

        {lastResult?.result === "spin_again" && !prize ? (
          <p className="text-sm font-semibold text-[#7C5CFC]">Aproape! Învârte din nou ca să iei premiul.</p>
        ) : null}

        {prize ? (
          prizeAccepted && lastResult?.prize ? (
            <div ref={bonusStepRef} className="space-y-3">
              <div className="rounded-2xl border border-[#d9f2e0] bg-[#f2fbf5] px-4 py-3 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">Premiu acceptat</p>
                <p className="mt-1 text-base font-black text-gray-900">
                  {prize.label || getPrizeWheelPrizeLabel(prize.type)}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-gray-800">{prize.code}</p>
              </div>
              <CastigaInstagramBonusCard
                compact
                footer={
                  <Link
                    href="/pricing"
                    className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#16a34a] text-sm font-bold text-white transition hover:brightness-110"
                  >
                    Folosește premiul
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#d9f2e0] bg-[#f2fbf5] px-4 py-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">Ai câștigat</p>
              <p className="mt-1 text-lg font-black text-gray-900">
                {prize.label || getPrizeWheelPrizeLabel(prize.type)}
              </p>
              <p className="mt-2 font-mono text-sm font-semibold tracking-wide text-gray-800">{prize.code}</p>
              <p className="mt-1 text-xs text-gray-500">
                Codul e salvat pe profil și se aplică automat pe pagina de prețuri.
              </p>
              {lastResult?.prize ? (
                <button
                  type="button"
                  onClick={() => setPrizeAccepted(true)}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#16a34a] text-sm font-bold text-white transition hover:brightness-110"
                >
                  Acceptă premiul
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#16a34a] text-sm font-bold text-white transition hover:brightness-110"
                >
                  Folosește premiul
                </Link>
              )}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
