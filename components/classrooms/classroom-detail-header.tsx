"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Play } from "lucide-react"
import { useClassroomAssignmentDraft } from "@/components/classrooms/classroom-assignment-draft-context"
import { formatClassroomMeta } from "@/lib/classrooms/constants"
import { cn } from "@/lib/utils"

interface ClassroomDetailHeaderProps {
  classroomId: string
  classroomName: string
  joinCode: string
  coverImage: string | null
  isTeacher?: boolean
  subject?: string | null
  gradeLevel?: string | null
  section?: string | null
  archived?: boolean
}

export function ClassroomDetailHeader({
  classroomId,
  classroomName,
  joinCode,
  coverImage,
  isTeacher = false,
  subject = null,
  gradeLevel = null,
  section = null,
  archived = false,
}: ClassroomDetailHeaderProps) {
  const pathname = usePathname()
  const { isPickingForClassroom } = useClassroomAssignmentDraft()
  const hideOnDesktop = isPickingForClassroom(classroomId)

  const hideForAssignmentsArea =
    pathname === `/classrooms/${classroomId}/assignments` ||
    pathname?.startsWith(`/classrooms/${classroomId}/assignments/`) ||
    pathname?.startsWith(`/classrooms/${classroomId}/ora`)

  if (hideForAssignmentsArea) {
    return null
  }

  const meta = formatClassroomMeta({ grade_level: gradeLevel, section, subject })

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#d2e3fc]", hideOnDesktop && "lg:hidden")}>
      <div
        className="relative min-h-[180px] px-6 py-6 text-white md:min-h-[220px] md:px-8 md:py-8"
        style={{
          backgroundImage: coverImage
            ? `linear-gradient(0deg, rgba(32, 33, 36, 0.12), rgba(32, 33, 36, 0.12)), url(${coverImage})`
            : "linear-gradient(135deg, #34a853, #0f9d58 55%, #1a73e8)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-black/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            {archived ? (
              <span className="mb-2 inline-flex rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-medium">
                Arhivată
              </span>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight">{classroomName}</h1>
            {meta ? <p className="mt-1 text-sm font-medium text-white/90">{meta}</p> : null}
            <p className="mt-1 text-sm font-medium text-white/90">Cod de intrare: {joinCode}</p>
          </div>
          {isTeacher && !archived ? (
            <Link
              href={`/classrooms/${classroomId}/ora`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1557b0] shadow-sm hover:bg-[#eef4ff]"
            >
              <Play className="h-4 w-4" aria-hidden />
              Pornește ora
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
