import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { getClassroomDetailsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"

const ClassroomAssignmentFab = dynamic(
  () => import("@/components/classrooms/classroom-assignment-fab").then((module) => module.ClassroomAssignmentFab),
)

const ClassroomDetailHeader = dynamic(
  () => import("@/components/classrooms/classroom-detail-header").then((module) => module.ClassroomDetailHeader),
  {
    loading: () => (
      <div className="overflow-hidden rounded-xl border border-[#d2e3fc] bg-white p-6">
        <div className="h-8 w-64 animate-pulse rounded-md bg-[#e5e7eb]" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded-md bg-[#e5e7eb]" />
        <div className="mt-6 h-24 w-full animate-pulse rounded-xl bg-[#e5e7eb]" />
      </div>
    ),
  },
)

const ClassroomTabsNav = dynamic(
  () => import("@/components/classrooms/classroom-tabs-nav").then((module) => module.ClassroomTabsNav),
  {
    loading: () => (
      <div className="flex items-center gap-3 border-b border-[#dadce0] pb-3">
        <div className="h-5 w-20 animate-pulse rounded-md bg-[#e5e7eb]" />
        <div className="h-5 w-24 animate-pulse rounded-md bg-[#e5e7eb]" />
        <div className="h-5 w-16 animate-pulse rounded-md bg-[#e5e7eb]" />
      </div>
    ),
  },
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
