"use client"

import { usePathname } from "next/navigation"
import { useClassroomAssignmentDraft } from "@/components/classrooms/classroom-assignment-draft-context"
import { cn } from "@/lib/utils"

interface ClassroomDetailHeaderProps {
  classroomId: string
  classroomName: string
  joinCode: string
  coverImage: string | null
}

export function ClassroomDetailHeader({
  classroomId,
  classroomName,
  joinCode,
  coverImage,
}: ClassroomDetailHeaderProps) {
  const pathname = usePathname()
  const { isPickingForClassroom } = useClassroomAssignmentDraft()
  const hideOnDesktop = isPickingForClassroom(classroomId)

  const hideForAssignmentsArea =
    pathname === `/classrooms/${classroomId}/assignments` ||
    pathname?.startsWith(`/classrooms/${classroomId}/assignments/`)

  if (hideForAssignmentsArea) {
    return null
  }

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
        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight">{classroomName}</h1>
          <p className="mt-1 text-sm font-medium text-white/90">Cod de intrare: {joinCode}</p>
        </div>
      </div>
    </div>
  )
}
