"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Radio } from "lucide-react"
import { markStudentPresentOnOpenAction } from "@/app/classrooms/teacher-actions"

interface ClassroomLiveBannerProps {
  classroomId: string
  sessionId: string
  isTeacher: boolean
  assignmentId: string | null
  exitTicketId: string | null
}

export function ClassroomLiveBanner({
  classroomId,
  sessionId,
  isTeacher,
  assignmentId,
  exitTicketId,
}: ClassroomLiveBannerProps) {
  useEffect(() => {
    if (isTeacher) return
    const form = new FormData()
    form.set("classroom_id", classroomId)
    form.set("session_id", sessionId)
    void markStudentPresentOnOpenAction(form)
  }, [classroomId, isTeacher, sessionId])

  const href = isTeacher
    ? `/classrooms/${classroomId}/ora`
    : exitTicketId
      ? `/classrooms/${classroomId}/assignments/${exitTicketId}`
      : assignmentId
        ? `/classrooms/${classroomId}/assignments/${assignmentId}`
        : `/classrooms/${classroomId}/ora`

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <Radio className="h-4 w-4 animate-pulse" aria-hidden />
        {isTeacher ? "Ora este în desfășurare — deschide tabloul live" : "Ora a început. Intră în activitate."}
      </span>
      <span className="font-semibold">Deschide</span>
    </Link>
  )
}
