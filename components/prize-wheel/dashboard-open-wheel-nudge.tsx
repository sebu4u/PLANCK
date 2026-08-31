"use client"

import Link from "next/link"

import { PrizeWheelVisual } from "@/components/prize-wheel/prize-wheel-visual"
import { cn } from "@/lib/utils"

export function DashboardOpenWheelNudge() {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[280] flex justify-center px-3",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.75rem)]",
        "md:justify-end md:px-6 burger:bottom-6",
      )}
    >
      <Link
        href="/castiga"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-[#e85a8c] bg-white px-3.5 py-3 shadow-[0_12px_32px_rgba(232,90,140,0.18)] md:max-w-sm"
      >
        <PrizeWheelVisual
          rotation={18}
          spinning={false}
          size={44}
          showLabels={false}
          showPointer={false}
          tone="rose"
          className="mx-0 shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#e85a8c]">
            Roata e deschisă
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-gray-900">
            Câștigă anualul la 1 leu
          </span>
        </span>
        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#e85a8c] px-3.5 text-sm font-bold text-white">
          Învârte
        </span>
      </Link>
    </div>
  )
}
