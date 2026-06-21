"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PersonalizedCourseGeneratingCardProps {
  chapterId: string
  chapterSlug: string
  title: string
  status: "creating" | "ready" | "failed" | null
  failureReason: string | null
  initialProgress?: ProgressState | null
}

const POLL_INTERVAL_MS = 3000
const MAX_POLL_DURATION_MS = 10 * 60 * 1000 // 10 min timeout hint

interface ProgressState {
  stage: string | null
  percent: number
  message: string | null
}

const STAGE_LABELS: Record<string, string> = {
  searching: "Caut conținut Planck relevant",
  planning: "AI planifică lecțiile și exercițiile",
  saving: "Salvez lecțiile în baza de date",
  saving_lessons: "Salvez lecțiile în baza de date",
  finalizing: "Verific și activez cursul",
  ready: "Curs gata!",
}

export function PersonalizedCourseGeneratingCard({
  chapterId,
  status: initialStatus,
  title,
  failureReason,
  initialProgress,
}: PersonalizedCourseGeneratingCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [reason] = useState(failureReason)
  const [timedOut, setTimedOut] = useState(false)
  const [progress, setProgress] = useState<ProgressState>(
    initialProgress ?? { stage: null, percent: 0, message: null },
  )

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/personalized-courses/status?chapterId=${chapterId}`, {
        credentials: "same-origin",
      })
      if (!res.ok) return
      const data = (await res.json().catch(() => ({}))) as {
        status?: "creating" | "ready" | "failed"
        stage?: string | null
        percent?: number
        message?: string | null
      }
      if (typeof data.percent === "number") {
        setProgress({
          stage: data.stage ?? null,
          percent: data.percent,
          message: data.message ?? null,
        })
      }
      if (data.status && data.status !== status) {
        setStatus(data.status)
        if (data.status === "ready") {
          router.refresh()
        }
      }
    } catch {
      // Network blip — keep polling.
    }
  }, [chapterId, status, router])

  useEffect(() => {
    if (status === "ready") {
      router.refresh()
      return
    }
    if (status === "failed") return

    const start = Date.now()
    const interval = window.setInterval(() => {
      if (Date.now() - start > MAX_POLL_DURATION_MS) {
        setTimedOut(true)
        window.clearInterval(interval)
        return
      }
      void poll()
    }, POLL_INTERVAL_MS)

    // Poll immediately on mount so the bar shows real progress right away.
    void poll()

    return () => window.clearInterval(interval)
  }, [status, poll, router])

  if (status === "failed") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-bold text-[#111111]">Generarea a eșuat</h1>
        <p className="mb-6 text-sm text-[#555555]">
          {reason || "Nu am putut genera cursul personalizat. Te rugăm să încerci din nou."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/invata")}
          className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Înapoi la /invata
        </button>
      </div>
    )
  }

  if (timedOut) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
        <h1 className="mb-2 text-xl font-bold text-[#111111]">Generarea durează mai mult decât de obicei</h1>
        <p className="mb-6 text-sm text-[#555555]">
          Cursul „{title}" este încă în lucru. Poți reveni mai târziu pe această pagină sau pe /invata —
          cursul va apărea automat când este gata.
        </p>
        <button
          type="button"
          onClick={() => router.push("/invata")}
          className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Înapoi la /invata
        </button>
      </div>
    )
  }

  const percent = Math.max(0, Math.min(100, progress.percent))
  const stageLabel = progress.message || STAGE_LABELS[progress.stage ?? ""] || "Pornire…"

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div className="text-left">
          <h1 className="text-lg font-bold text-[#111111] sm:text-xl">Generăm cursul „{title}"</h1>
          <p className="text-xs text-[#888888]">Se salvează automat — poți da refresh sau schimba tabul.</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-[#333333]">{stageLabel}</span>
          <span className="tabular-nums font-semibold text-[#7c3aed]">{percent}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#e6e6e6]">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] transition-all duration-700 ease-out",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Stage checkpoints */}
        <div className="mt-5 flex items-center justify-between">
          {[
            { id: "search", label: "Căutare", threshold: 5 },
            { id: "plan", label: "Planificare", threshold: 15 },
            { id: "save", label: "Salvare", threshold: 65 },
            { id: "ready", label: "Gata", threshold: 100 },
          ].map((checkpoint) => {
            const isDone = percent >= checkpoint.threshold
            const isCurrent =
              !isDone &&
              ((checkpoint.id === "search" && percent < 5) ||
                (checkpoint.id === "plan" && percent >= 5 && percent < 65) ||
                (checkpoint.id === "save" && percent >= 65 && percent < 100))
            return (
              <div key={checkpoint.id} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                    isDone
                      ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                      : isCurrent
                        ? "border-[#7c3aed] bg-white text-[#7c3aed]"
                        : "border-[#d4d4d4] bg-white text-[#bbb]",
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[#d4d4d4]" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium sm:text-xs",
                    isDone ? "text-[#7c3aed]" : isCurrent ? "text-[#555]" : "text-[#aaa]",
                  )}
                >
                  {checkpoint.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live message */}
      {progress.message && (
        <div className="mt-6 w-full rounded-xl border border-[#e6e6e6] bg-[#f7f7f7] px-4 py-3 text-center text-sm text-[#555555]">
          {progress.message}
        </div>
      )}
    </div>
  )
}
