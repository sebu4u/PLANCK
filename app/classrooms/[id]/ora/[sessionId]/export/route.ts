import { NextResponse } from "next/server"
import { getSessionAttendance } from "@/lib/classrooms/extra-server"
import { getClassroomDetailsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"
import { ATTENDANCE_STATUS_LABELS } from "@/lib/classrooms/constants"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; sessionId: string }> },
) {
  const { user } = await requireAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, sessionId } = await context.params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom || classroom.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rows = await getSessionAttendance(id, sessionId)
  const lines = [
    "Nume,Status,Marcat la",
    ...rows.map((row) => `${csv(row.student_name)},${ATTENDANCE_STATUS_LABELS[row.status]},${csv(row.marked_at ?? "")}`),
  ]

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prezenta-${sessionId}.csv"`,
    },
  })
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) return `"${value.replaceAll('"', '""')}"`
  return value
}
