import Link from "next/link"
import { AlertTriangle, CalendarDays, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AuthorAvatar } from "@/components/classrooms/author-avatar"
import { DeadlineTimer } from "@/components/classrooms/deadline-timer"
import type { ClassroomAssignmentListItem } from "@/lib/classrooms/types"
import { cn } from "@/lib/utils"

interface AssignmentStreamPostProps {
  classroomId: string
  assignment: ClassroomAssignmentListItem
}

export function AssignmentStreamPost({ classroomId, assignment }: AssignmentStreamPostProps) {
  const createdAt = new Date(assignment.created_at).toLocaleString("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const deadlineLabel = assignment.deadline
    ? new Date(assignment.deadline).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })
    : "Fără termen"

  const deadlineMs = assignment.deadline ? new Date(assignment.deadline).getTime() : null
  const isOverdue =
    deadlineMs !== null && Number.isFinite(deadlineMs) && deadlineMs < Date.now()

  return (
    <Card
      className={cn(
        "relative overflow-hidden shadow-sm transition-colors",
        isOverdue
          ? "border-rose-200/90 bg-gradient-to-br from-rose-50/90 via-white to-white ring-1 ring-rose-100"
          : "border-[#dfe3ea] bg-white",
      )}
    >
      {isOverdue ? (
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-rose-600"
          aria-hidden
        />
      ) : null}

      <CardHeader className={cn("space-y-1 pb-3", isOverdue && "pl-5")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AuthorAvatar name={assignment.author_name} />
            <div>
              <p className="text-sm font-semibold text-[#111827]">{assignment.author_name}</p>
              <p className="text-xs text-[#6b7280]">{createdAt}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-semibold text-[#0369a1]">
              Temă
            </span>
            {isOverdue ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800 shadow-sm">
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                Termen depășit
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3", isOverdue && "pl-5")}>
        <div className="flex items-start gap-2">
          <ClipboardList
            className={cn("mt-0.5 h-5 w-5 shrink-0", isOverdue ? "text-rose-600" : "text-[#2563eb]")}
            aria-hidden
          />
          <div>
            <h3
              className={cn(
                "text-base font-semibold",
                isOverdue ? "text-[#9f1239]" : "text-[#111827]",
              )}
            >
              {assignment.title}
            </h3>
            {assignment.description ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#4b5563]">{assignment.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-[#6b7280]">{assignment.problem_count} probleme</p>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-t pt-3",
            isOverdue ? "border-rose-100" : "border-[#eef2f7]",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              isOverdue ? "text-rose-800" : "text-[#6b7280]",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Termen: {deadlineLabel}
          </span>
          <DeadlineTimer deadline={assignment.deadline} />
        </div>

        <Link
          href={`/classrooms/${classroomId}/assignments/${assignment.id}`}
          className={cn(
            "inline-flex rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isOverdue
              ? "border border-rose-200 bg-white text-rose-900 hover:bg-rose-50"
              : "bg-[#111827] text-white hover:bg-[#1f2937]",
          )}
        >
          Deschide tema
        </Link>
      </CardContent>
    </Card>
  )
}
