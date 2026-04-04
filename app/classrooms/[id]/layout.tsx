import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { ClassroomAssignmentFab } from "@/components/classrooms/classroom-assignment-fab"
import { ClassroomTabsNav } from "@/components/classrooms/classroom-tabs-nav"
import { getClassroomDetailsForUser, getProblemPool, requireAuthenticatedUser } from "@/lib/classrooms/server"

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

  const problems = classroom.role === "teacher" ? await getProblemPool() : []

  const coverImage = classroom.cover_image

  return (
    <div className="space-y-6">
      <ClassroomTabsNav classroomId={classroom.id} />

      <div className="overflow-hidden rounded-xl border border-[#d2e3fc]">
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
            <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
            <p className="mt-1 text-sm font-medium text-white/90">Join code: {classroom.join_code}</p>
          </div>
        </div>
      </div>

      {children}

      {classroom.role === "teacher" ? <ClassroomAssignmentFab classroomId={id} problems={problems} /> : null}
    </div>
  )
}
