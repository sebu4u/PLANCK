import type { Metadata } from "next"
import { requireTeacherUser } from "@/lib/teacher/require-teacher"
import { getSchoolsForUser, getSchoolMembers } from "@/lib/classrooms/extra-server"
import { SchoolHub } from "@/components/profesor/school-hub"
import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Școala mea"),
}

export const dynamic = "force-dynamic"

export default async function ProfesorScoalaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const { user } = await requireTeacherUser()
  const schools = await getSchoolsForUser(user.id)
  const members = schools[0] ? await getSchoolMembers(schools[0].id) : []
  const query = await searchParams

  return (
    <SchoolHub
      schools={schools}
      members={members}
      saved={query.saved === "1"}
      errorMessage={
        query.error === "name_required"
          ? "Numele școlii este obligatoriu."
          : query.error === "user_not_found"
            ? "Nu am găsit un profesor cu acest e-mail."
            : query.error === "admin_only"
              ? "Doar administratorul școlii poate invita."
              : query.error === "invalid_email"
                ? "E-mail invalid."
                : undefined
      }
    />
  )
}
