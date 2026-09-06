"use client"

import { useEffect, useState } from "react"
import { getPlanckWeekSignupCountdown } from "@/lib/planck-week"

function TimerPart({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="min-w-[1.35em] text-center font-black tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A7A62]">{label}</span>
    </span>
  )
}

export function PlanckWeekSignupDeadlineBanner() {
  const [countdown, setCountdown] = useState(getPlanckWeekSignupCountdown)

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return
      setCountdown(getPlanckWeekSignupCountdown())
    }
    const onVisibility = () => {
      if (!document.hidden) tick()
    }
    tick()
    const id = window.setInterval(tick, 1000)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-[80] border-b border-[#E8DDC8] bg-[#F8F1E3] text-[#3F3426] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-11 max-w-7xl flex-nowrap items-center justify-center gap-x-3 px-3 py-2 text-center sm:min-h-12 sm:px-4">
        {countdown.closed ? (
          <p className="text-[13px] font-bold sm:text-sm">Înscrierile s-au închis.</p>
        ) : (
          <>
            <p className="text-[12px] font-semibold leading-tight sm:text-[13px]">
              Înscrierile se închid în
            </p>
            <p
              className="inline-flex items-baseline gap-1.5 text-[13px] font-black sm:gap-2 sm:text-sm"
              aria-live="polite"
              aria-label={`Timp rămas: ${countdown.days} zile, ${countdown.hours} ore, ${countdown.minutes} minute, ${countdown.seconds} secunde`}
            >
              <TimerPart value={countdown.days} label="z" />
              <span className="text-[#C4B49A]" aria-hidden>
                :
              </span>
              <TimerPart value={countdown.hours} label="h" />
              <span className="text-[#C4B49A]" aria-hidden>
                :
              </span>
              <TimerPart value={countdown.minutes} label="m" />
              <span className="text-[#C4B49A]" aria-hidden>
                :
              </span>
              <TimerPart value={countdown.seconds} label="s" />
            </p>
          </>
        )}
      </div>
    </div>
  )
}
