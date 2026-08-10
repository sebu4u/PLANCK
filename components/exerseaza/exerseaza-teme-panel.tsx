import Link from "next/link"
import { AlertTriangle, ArrowRight, BookOpen, CalendarDays } from "lucide-react"
import { AuthorAvatar } from "@/components/classrooms/author-avatar"
import { DeadlineTimer } from "@/components/classrooms/deadline-timer"
import type { UserAssignmentListItem } from "@/lib/classrooms/types"
import { cn } from "@/lib/utils"

interface ExerseazaTemePanelProps {
  assignments: UserAssignmentListItem[]
}

export function ExerseazaTemePanel({ assignments }: ExerseazaTemePanelProps) {
  if (assignments.length === 0) {
    return (
      <div className="flex min-h-[min(50dvh,24rem)] w-full flex-col items-center justify-center px-4 py-10 text-center">
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5e5e5] bg-white text-[#9ca3af]">
            <BookOpen className="h-6 w-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#111827]">Teme</h2>
            <p className="text-base leading-relaxed text-[#374151]">Nu ai nicio temă încă.</p>
          </div>
          <Link
            href="/classrooms"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-semibold text-[#1557b0] transition-colors hover:border-[#c6dafc] hover:bg-[#f8fbff]"
          >
            Mergi la clase
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-[#0b0c0f]">Teme</h1>
        <p className="text-sm text-[#2c2f33]/75 sm:text-base">
          Toate temele din clasele tale, într-o singură listă.
        </p>
      </header>

      <div className="space-y-3">
        {assignments.map((assignment) => {
          const createdAt = new Date(assignment.created_at).toLocaleString("ro-RO", {
            dateStyle: "short",
            timeStyle: "short",
          })
          const deadlineLabel = assignment.deadline
            ? new Date(assignment.deadline).toLocaleString("ro-RO", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Fără termen"

          const deadlineMs = assignment.deadline ? new Date(assignment.deadline).getTime() : null
          const isOverdue =
            deadlineMs !== null && Number.isFinite(deadlineMs) && deadlineMs < Date.now()

          const href = `/classrooms/${assignment.classroom_id}/assignments/${assignment.id}`

          return (
            <Link
              key={assignment.id}
              href={href}
              aria-label={`Deschide tema: ${assignment.title}`}
              className={cn(
                "group block rounded-2xl border px-4 py-3.5 outline-none transition-[box-shadow,border-color,background-color]",
                isOverdue
                  ? "border-rose-200/80 bg-rose-50/30 hover:border-rose-300/90 hover:bg-rose-50/45 hover:shadow-md"
                  : "border-[#e5e5e5] bg-white hover:border-[#c6dafc] hover:bg-[#fafcff] hover:shadow-md",
                "focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2",
              )}
            >
              <div className="flex gap-3">
                <AuthorAvatar name={assignment.author_name} compact />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#111827]">
                        {assignment.author_name}
                      </p>
                      <p className="text-[11px] text-[#9ca3af]">
                        {assignment.classroom_name} · {createdAt}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">
                        Temă
                      </span>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-rose-700">
                          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                          Depășit
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h3
                    className={cn(
                      "text-base font-semibold leading-snug",
                      isOverdue ? "text-rose-950" : "text-[#111827]",
                    )}
                  >
                    {assignment.title}
                  </h3>
                  {assignment.description ? (
                    <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-[#6b7280]">
                      {assignment.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-[#9ca3af]">{assignment.problem_count} probleme</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f2f5] pt-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        isOverdue ? "text-rose-800" : "text-[#6b7280]",
                      )}
                    >
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      {deadlineLabel}
                    </span>
                    <DeadlineTimer
                      deadline={assignment.deadline}
                      className={cn(
                        "!rounded-md !px-1.5 !py-0.5 !text-[10px] !font-normal",
                        isOverdue
                          ? "!bg-rose-100/80 !text-rose-800"
                          : "!bg-[#f4f5f7] !text-[#4b5563]",
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
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
        })}
      </div>
    </div>
  )
}
