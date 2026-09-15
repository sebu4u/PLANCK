import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { getClassroomDetailsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"
import { getActiveClassroomSession } from "@/lib/classrooms/extra-server"
import { ClassroomLiveBanner } from "@/components/classrooms/classroom-live-banner"

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

  const activeSession = await getActiveClassroomSession(id)

  return (
    <div className="space-y-6">
      <ClassroomTabsNav classroomId={classroom.id} isTeacher={classroom.role === "teacher"} />

      <ClassroomDetailHeader
        classroomId={classroom.id}
        classroomName={classroom.name}
        joinCode={classroom.join_code}
        coverImage={classroom.cover_image}
        isTeacher={classroom.role === "teacher"}
        subject={classroom.subject}
        gradeLevel={classroom.grade_level}
        section={classroom.section}
        archived={Boolean(classroom.archived_at)}
      />

      {activeSession ? (
        <ClassroomLiveBanner
          classroomId={id}
          sessionId={activeSession.id}
          isTeacher={classroom.role === "teacher"}
          assignmentId={activeSession.assignment_id}
          exitTicketId={activeSession.exit_ticket_assignment_id}
        />
      ) : null}

      <div className="min-h-[220px]">{children}</div>

      {classroom.role === "teacher" && !classroom.archived_at ? <ClassroomAssignmentFab classroomId={id} /> : null}
    </div>
  )
}
