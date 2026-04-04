"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeadlineTimerProps {
  deadline: string | null
  className?: string
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(minutes, 0)}m`
}

export function DeadlineTimer({ deadline, className }: DeadlineTimerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const deadlineTime = useMemo(() => {
    if (!deadline) return null
    const parsed = new Date(deadline).getTime()
    return Number.isFinite(parsed) ? parsed : null
  }, [deadline])

  if (!deadlineTime) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-[#6b7280]", className)}>
        <Clock3 className="h-3.5 w-3.5" />
        Fără termen
      </span>
    )
  }

  const diff = deadlineTime - now
  const isLate = diff < 0
  const label = `${isLate ? "Depășit cu" : "Timp rămas"} ${formatDuration(Math.abs(diff))}`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        isLate ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
        className
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
