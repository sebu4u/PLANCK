"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface PersonalizedCourseGeneratingCardProps {
  chapterId: string
  chapterSlug: string
  title: string
  status: "creating" | "ready" | "failed" | null
  failureReason: string | null
}

const POLL_INTERVAL_MS = 4000
const MAX_POLL_DURATION_MS = 10 * 60 * 1000 // 10 minutes max before showing a timeout hint

export function PersonalizedCourseGeneratingCard({
  chapterId,
  chapterSlug,
  title,
  status: initialStatus,
  failureReason,
}: PersonalizedCourseGeneratingCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [reason] = useState(failureReason)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (status === "ready") {
      // The server component already redirects on ready, but if we polled into
      // ready, refresh so the server redirect takes effect.
      router.refresh()
      return
    }
    if (status === "failed") return

    const start = Date.now()
    const interval = window.setInterval(async () => {
      if (Date.now() - start > MAX_POLL_DURATION_MS) {
        setTimedOut(true)
        window.clearInterval(interval)
        return
      }

      try {
        const res = await fetch(`/api/personalized-courses/status?chapterId=${chapterId}`, {
          credentials: "same-origin",
        })
        if (!res.ok) return
        const data = (await res.json().catch(() => ({}))) as {
          status?: "creating" | "ready" | "failed"
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
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [status, chapterId, router, chapterSlug])

  if (status === "failed") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
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
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
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

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Loader2 className="mb-5 h-12 w-12 animate-spin text-[#7c3aed]" />
      <h1 className="mb-2 text-xl font-bold text-[#111111]">Generăm cursul „{title}"</h1>
      <p className="mb-1 text-sm text-[#555555]">
        AI-ul pregătește lecțiile și exercițiile interactive. Asta poate dura 1-3 minute.
      </p>
      <p className="text-xs text-[#888888]">
        Poți schimba tabul sau să dai refresh — cursul se salvează automat.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-[#999999]">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span>Cursul a fost creat — îl vei găsi și pe /invata când e gata.</span>
      </div>
    </div>
  )
}
