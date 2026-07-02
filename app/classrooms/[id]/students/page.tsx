import { redirect } from "next/navigation"
import { ClassroomStudentsList } from "@/components/classrooms/classroom-students-list"
import {
  getClassroomDetailsForUser,
  getClassroomMembers,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"
import type { ClassroomMemberOverview } from "@/lib/classrooms/types"
import { getTeacherStudentProfilesForClassroom } from "@/lib/teacher/server"

export default async function ClassroomStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const { id: classroomId } = await params
  const classroom = await getClassroomDetailsForUser(classroomId, user.id)
  if (!classroom) {
    redirect("/classrooms")
  }

  const members = await getClassroomMembers(classroomId)

  const people: ClassroomMemberOverview[] = [...members].sort((a, b) => {
    if (b.elo !== a.elo) {
      return b.elo - a.elo
    }
    return a.name.localeCompare(b.name, "ro")
  })

  const studentProfiles =
    classroom.role === "teacher"
      ? await getTeacherStudentProfilesForClassroom(user.id, classroomId)
      : []

  return (
    <ClassroomStudentsList
      classroomId={classroomId}
      joinCode={classroom.join_code}
      isTeacher={classroom.role === "teacher"}
      members={people}
      studentProfiles={studentProfiles}
    />
  )
}
