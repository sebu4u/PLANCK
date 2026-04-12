import { redirect } from "next/navigation"
import { AssignmentStreamPost } from "@/components/classrooms/assignment-stream-post"
import {
  getClassroomAssignments,
  getClassroomDetailsForUser,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

/** Error query keys from assignment create redirect (teacher flow via FAB / API). */
const errorMessages: Record<string, string> = {
  title_and_problems_required: "Adaugă un titlu și selectează cel puțin o problemă.",
  assignment_create_failed: "Nu am putut crea tema.",
  assignment_problem_link_failed: "Tema a fost creată, dar problemele nu au putut fi legate.",
  teacher_only: "Doar profesorul clasei poate crea teme.",
}

export default async function ClassroomAssignmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; reason?: string }>
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

  const [assignments, query] = await Promise.all([getClassroomAssignments(id), searchParams])

  const errorMessage = query.error
    ? (errorMessages[query.error] ?? query.error) + (query.reason ? ` (${query.reason})` : "")
    : undefined

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white p-8 text-center text-sm text-[#6b7280]">
            Încă nu există teme.
          </div>
        ) : (
          assignments.map((assignment) => (
            <AssignmentStreamPost key={assignment.id} classroomId={id} assignment={assignment} />
          ))
        )}
      </div>
    </div>
  )
}
