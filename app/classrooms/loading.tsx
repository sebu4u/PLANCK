"use client"

import { usePathname } from "next/navigation"
import {
  ClassroomDetailSkeleton,
  ClassroomJoinSkeleton,
  ClassroomNewSkeleton,
  ClassroomsPageSkeleton,
} from "@/components/classrooms/classroom-skeletons"

function normalizePath(p: string | null) {
  if (!p) return ""
  return p.replace(/\/$/, "") || "/"
}

export default function ClassroomsLoading() {
  const pathname = usePathname()
  const path = normalizePath(pathname)

  if (path === "/classrooms/new") {
    return <ClassroomNewSkeleton />
  }
  if (path === "/classrooms/join") {
    return <ClassroomJoinSkeleton />
  }

  const classMatch = pathname?.match(/^\/classrooms\/([^/]+)/)
  const segment = classMatch?.[1]
  const isClassroomDetail = Boolean(segment && segment !== "new" && segment !== "join")

  if (isClassroomDetail) {
    return <ClassroomDetailSkeleton />
  }

  return <ClassroomsPageSkeleton />
}
