"use client"

import { useEffect, useRef, useState } from "react"
import { Clock3 } from "lucide-react"

import { formatCountdown } from "@/lib/contest-utils"
import { cn } from "@/lib/utils"

interface ContestTimerProps {
  initialSeconds: number
  label: string
  onExpire?: () => void
  className?: string
}

export function ContestTimer({ initialSeconds, label, onExpire, className }: ContestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, initialSeconds))
  const hasExpiredRef = useRef(false)

  useEffect(() => {
    const next = Math.max(0, initialSeconds)
    setSecondsLeft(next)
    // Nu reseta flag-ul dacă timpul e deja 0 (sincronizare repetată de la server)
    if (next > 0) {
      hasExpiredRef.current = false
    }
  }, [initialSeconds])

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true
        onExpire?.()
      }
      return
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [secondsLeft, onExpire])

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-orange-200 bg-white/90 px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <Clock3 className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <p className="font-mono text-2xl font-bold text-gray-900">{formatCountdown(secondsLeft)}</p>
      </div>
    </div>
  )
}
