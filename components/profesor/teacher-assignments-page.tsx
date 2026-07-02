"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarDays, NotebookPen, Plus } from "lucide-react"
import { TeacherNewAssignmentDialog } from "@/components/profesor/teacher-new-assignment-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import type { ClassroomSummary } from "@/lib/classrooms/types"
import type { TeacherAssignmentOverviewItem } from "@/lib/teacher/server"

interface TeacherAssignmentsPageProps {
  assignments: TeacherAssignmentOverviewItem[]
  classrooms: ClassroomSummary[]
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return "Fără termen limită"

  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return "Fără termen limită"
  return date.toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })
}

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })
}

export function TeacherAssignmentsPage({
  assignments,
  classrooms,
}: TeacherAssignmentsPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const teacherClassrooms = classrooms.filter((classroom) => classroom.role === "teacher")

  return (
    <>
      <div
        className={cn(
          "min-h-[100dvh] bg-[#f8f9fa] pt-16",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
          "burger:pb-12",
        )}
      >
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[#111827]">Teme</h1>
              <p className="text-sm text-[#6b7280] sm:text-base">
                Toate temele pe care le-ai dat la clasele tale.
              </p>
            </div>

            {teacherClassrooms.length > 0 ? (
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="h-11 shrink-0 rounded-full bg-[#1a73e8] px-5 text-sm font-semibold text-white hover:bg-[#1557b0]"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Temă nouă
              </Button>
            ) : null}
          </div>

          {teacherClassrooms.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
              <NotebookPen className="mx-auto h-10 w-10 text-[#9ca3af]" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold text-[#111827]">Nu ai încă nicio clasă</h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                Creează o clasă ca să poți da teme elevilor.
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link href="/classrooms/new">Creează o clasă</Link>
              </Button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
              <NotebookPen className="mx-auto h-10 w-10 text-[#9ca3af]" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold text-[#111827]">Nicio temă încă</h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                Creează prima temă și alege exercițiile din catalog.
              </p>
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="mt-6 rounded-full bg-[#1a73e8] hover:bg-[#1557b0]"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Temă nouă
              </Button>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/classrooms/${assignment.classroom_id}/assignments/${assignment.id}`}
                  className="block rounded-2xl border border-[#e8eaed] bg-white p-4 shadow-sm transition hover:border-[#c7d2fe] hover:shadow-md md:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6366f1]">
                        {assignment.classroom_name}
                      </p>
                      <h2 className="truncate text-lg font-semibold text-[#111827]">{assignment.title}</h2>
                      {assignment.description ? (
                        <p className="line-clamp-2 text-sm text-[#6b7280]">{assignment.description}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 space-y-1 text-sm text-[#6b7280]">
                      <p>
                        {assignment.problem_count}{" "}
                        {assignment.problem_count === 1 ? "problemă" : "probleme"}
                      </p>
                      <p className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                        {formatDeadline(assignment.deadline)}
                      </p>
                      {assignment.created_at ? (
                        <p className="text-xs text-[#9ca3af]">Creată {formatCreatedAt(assignment.created_at)}</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <TeacherNewAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        classrooms={teacherClassrooms}
      />
    </>
  )
}
