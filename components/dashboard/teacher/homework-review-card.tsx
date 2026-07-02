"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { Camera, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { TeacherPendingHomeworkReview } from "@/lib/teacher/server"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return "recent"

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) return "acum"
  if (diffMinutes < 60) return `acum ${diffMinutes} min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `acum ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "ieri"
  return `acum ${diffDays} zile`
}

interface HomeworkReviewCardProps {
  initialItems: TeacherPendingHomeworkReview[]
  initialTotalCount: number
}

export function HomeworkReviewCard({ initialItems, initialTotalCount }: HomeworkReviewCardProps) {
  const { toast } = useToast()
  const [items, setItems] = useState(initialItems)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const markReviewed = useCallback(
    async (submissionId: string) => {
      const removedItem = items.find((item) => item.submission_id === submissionId)
      if (!removedItem) return

      setReviewingId(submissionId)
      setItems((previous) => previous.filter((item) => item.submission_id !== submissionId))
      setTotalCount((previous) => Math.max(0, previous - 1))

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) throw new Error("no_token")

        const response = await fetch(`/api/teacher/submissions/${submissionId}/review`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error("review_failed")
        }

        toast({
          title: "Marcat ca verificat",
          description: "Tema a fost eliminată din lista de corectat.",
        })
      } catch {
        setItems((previous) =>
          [...previous, removedItem].sort((left, right) =>
            right.submitted_at.localeCompare(left.submitted_at),
          ),
        )
        setTotalCount((previous) => previous + 1)
        toast({
          title: "Nu am putut marca tema",
          description: "Încearcă din nou peste câteva secunde.",
          variant: "destructive",
        })
      } finally {
        setReviewingId(null)
      }
    },
    [items, toast],
  )

  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Teme de corectat</h2>
          <p className="mt-1 text-sm text-[#6b7280]">Poze trimise de elevi care așteaptă verificarea ta</p>
        </div>
        {totalCount > 0 ? (
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-semibold text-[#4338ca]">
            {totalCount}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 text-center">
            <p className="text-sm font-medium text-[#111827]">Nicio temă în așteptare 🎉</p>
            <p className="mt-1 text-xs text-[#6b7280]">
              Când elevii trimit poze la teme, le vei vedea aici.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.submission_id}
              className="rounded-2xl border border-[#eceff3] bg-[#fafafa] p-3 transition-colors hover:border-[#dbeafe] hover:bg-[#f8fbff]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#111827]">{item.student_name}</p>
                  <p className="mt-0.5 truncate text-xs text-[#6b7280]">
                    {item.classroom_name} · {item.assignment_title}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#374151]">{item.problem_title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" aria-hidden />
                      {item.photo_count} {item.photo_count === 1 ? "poză" : "poze"}
                    </span>
                    <span>·</span>
                    <span>trimis {formatRelativeTime(item.submitted_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="h-8 rounded-full text-xs">
                  <Link href={`/classrooms/${item.classroom_id}/assignments/${item.assignment_id}`}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Vezi tema
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-8 rounded-full text-xs",
                    reviewingId === item.submission_id && "opacity-70",
                  )}
                  disabled={reviewingId === item.submission_id}
                  onClick={() => void markReviewed(item.submission_id)}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Marchează ca verificat
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
