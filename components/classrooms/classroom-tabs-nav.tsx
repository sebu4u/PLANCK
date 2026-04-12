"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClassroomAssignmentDraft } from "@/components/classrooms/classroom-assignment-draft-context"
import { cn } from "@/lib/utils"

interface ClassroomTabsNavProps {
  classroomId: string
}

export function ClassroomTabsNav({ classroomId }: ClassroomTabsNavProps) {
  const pathname = usePathname()
  const { isPickingForClassroom } = useClassroomAssignmentDraft()

  if (isPickingForClassroom(classroomId)) {
    return null
  }

  const tabs = [
    { href: `/classrooms/${classroomId}`, label: "Flux" },
    { href: `/classrooms/${classroomId}/assignments`, label: "Teme" },
    { href: `/classrooms/${classroomId}/students`, label: "Persoane" },
  ]

  return (
    <div className="flex items-center gap-2 border-b border-[#dadce0]">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href.includes("/assignments") && pathname?.startsWith(`${tab.href}/`))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative -mb-px px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-[#1a73e8] text-[#1a73e8]"
                : "border-b-2 border-transparent text-[#5f6368] hover:text-[#202124]"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
