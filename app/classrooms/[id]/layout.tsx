import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { getClassroomDetailsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"

const ClassroomAssignmentFab = dynamic(
  () => import("@/components/classrooms/classroom-assignment-fab").then((module) => module.ClassroomAssignmentFab),
)

const ClassroomDetailHeader = dynamic(
  () => import("@/components/classrooms/classroom-detail-header").then((module) => module.ClassroomDetailHeader),
)

const ClassroomTabsNav = dynamic(
  () => import("@/components/classrooms/classroom-tabs-nav").then((module) => module.ClassroomTabsNav),
)

export default async function ClassroomDetailLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const { id } = await params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom) {
    redirect("/classrooms")
  }

  return (
    <div className="space-y-6">
      <ClassroomTabsNav classroomId={classroom.id} />

      <ClassroomDetailHeader
        classroomId={classroom.id}
        classroomName={classroom.name}
        joinCode={classroom.join_code}
        coverImage={classroom.cover_image}
      />

      <div className="min-h-[220px]">{children}</div>

      {classroom.role === "teacher" ? <ClassroomAssignmentFab classroomId={id} /> : null}
    </div>
  )
}
