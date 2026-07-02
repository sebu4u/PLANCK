"use client"

import { useMemo, useState } from "react"
import { CalendarDays, NotebookPen, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import type { ParentChildAssignmentItem } from "@/lib/parent/server"

interface ParentAssignmentsPageProps {
  assignments: ParentChildAssignmentItem[]
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

function statusLabel(status: ParentChildAssignmentItem["status"]) {
  switch (status) {
    case "completed":
      return "Finalizată"
    case "in_progress":
      return "În lucru"
    default:
      return "Nefăcută"
  }
}

function statusBadgeClass(status: ParentChildAssignmentItem["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
  }
}

export function ParentAssignmentsPage({ assignments }: ParentAssignmentsPageProps) {
  const children = useMemo(() => {
    const unique = new Map<string, string>()
    for (const assignment of assignments) {
      unique.set(assignment.child_id, assignment.child_name)
    }
    return [...unique.entries()].map(([childId, childName]) => ({ childId, childName }))
  }, [assignments])

  const [selectedChildId, setSelectedChildId] = useState<string | "all">("all")

  const filteredAssignments = useMemo(() => {
    if (selectedChildId === "all") return assignments
    return assignments.filter((assignment) => assignment.child_id === selectedChildId)
  }, [assignments, selectedChildId])

  const showChildTabs = children.length > 1

  return (
    <div
      className={cn(
        "min-h-[100dvh] bg-[#f8f9fa] pt-16",
        MOBILE_BOTTOM_NAV_PADDING_CLASS,
        "burger:pb-12",
      )}
    >
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#111827]">Teme</h1>
          <p className="text-sm text-[#6b7280] sm:text-base">
            Toate temele copiilor tăi — finalizate și cele care încă așteaptă.
          </p>
        </div>

        {showChildTabs ? (
          <Tabs
            value={selectedChildId}
            onValueChange={setSelectedChildId}
            className="mt-6 w-full"
          >
            <TabsList className="inline-flex h-auto w-full max-w-full flex-wrap justify-start gap-1 rounded-full bg-[#eef2f7] p-1">
              <TabsTrigger
                value="all"
                className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
              >
                Toți copiii
              </TabsTrigger>
              {children.map((child) => (
                <TabsTrigger
                  key={child.childId}
                  value={child.childId}
                  className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
                >
                  {child.childName}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}

        {assignments.length === 0 ? (
          <Card className="mt-8 border-[#e5e7eb] bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <Users className="h-10 w-10 text-[#9ca3af]" aria-hidden />
              <h2 className="text-lg font-semibold text-[#111827]">Nicio temă încă</h2>
              <p className="max-w-md text-sm text-[#6b7280]">
                Când copiii tăi primesc teme de la profesor, le vei vedea aici.
              </p>
            </CardContent>
          </Card>
        ) : filteredAssignments.length === 0 ? (
          <Card className="mt-8 border-[#e5e7eb] bg-white shadow-sm">
            <CardContent className="py-10 text-center text-sm text-[#6b7280]">
              Niciun rezultat pentru filtrul selectat.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-3">
            {filteredAssignments.map((assignment) => {
              const isOverdue =
                assignment.deadline &&
                assignment.status !== "completed" &&
                new Date(assignment.deadline).getTime() < Date.now()

              return (
                <div
                  key={`${assignment.child_id}-${assignment.assignment_id}`}
                  className={cn(
                    "rounded-2xl border bg-white p-4 shadow-sm md:p-5",
                    isOverdue ? "border-rose-200 bg-rose-50/40" : "border-[#e8eaed]",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6366f1]">
                          {assignment.classroom_name}
                        </p>
                        {showChildTabs && selectedChildId === "all" ? (
                          <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                            {assignment.child_name}
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="text-lg font-semibold text-[#111827]">{assignment.title}</h2>
                      {assignment.description ? (
                        <p className="line-clamp-2 text-sm text-[#6b7280]">{assignment.description}</p>
                      ) : null}
                    </div>

                    <Badge
                      variant="outline"
                      className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", statusBadgeClass(assignment.status))}
                    >
                      {statusLabel(assignment.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f0f2f5] pt-4 text-sm text-[#6b7280]">
                    <span>
                      {assignment.submitted_count}/{assignment.problem_count}{" "}
                      {assignment.problem_count === 1 ? "problemă" : "probleme"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                      {formatDeadline(assignment.deadline)}
                    </span>
                    {assignment.created_at ? (
                      <span className="text-xs text-[#9ca3af]">
                        Primită {formatCreatedAt(assignment.created_at)}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {assignments.length > 0 ? (
          <div className="mt-6 flex items-center gap-2 text-xs text-[#9ca3af]">
            <NotebookPen className="h-4 w-4 shrink-0" aria-hidden />
            Temele sunt rezolvate de copil în contul lui de elev.
          </div>
        ) : null}
      </div>
    </div>
  )
}
