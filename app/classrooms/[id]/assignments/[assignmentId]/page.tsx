import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentAssignmentProblems } from "@/components/classrooms/student-assignment-problems"
import { StudentAnalyticsTable } from "@/components/classrooms/student-analytics-table"
import {
  getAssignmentDetails,
  getAssignmentSubmissions,
  getClassroomDetailsForUser,
  getClassroomMembers,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

const errorMessages: Record<string, string> = {
  invalid_submission: "Please select an answer before submitting.",
  students_only: "Only students can submit answers.",
  submission_failed: "Could not save your answer.",
  solve_in_catalog_first: "Open the problem in the catalog, solve it there, then sync it here.",
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

  return (
    <div className="space-y-4">
      <Card className="border-[#eceff3] bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{assignment.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#4b5563]">
          {assignment.description ? <p>{assignment.description}</p> : null}
          <p>
            Deadline: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : "No deadline"}
          </p>
          <p>{assignment.problems.length} problems</p>
        </CardContent>
      </Card>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {showSaved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Answer saved successfully.
        </div>
      ) : null}

      {classroom.role === "teacher" ? (
        <StudentAnalyticsTable rows={teacherRows} problemStats={problemStats} />
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
