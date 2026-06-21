"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Sparkles, Trash2 } from "lucide-react"
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
const MESSAGE_CYCLE_MS = 2600

const STAGE_LABELS: Record<string, string> = {
  searching: "Caut conținut Planck relevant",
  planning: "AI planifică lecțiile și exercițiile",
  saving: "Salvez lecțiile în baza de date",
  saving_lessons: "Salvez lecțiile în baza de date",
  finalizing: "Verific și activez cursul",
  ready: "Curs gata!",
}

// Rotating short messages per stage — shown at the bottom so the card feels alive
// while the bar shimmers. The server's real message is always shown first, then
// these elaborations cycle.
const STAGE_FALLBACK_MESSAGES: Record<string, string[]> = {
  searching: [
    "Analizez obiectivul tău de învățare…",
    "Caut probleme, grile și lecții relevante…",
    "Selectez cel mai potrivit conținut Planck…",
  ],
  planning: [
    "Planific structura cursului pe lecții…",
    "Aleg exercițiile interactive pentru fiecare lecție…",
    "Ordonez topicurile în progresie logică…",
    "Verific varietatea itemilor (explicații, grile, probleme)…",
  ],
  saving: [
    "Salvez lecțiile și itemii în baza de date…",
    "Generez conținutul fiecărui item…",
    "Aplic verificările de calitate…",
  ],
  saving_lessons: [
    "Salvez lecțiile și itemii în baza de date…",
    "Generez conținutul fiecărui item…",
    "Aplic verificările de calitate…",
  ],
  finalizing: [
    "Verific că toate itemii sunt validați…",
    "Activez cursul pe /invata…",
    "Pregătesc redirecționarea către prima lecție…",
  ],
}

function buildMessageCycle(stage: string | null, serverMessage: string | null): string[] {
  const head = serverMessage || STAGE_LABELS[stage ?? ""] || "Pornire…"
  const fallbacks = STAGE_FALLBACK_MESSAGES[stage ?? ""] ?? []
  // Dedupe while preserving order.
  const seen = new Set<string>([head])
  const cycle = [head]
  for (const m of fallbacks) {
    if (!seen.has(m)) {
      seen.add(m)
      cycle.push(m)
    }
  }
  return cycle
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

  // Cycling bottom message: rebuild the cycle whenever the server stage/message
  // changes, then advance through it on a timer so the text feels alive.
  const messageCycleRef = useRef<string[]>(buildMessageCycle(initialProgress?.stage ?? null, initialProgress?.message ?? null))
  const [messageIndex, setMessageIndex] = useState(0)
  const lastServerMessageRef = useRef<string | null>(initialProgress?.message ?? null)
  const lastServerStageRef = useRef<string | null>(initialProgress?.stage ?? null)

  useEffect(() => {
    const serverMsg = progress.message
    const serverStage = progress.stage
    if (serverMsg !== lastServerMessageRef.current || serverStage !== lastServerStageRef.current) {
      lastServerMessageRef.current = serverMsg
      lastServerStageRef.current = serverStage
      messageCycleRef.current = buildMessageCycle(serverStage, serverMsg)
      setMessageIndex(0)
    }
  }, [progress.message, progress.stage])

  useEffect(() => {
    if (status === "ready" || status === "failed") return
    const interval = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % Math.max(1, messageCycleRef.current.length))
    }, MESSAGE_CYCLE_MS)
    return () => window.clearInterval(interval)
  }, [status])

  const displayMessage = messageCycleRef.current[messageIndex % Math.max(1, messageCycleRef.current.length)] ?? "Pornire…"

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

      {/* Progress bar (continually moving shimmer) */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-[#666]">Generare în curs…</span>
          <span className="tabular-nums font-semibold text-[#7c3aed]">{Math.round(percent)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#e6e6e6]">
          <div
            className="pc-progress-fill h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Cycling live message at the bottom */}
      <div className="mt-4 flex items-center gap-2 text-sm text-[#555]">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#7c3aed]" />
        <span key={displayMessage} className="animate-fade-in-up">{displayMessage}</span>
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
