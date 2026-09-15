import { NextResponse } from "next/server"
import {
  getAssignmentDetails,
  getAssignmentSubmissions,
  getClassroomDetailsForUser,
  getClassroomMembers,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; assignmentId: string }> },
) {
  const { user } = await requireAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, assignmentId } = await context.params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom || classroom.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const assignment = await getAssignmentDetails(id, assignmentId)
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [members, submissions] = await Promise.all([
    getClassroomMembers(id),
    getAssignmentSubmissions(id, assignmentId),
  ])
  const students = members.filter((member) => member.role === "student")

  const header = ["Nume", "Email", ...assignment.problems.map((problem, index) => `P${index + 1}`), "Corecte", "Notă", "Ultima trimitere"]
  const lines = [header.join(",")]

  for (const student of students.sort((a, b) => a.name.localeCompare(b.name, "ro"))) {
    const rows = submissions.filter((entry) => entry.student_id === student.user_id)
    const cells = assignment.problems.map((problem) => {
      const row = rows.find((entry) => entry.problem_id === problem.id)
      if (!row) return ""
      return row.is_correct ? "corect" : "gresit"
    })
    const grade = rows.find((row) => row.teacher_grade != null)?.teacher_grade ?? ""
    const submittedAt = rows.map((row) => row.submitted_at).sort().at(-1) ?? ""
    const correct = rows.filter((row) => row.is_correct).length
    lines.push(
      [csv(student.name), csv(student.email), ...cells.map(csv), String(correct), String(grade), csv(submittedAt)].join(","),
    )
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tema-${assignmentId}.csv"`,
    },
  })
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}
