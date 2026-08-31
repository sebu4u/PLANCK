"use client"

import Link from "next/link"
import { X } from "lucide-react"

import { PrizeWheelVisual } from "@/components/prize-wheel/prize-wheel-visual"

type PrizeWheelDashboardOverlayProps = {
  onClose: () => void
}

export function PrizeWheelDashboardOverlay({ onClose }: PrizeWheelDashboardOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[510] flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-wheel-open-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Închide"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[400px] rounded-[28px] border-2 border-[#e85a8c] bg-white px-5 py-6 shadow-[0_24px_60px_-24px_rgba(232,90,140,0.45)] sm:px-7 sm:py-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#fde8f0] hover:text-[#9d1757]"
          aria-label="Închide"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <PrizeWheelVisual
            rotation={18}
            spinning={false}
            size={188}
            showLabels={false}
            showPointer={false}
            tone="rose"
            idle
          />

          <h2
            id="prize-wheel-open-title"
            className="mt-5 text-[1.75rem] font-black leading-tight tracking-tight text-gray-900 sm:text-4xl"
          >
            Roata s-a deschis
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600 sm:text-base">
            Câștigă abonament pe tot anul la doar 1 leu
          </p>

          <Link
            href="/castiga"
            onClick={onClose}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#e85a8c] text-[15px] font-bold text-white shadow-[0_4px_0_#c44572] transition hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_#c44572]"
          >
            Învârte roata
          </Link>
        </div>
      </div>
    </div>
  )
}
