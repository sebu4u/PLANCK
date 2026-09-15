"use client"

import { useEffect, useMemo, useState } from "react"
import { startAssignmentAttemptAction } from "@/app/classrooms/teacher-actions"

interface TestAttemptGuardProps {
  assignmentId: string
  timeLimitMinutes: number | null
  startedAt: string | null
  windowEnd: string | null
}

export function TestAttemptGuard({ assignmentId, timeLimitMinutes, startedAt, windowEnd }: TestAttemptGuardProps) {
  const [startIso, setStartIso] = useState(startedAt)
  const [blurCount, setBlurCount] = useState(0)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const form = new FormData()
    form.set("assignment_id", assignmentId)
    void startAssignmentAttemptAction(form)
    if (!startIso) setStartIso(new Date().toISOString())
  }, [assignmentId, startIso])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") setBlurCount((value) => value + 1)
    }
    document.addEventListener("visibilitychange", onHide)
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.clearInterval(timer)
    }
  }, [])

  const remainingLabel = useMemo(() => {
    const ends: number[] = []
    if (startIso && timeLimitMinutes) {
      ends.push(new Date(startIso).getTime() + timeLimitMinutes * 60 * 1000)
    }
    if (windowEnd) ends.push(new Date(windowEnd).getTime())
    if (ends.length === 0) return null
    const remaining = Math.min(...ends) - now
    if (remaining <= 0) return "Timpul s-a terminat"
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, "0")}`
  }, [now, startIso, timeLimitMinutes, windowEnd])

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Mod test — rămâi pe această pagină.</p>
      {remainingLabel ? <p className="mt-1 tabular-nums">Timp rămas: {remainingLabel}</p> : null}
      {blurCount > 0 ? (
        <p className="mt-1 text-rose-700">Ai părăsit pagina de {blurCount} {blurCount === 1 ? "dată" : "ori"}.</p>
      ) : null}
    </div>
  )
}
