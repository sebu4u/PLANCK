import { redirect } from "next/navigation"
import { ClassroomProjector } from "@/components/classrooms/classroom-projector"
import { ClassroomRealtimeRefresh } from "@/components/classrooms/classroom-realtime-refresh"
import { getActiveClassroomSession } from "@/lib/classrooms/extra-server"
import {
  getAssignmentDetails,
  getClassroomDetailsForUser,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

export default async function ClassroomProjectorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) redirect("/")
  const { id } = await params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom || classroom.role !== "teacher") redirect(`/classrooms/${id}`)

  const session = await getActiveClassroomSession(id)
  if (!session) redirect(`/classrooms/${id}/ora`)

  const liveAssignmentId = session.assignment_id ?? session.exit_ticket_assignment_id
  const assignment = liveAssignmentId ? await getAssignmentDetails(id, liveAssignmentId) : null
  const problem =
    assignment?.problems.find((item) => item.id === session.current_problem_id) ?? assignment?.problems[0] ?? null

  return (
    <>
      <ClassroomRealtimeRefresh classroomId={id} assignmentId={liveAssignmentId} />
      <ClassroomProjector
        classroomName={classroom.name}
        joinCode={classroom.join_code}
        problem={problem}
      />
    </>
  )
}
