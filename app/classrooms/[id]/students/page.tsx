import { redirect } from "next/navigation"
import { ClassroomStudentsList } from "@/components/classrooms/classroom-students-list"
import {
  getClassroomDetailsForUser,
  getClassroomMembers,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"
import { getClassroomInvites, getClassroomParentMessages } from "@/lib/classrooms/extra-server"
import type { ClassroomMemberOverview } from "@/lib/classrooms/types"
import { getTeacherStudentProfilesForClassroom } from "@/lib/teacher/server"

export default async function ClassroomStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; invited?: string; imported?: string; message_sent?: string }>
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
    if (a.role !== b.role) return a.role === "teacher" ? -1 : 1
    return a.name.localeCompare(b.name, "ro")
  })

  const isTeacher = classroom.role === "teacher"
  const studentProfiles = isTeacher ? await getTeacherStudentProfilesForClassroom(user.id, classroomId) : []
  const invites = isTeacher ? await getClassroomInvites(classroomId) : []
  const parentMessages = isTeacher ? await getClassroomParentMessages(classroomId) : []
  const query = await searchParams

  return (
    <ClassroomStudentsList
      classroomId={classroomId}
      joinCode={classroom.join_code}
      isTeacher={isTeacher}
      isOwner={classroom.teacher_id === user.id}
      joinLocked={classroom.join_locked}
      members={people}
      studentProfiles={studentProfiles}
      invites={invites}
      parentMessages={parentMessages}
      notice={
        query.invited
          ? "Invitația a fost salvată."
          : query.imported
            ? `Import finalizat (${query.imported} rânduri).`
            : query.message_sent
              ? "Mesajul a fost trimis părinților."
              : query.error === "invalid_email"
                ? "Adresa de e-mail nu este validă."
                : query.error === "not_a_teacher"
                  ? "Contul găsit nu este de profesor."
                  : query.error === "csv_required"
                    ? "Lipește lista CSV înainte de import."
                    : query.error === "message_required"
                      ? "Scrie un mesaj pentru părinți."
                      : undefined
      }
    />
  )
}
