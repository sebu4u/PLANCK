"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Clock3 } from "lucide-react"
import { formatCountdown } from "@/lib/contest-utils"
import { cn } from "@/lib/utils"

interface TesteTimerProps {
  startedAt: string
  timeLimitSeconds: number
  className?: string
}

export function TesteTimer({ startedAt, timeLimitSeconds, className }: TesteTimerProps) {
  const computeRemaining = useCallback(() => {
    const started = Date.parse(startedAt)
    if (!Number.isFinite(started)) return timeLimitSeconds
    const elapsed = Math.floor((Date.now() - started) / 1000)
    return timeLimitSeconds - elapsed
  }, [startedAt, timeLimitSeconds])

  const [remaining, setRemaining] = useState(computeRemaining)

  useEffect(() => {
    setRemaining(computeRemaining())
    const id = window.setInterval(() => {
      setRemaining(computeRemaining())
    }, 1000)
    return () => window.clearInterval(id)
  }, [computeRemaining])

  const exceeded = remaining < 0
  const displaySeconds = Math.abs(remaining)

  const label = useMemo(() => {
    if (exceeded) return "Timp depășit"
    if (remaining <= 60) return "Mai puțin de un minut"
    return "Timp rămas"
  }, [exceeded, remaining])

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
        exceeded ? "border-amber-300 bg-amber-50" : "border-orange-200 bg-white/90",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          exceeded ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-600",
        )}
      >
        {exceeded ? <AlertTriangle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/55">{label}</p>
        <p className={cn("font-mono text-2xl font-bold", exceeded ? "text-amber-800" : "text-[#0b0c0f]")}>
          {exceeded ? `+${formatCountdown(displaySeconds)}` : formatCountdown(Math.max(0, remaining))}
        </p>
      </div>
    </div>
  )
}
