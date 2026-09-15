import { redirect } from "next/navigation"
import { ClassroomSettingsForm } from "@/components/classrooms/classroom-settings-form"
import { listClassroomCoverFilenames } from "@/lib/classrooms/cover-images"
import { getClassroomDetailsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"
import { getSchoolsForUser } from "@/lib/classrooms/extra-server"

export default async function ClassroomSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) redirect("/")
  const { id } = await params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom) redirect("/classrooms")
  if (classroom.role !== "teacher") redirect(`/classrooms/${id}`)

  const [covers, schools, query] = await Promise.all([
    listClassroomCoverFilenames(),
    getSchoolsForUser(user.id),
    searchParams,
  ])

  return (
    <ClassroomSettingsForm
      classroom={classroom}
      isOwner={classroom.teacher_id === user.id}
      coverFilenames={covers}
      schools={schools}
      saved={query.saved === "1"}
      errorMessage={
        query.error === "name_required"
          ? "Numele clasei este obligatoriu."
          : query.error === "owner_only"
            ? "Doar titularul clasei poate face această acțiune."
            : query.error === "update_failed"
              ? "Nu am putut salva setările."
              : undefined
      }
    />
  )
}
