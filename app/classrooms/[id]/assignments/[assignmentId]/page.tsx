import { redirect } from "next/navigation"
import { StudentAssignmentProblems } from "@/components/classrooms/student-assignment-problems"
import { StudentAnalyticsTable } from "@/components/classrooms/student-analytics-table"
import { TeacherAssignmentAttachmentsSection } from "@/components/classrooms/teacher-assignment-attachments"
import {
  getAssignmentDetails,
  getAssignmentSubmissions,
  getClassroomDetailsForUser,
  getClassroomMembers,
  getTeacherAssignmentAttachmentGroups,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

const errorMessages: Record<string, string> = {
  invalid_submission: "Selectează un răspuns înainte de trimitere.",
  students_only: "Doar elevii pot trimite răspunsuri.",
  submission_failed: "Nu am putut salva răspunsul.",
  solve_in_catalog_first: "Deschide problema în catalog, rezolv-o acolo, apoi sincronizeaz-o aici.",
  teacher_photos_too_many: "Poți atașa cel mult 5 imagini pentru profesor.",
  teacher_photos_too_large: "Fiecare imagine trebuie să aibă cel mult 5 MB.",
  teacher_photos_bad_type: "Sunt acceptate doar imagini JPG, PNG, WebP sau GIF.",
  teacher_photos_upload_failed: "Răspunsul a fost salvat, dar pozele nu s-au încărcat. Încearcă din nou.",
}

export default async function AssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assignmentId: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const { id: classroomId, assignmentId } = await params
  const classroom = await getClassroomDetailsForUser(classroomId, user.id)
  if (!classroom) {
    redirect("/classrooms")
  }

  const assignment = await getAssignmentDetails(classroomId, assignmentId)
  if (!assignment) {
    redirect(`/classrooms/${classroomId}/assignments`)
  }

  const [submissions, members, query] = await Promise.all([
    getAssignmentSubmissions(classroomId, assignmentId),
    classroom.role === "teacher" ? getClassroomMembers(classroomId) : Promise.resolve([]),
    searchParams,
  ])

  const teacherAttachmentGroups =
    classroom.role === "teacher"
      ? await getTeacherAssignmentAttachmentGroups(classroomId, assignmentId, assignment.problems, members)
      : []

  const errorMessage = query.error ? errorMessages[query.error] : undefined
  const showSaved = query.saved === "1"

  const totalProblems = assignment.problems.length

  const teacherRows =
    classroom.role === "teacher"
      ? members
          .filter((member) => member.role === "student")
          .map((student) => {
            const studentSubmissions = submissions.filter((entry) => entry.student_id === student.user_id)
            const correct = studentSubmissions.filter((entry) => entry.is_correct).length
            const score = totalProblems > 0 ? Math.round((correct / totalProblems) * 100) : 0
            return {
              user_id: student.user_id,
              name: student.name,
              email: student.email,
              correct,
              total: totalProblems,
              score,
            }
          })
      : []

  const problemStats =
    classroom.role === "teacher"
      ? assignment.problems.map((problem) => {
          const problemSubmissions = submissions.filter((entry) => entry.problem_id === problem.id)
          const correct = problemSubmissions.filter((entry) => entry.is_correct).length
          const studentCount = members.filter((member) => member.role === "student").length
          const correctRate = studentCount > 0 ? Math.round((correct / studentCount) * 100) : 0
          return {
            problem_id: problem.id,
            title: problem.title,
            correctRate,
          }
        })
      : []

  const studentSubmissions = submissions.filter((entry) => entry.student_id === user.id)

  const deadlineText = assignment.deadline
    ? new Date(assignment.deadline).toLocaleString("ro-RO", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Fără termen limită"

  const problemCount = assignment.problems.length
  const problemCountLabel = `${problemCount} ${problemCount === 1 ? "problemă" : "probleme"}`

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-3xl lg:text-4xl">
            {assignment.title}
          </h1>
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6b7280]">
            <span className="whitespace-nowrap">Termen limită: {deadlineText}</span>
            <span className="whitespace-nowrap">{problemCountLabel}</span>
          </div>
        </div>
        {assignment.description ? (
          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-[#4b5563]">
            {assignment.description}
          </p>
        ) : null}
      </header>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {showSaved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Răspunsul a fost salvat.
        </div>
      ) : null}

      {classroom.role === "teacher" ? (
        <>
          <TeacherAssignmentAttachmentsSection groups={teacherAttachmentGroups} />
          <StudentAnalyticsTable rows={teacherRows} problemStats={problemStats} />
        </>
      ) : (
        <StudentAssignmentProblems
          classroomId={classroomId}
          assignmentId={assignmentId}
          problems={assignment.problems}
          submissions={studentSubmissions}
        />
      )}
    </div>
  )
}
