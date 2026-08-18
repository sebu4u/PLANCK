"use client"

import { useState } from "react"
import Image from "next/image"

import {
  PrizeWheelExperience,
  type PrizeWheelCloseInfo,
} from "@/components/prize-wheel/prize-wheel-experience"

type PrizeWheelDashboardOverlayProps = {
  onClose: (info?: PrizeWheelCloseInfo) => void
}

export function PrizeWheelDashboardOverlay({ onClose }: PrizeWheelDashboardOverlayProps) {
  const [closeInfo, setCloseInfo] = useState<PrizeWheelCloseInfo>({
    hasSpunOnce: false,
    hasPrize: false,
  })

  return (
    <div
      className="fixed inset-0 z-[510] animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Roata cu premii"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Închide"
        onClick={() => onClose(closeInfo)}
      />

      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        <Image
          src="/images/exerseaza/stanga-roata.png"
          alt=""
          width={1200}
          height={900}
          priority
          className="absolute bottom-0 left-0 h-[min(48vh,380px)] w-auto max-w-[32vw] object-contain object-bottom"
        />
        <Image
          src="/images/exerseaza/pregatiri-icon.png"
          alt=""
          width={900}
          height={1400}
          priority
          className="absolute bottom-0 right-0 h-[min(52vh,420px)] w-auto max-w-[28vw] object-contain object-bottom"
        />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="w-full max-w-[460px] rounded-[28px] border border-white/20 bg-white px-5 py-6 shadow-2xl sm:px-7 sm:py-8">
          <PrizeWheelExperience compact onClose={onClose} onStatusChange={setCloseInfo} />
        </div>
      </div>
    </div>
  )
}
