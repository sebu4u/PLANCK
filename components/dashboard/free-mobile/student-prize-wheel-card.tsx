"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PrizeWheelVisual } from "@/components/prize-wheel/prize-wheel-visual"
import { useCountdown } from "@/lib/landing-campaign"

const CASTIGA_DEADLINE = new Date("2026-09-01T00:00:00")

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function StudentPrizeWheelCard() {
  const { days, hours, minutes, seconds } = useCountdown(CASTIGA_DEADLINE)

  return (
    <Link
      href="/castiga"
      aria-label="Deschide roata cu premii"
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
        <span className="inline-flex items-center rounded-full bg-[#fff3e6] px-1.5 py-0.5 text-[10px] font-black leading-none tabular-nums text-[#ea580c] ring-1 ring-[#fed7aa]">
          {pad(days)}
          <span className="ml-0.5 mr-0.5 text-[7px] font-bold uppercase tracking-wider text-[#c2410c]">z</span>
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9aa0b4]">Câștigă</p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-[#111111]">Roata cu premii</p>
        <p className="mt-0.5 truncate text-xs text-[#6b7280]">Învârte și poți câștiga Premium</p>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#111827]">
        Joacă
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  )
}
