"use client"

import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"

interface EloGainCardProps {
  award: LearningPathEloAward
  onContinue: () => void
}

export function EloGainCard({ award, onContinue }: EloGainCardProps) {
  const [displayElo, setDisplayElo] = useState(award.previousElo)

  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const duration = 850
    const delta = award.newElo - award.previousElo

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayElo(Math.round(award.previousElo + delta * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [award.newElo, award.previousElo])

  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-in rounded-[28px] border border-emerald-200 bg-white p-6 text-center shadow-[0_24px_70px_rgba(20,83,45,0.22)] fade-in zoom-in-95 duration-300">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Răspuns corect
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#111111]">
          +{award.awardAmount} ELO
        </h2>
        <div className="mt-5 rounded-2xl bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fffb_100%)] px-5 py-6">
          <p className="text-sm font-semibold text-[#5f6f67]">ELO-ul tău</p>
          <p className="mt-2 text-5xl font-black tabular-nums text-emerald-700">
            {displayElo}
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-600">
            {award.previousElo} → {award.newElo}
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857]"
        >
          Continuă
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
