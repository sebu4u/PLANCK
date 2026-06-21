"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePersonalizedCourseGeneration } from "@/components/invata/personalized-course-generation-context"

interface PersonalizedCourseProgressCardProps {
  chapterId: string
  title: string
  description: string | null
  status: "creating" | "ready" | "failed" | null
  failureReason: string | null
  initialProgress?: {
    stage: string | null
    percent: number
    message: string | null
  } | null
  onDelete?: () => void
}

const POLL_INTERVAL_MS = 3000

const STAGE_LABELS: Record<string, string> = {
  searching: "Caut conținut Planck relevant",
  planning: "AI planifică lecțiile și exercițiile",
  saving: "Salvez lecțiile în baza de date",
  saving_lessons: "Salvez lecțiile în baza de date",
  finalizing: "Verific și activez cursul",
  ready: "Curs gata!",
}

export function PersonalizedCourseProgressCard({
  chapterId,
  title,
  description,
  status: initialStatus,
  failureReason,
  initialProgress,
  onDelete,
}: PersonalizedCourseProgressCardProps) {
  const router = useRouter()
  const generation = usePersonalizedCourseGeneration()
  const [status, setStatus] = useState(initialStatus)
  const [progress, setProgress] = useState(
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
        setProgress({ stage: data.stage ?? null, percent: data.percent, message: data.message ?? null })
      }
      if (data.status && data.status !== status) {
        setStatus(data.status)
        if (data.status === "ready") {
          // Drop the optimistic entry (if any) so the server-rendered real chapter
          // takes its place after refresh.
          generation?.removeOptimisticChapter(chapterId)
          router.refresh()
        }
      }
    } catch {
      // network blip
    }
  }, [chapterId, status, router])

  useEffect(() => {
    if (status === "ready") {
      generation?.removeOptimisticChapter(chapterId)
      router.refresh()
      return
    }
    if (status === "failed") return

    const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
    void poll()
    return () => window.clearInterval(interval)
  }, [status, poll, router])

  // --- Failed state ---
  if (status === "failed") {
    return (
      <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[#111111]">{title}</h3>
            <p className="mt-1 text-sm text-[#666]">
              {failureReason || "Generarea a eșuat. Te rugăm să încerci din nou."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/invata")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Încearcă din nou
              </button>
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-sm font-semibold text-[#5f5f5f] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Șterge
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const percent = Math.max(0, Math.min(100, progress.percent))
  const stageLabel = progress.message || STAGE_LABELS[progress.stage ?? ""] || "Pornire…"

  // --- Creating state (progress bar) ---
  return (
    <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
      {/* Header matching chapter section style */}
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6]/10 to-[#7c3aed]/10 sm:h-28 sm:w-28">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-sm sm:h-20 sm:w-20">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-[#111111]">{title}</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Se generează
            </span>
          </div>
          {description ? <p className="mt-0.5 text-sm text-[#707070]">{description}</p> : null}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-[#333]">{stageLabel}</span>
          <span className="tabular-nums font-semibold text-[#7c3aed]">{percent}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#e6e6e6]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] transition-all duration-700 ease-out"
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
          ].map((cp) => {
            const isDone = percent >= cp.threshold
            const isCurrent =
              !isDone &&
              ((cp.id === "search" && percent < 5) ||
                (cp.id === "plan" && percent >= 5 && percent < 65) ||
                (cp.id === "save" && percent >= 65 && percent < 100))
            return (
              <div key={cp.id} className="flex flex-1 flex-col items-center gap-1.5">
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
                  {cp.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {onDelete ? (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5f5f] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Anulează
          </button>
        </div>
      ) : null}
    </div>
  )
}
