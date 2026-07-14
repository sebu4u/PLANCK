import type { Metadata } from "next"
import { TeacherAssignmentsPage } from "@/components/profesor/teacher-assignments-page"
import { getClassroomsForUser } from "@/lib/classrooms/server"
import { requireTeacherUser } from "@/lib/teacher/require-teacher"
import { getTeacherAssignmentsOverview } from "@/lib/teacher/server"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Teme profesor"),
  description: "Toate temele pe care le-ai dat la clasele tale.",
}

export const dynamic = "force-dynamic"

export default async function ProfesorTemePage() {
  const { user } = await requireTeacherUser()
  const [assignments, classrooms] = await Promise.all([
    getTeacherAssignmentsOverview(user.id),
    getClassroomsForUser(user.id),
  ])

  return <TeacherAssignmentsPage assignments={assignments} classrooms={classrooms} />
}
