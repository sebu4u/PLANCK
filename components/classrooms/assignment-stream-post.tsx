import Link from "next/link"
import { AlertTriangle, ArrowRight, CalendarDays } from "lucide-react"
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
    dateStyle: "short",
    timeStyle: "short",
  })
  const deadlineLabel = assignment.deadline
    ? new Date(assignment.deadline).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })
    : "Fără termen"

  const deadlineMs = assignment.deadline ? new Date(assignment.deadline).getTime() : null
  const isOverdue =
    deadlineMs !== null && Number.isFinite(deadlineMs) && deadlineMs < Date.now()

  const assignmentHref = `/classrooms/${classroomId}/assignments/${assignment.id}`

  return (
    <Link
      href={assignmentHref}
      aria-label={`Deschide tema: ${assignment.title}`}
      className={cn(
        "group block rounded-xl border px-3 py-2.5 outline-none transition-[box-shadow,border-color,background-color]",
        isOverdue
          ? "border-rose-200/80 bg-rose-50/30 hover:border-rose-300/90 hover:bg-rose-50/45 hover:shadow-md"
          : "border-[#e8eaed] bg-white hover:border-[#c6dafc] hover:bg-[#fafcff] hover:shadow-md",
        "focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2",
      )}
    >
      <div className="flex gap-2.5">
        <AuthorAvatar name={assignment.author_name} compact />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#111827]">{assignment.author_name}</p>
              <p className="text-[11px] text-[#9ca3af]">{createdAt}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">Temă</span>
              {isOverdue ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-rose-700">
                  <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                  Depășit
                </span>
              ) : null}
            </div>
          </div>

          <h3 className={cn("text-sm font-semibold leading-snug", isOverdue ? "text-rose-950" : "text-[#111827]")}>
            {assignment.title}
          </h3>
          {assignment.description ? (
            <p className="line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-[#6b7280]">
              {assignment.description}
            </p>
          ) : null}
          <p className="text-[11px] text-[#9ca3af]">{assignment.problem_count} probleme</p>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f2f5] pt-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                isOverdue ? "text-rose-800" : "text-[#6b7280]",
              )}
            >
              <CalendarDays className="h-3 w-3 shrink-0 opacity-70" />
              {deadlineLabel}
            </span>
            <DeadlineTimer
              deadline={assignment.deadline}
              className={cn(
                "!rounded-md !px-1.5 !py-0.5 !text-[10px] !font-normal",
                isOverdue ? "!bg-rose-100/80 !text-rose-800" : "!bg-[#f4f5f7] !text-[#4b5563]",
              )}
            />
          </div>

          <div
            className={cn(
              "mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              isOverdue
                ? "bg-rose-100/90 text-rose-900 group-hover:bg-rose-200/85"
                : "bg-[#e8f0fe] text-[#1557b0] group-hover:bg-[#d2e3fc]",
            )}
          >
            Deschide tema
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
