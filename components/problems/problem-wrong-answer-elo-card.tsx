"use client"

import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"

export type ProblemWrongAnswerPenalty =
  | { kind: "deducted"; previousElo: number; newElo: number; deducted: number }
  | { kind: "anonymous" }

interface ProblemWrongAnswerEloCardProps {
  penalty: ProblemWrongAnswerPenalty
  onDismiss: () => void
}

export function ProblemWrongAnswerEloCard({ penalty, onDismiss }: ProblemWrongAnswerEloCardProps) {
  const isDeducted = penalty.kind === "deducted"
  const previousElo = isDeducted ? penalty.previousElo : 0
  const newElo = isDeducted ? penalty.newElo : 0
  const deducted = isDeducted ? penalty.deducted : 0

  const [displayElo, setDisplayElo] = useState(previousElo)

  useEffect(() => {
    if (!isDeducted) return

    let frame = 0
    const start = performance.now()
    const duration = 850
    const delta = newElo - previousElo

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayElo(Math.round(previousElo + delta * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isDeducted, newElo, previousElo])

  return (
    <div className="fixed inset-0 z-[520] flex items-center justify-center bg-rose-950/35 px-5 backdrop-blur-sm">
      <div
        className="animate-learning-path-card-pop w-full max-w-sm rounded-[20px] border border-[#e9e0f0] bg-white px-5 py-4 text-center shadow-[0_12px_28px_rgba(82,44,111,0.08)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wrong-answer-title"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600">
          Răspuns greșit
        </p>
        {isDeducted && deducted > 0 ? (
          <h2 id="wrong-answer-title" className="mt-2 text-3xl font-black tracking-tight text-[#111111]">
            −{deducted} ELO
          </h2>
        ) : isDeducted ? (
          <h2 id="wrong-answer-title" className="mt-2 text-2xl font-black tracking-tight text-[#111111]">
            ELO la minim
          </h2>
        ) : (
          <h2 id="wrong-answer-title" className="mt-2 text-2xl font-black tracking-tight text-[#111111]">
            Mai încearcă
          </h2>
        )}
        <p className="mt-2 text-sm font-medium text-[#2C2F33]/75">
          {isDeducted
            ? "Verificarea răspunsului a fost incorectă."
            : "Verificarea răspunsului a fost incorectă. Conectează-te ca să-ți urmărești ELO-ul."}
        </p>

        {isDeducted ? (
          <div className="mt-4 rounded-2xl bg-[linear-gradient(180deg,#ffe4e6_0%,#fff1f2_100%)] px-5 py-5">
            <p className="text-sm font-semibold text-[#9f5968]">ELO-ul tău</p>
            <p className="mt-2 text-5xl font-black tabular-nums text-rose-700">{displayElo}</p>
            <p className="mt-2 text-sm font-semibold text-rose-600">
              {previousElo} → {newElo}
            </p>
            {deducted === 0 ? (
              <p className="mt-2 text-xs font-medium text-rose-600/90">Nu se mai scade ELO sub 0.</p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#9f1239] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_2px_0_#9f1239]"
        >
          Înțeles
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
