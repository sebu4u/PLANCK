"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Gift } from "lucide-react"
import { PrizeWheelVisual } from "@/components/prize-wheel/prize-wheel-visual"
import { PrizeCouponExpiryTimer } from "@/components/prize-wheel/prize-coupon-expiry"
import { useLanding1LeuCampaign } from "@/lib/landing-1leu"
import { usePrizeCouponCountdown } from "@/hooks/use-prize-coupon-countdown"
import type { PrizeWheelPrizeView } from "@/lib/prize-wheel/types"
import { supabase } from "@/lib/supabaseClient"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function StudentPrizeWheelCard() {
  const { days, hours, minutes, seconds, isLive } = useLanding1LeuCampaign()
  const remaining = days + hours + minutes + seconds
  const showCountdown = !isLive && remaining > 0
  const [prize, setPrize] = useState<PrizeWheelPrizeView | null>(null)
  const { expired } = usePrizeCouponCountdown(prize?.expiresAt)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return
      const response = await fetch("/api/prize-wheel", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const payload = await response.json()
      const next = payload?.user?.prize as PrizeWheelPrizeView | null
      if (!cancelled) setPrize(next && !next.redeemedAt ? next : null)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (prize) {
    return (
      <Link
        href={expired ? "/castiga" : "/pricing"}
        aria-label={expired ? "Cuponul a expirat" : "Folosește premiul câștigat"}
        className="flex w-full items-center gap-3 rounded-3xl border-2 border-[#bbf7d0] bg-gradient-to-r from-white to-[#ecfdf3] px-3 py-2.5 shadow-[0_8px_20px_rgba(22,163,74,0.08)] transition-opacity active:opacity-90"
      >
        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16a34a]/15 text-[#16a34a]">
            <Gift className="h-5 w-5" aria-hidden />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#16a34a]">Premiu câștigat</p>
          <p className="mt-0.5 truncate text-sm font-bold leading-snug text-[#111111]">{prize.label}</p>
          <PrizeCouponExpiryTimer
            expiresAt={prize.expiresAt}
            redeemedAt={prize.redeemedAt}
            compact
            className="mt-1"
          />
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#111827]">
          {expired ? "Expirat" : "Folosește"}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
    )
  }

  return (
    <Link
      href="/castiga"
      aria-label={isLive ? "Roata e deschisă. Învârte acum" : "Deschide roata cu premii"}
      className="flex w-full items-center gap-3 rounded-3xl border-2 border-[#f3d0dc] bg-gradient-to-r from-white to-[#f9c5d8] px-3 py-2.5 shadow-[0_8px_20px_rgba(232,90,140,0.08)] transition-opacity active:opacity-90"
    >
      <div className="flex shrink-0 flex-col items-center gap-1">
        <PrizeWheelVisual
          rotation={18}
          spinning={false}
          size={56}
          showLabels={false}
          showPointer={false}
          tone="rose"
          className="mx-0"
        />
        {showCountdown ? (
          <span className="inline-flex items-center rounded-full bg-[#fff3e6] px-1.5 py-0.5 text-[10px] font-black leading-none tabular-nums text-[#ea580c] ring-1 ring-[#fed7aa]">
            {pad(days)}
            <span className="ml-0.5 mr-0.5 text-[7px] font-bold uppercase tracking-wider text-[#c2410c]">z</span>
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </span>
        ) : isLive ? (
          <span className="inline-flex items-center rounded-full bg-[#e85a8c] px-1.5 py-0.5 text-[10px] font-black leading-none uppercase tracking-wider text-white">
            Live
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Câștigă</p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-[#111111]">
          {isLive ? "Roata e deschisă" : "Roata cu premii"}
        </p>
        <p className="mt-0.5 truncate text-xs text-[#6b7280]">
          {isLive ? "Învârte acum și poți lua Premium" : "Învârte și poți câștiga Premium"}
        </p>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#111827]">
        {isLive ? "Învârte" : "Joacă"}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  )
}
