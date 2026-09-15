import { redirect } from "next/navigation"
import { ClassroomLiveBoard } from "@/components/classrooms/classroom-live-board"
import {
  getActiveClassroomSession,
  getRecentClassroomSessions,
  getSessionAttendance,
} from "@/lib/classrooms/extra-server"
import {
  getAssignmentDetails,
  getAssignmentSubmissions,
  getClassroomAssignments,
  getClassroomDetailsForUser,
  getClassroomMembers,
  getProblemPool,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

export default async function ClassroomOraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) redirect("/")
  const { id } = await params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom) redirect("/classrooms")
  if (classroom.role !== "teacher") redirect(`/classrooms/${id}`)

  const [session, recent, assignments, members, pool] = await Promise.all([
    getActiveClassroomSession(id),
    getRecentClassroomSessions(id),
    getClassroomAssignments(id),
    getClassroomMembers(id),
    getProblemPool(),
  ])

  const attendance = session ? await getSessionAttendance(id, session.id) : []
  const liveAssignmentId = session?.assignment_id ?? session?.exit_ticket_assignment_id
  const liveAssignment = liveAssignmentId ? await getAssignmentDetails(id, liveAssignmentId) : null
  const liveSubmissions = liveAssignmentId ? await getAssignmentSubmissions(id, liveAssignmentId) : []

  return (
    <ClassroomLiveBoard
      classroomId={id}
      joinCode={classroom.join_code}
      session={session}
      recentSessions={recent}
      assignments={assignments.filter((item) => item.status === "published")}
      attendance={attendance}
      members={members}
      problems={pool.slice(0, 40)}
      liveAssignment={liveAssignment}
      liveSubmissions={liveSubmissions}
    />
  )
}
