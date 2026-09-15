import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { notifyClassroomStudents } from "@/lib/classrooms/in-app-notifications"

export const runtime = "nodejs"
export const maxDuration = 60

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()

  const { data: dueSoon } = await admin
    .from("assignments")
    .select("id, classroom_id, title, deadline")
    .eq("status", "published")
    .is("reminder_sent_at", null)
    .gt("deadline", nowIso)
    .lte("deadline", in24h)

  let reminded = 0
  for (const row of dueSoon ?? []) {
    try {
      await notifyClassroomStudents({
        classroomId: row.classroom_id,
        type: "classroom_assignment_reminder",
        title: "Termen mâine",
        body: row.title ?? "Ai o temă cu termen aproape.",
        href: `/classrooms/${row.classroom_id}/assignments/${row.id}`,
        assignmentId: row.id,
      })
      await admin.from("assignments").update({ reminder_sent_at: nowIso }).eq("id", row.id)
      reminded += 1
    } catch (error) {
      console.error("[cron/classroom-reminders] assignment", row.id, error)
    }
  }

  return NextResponse.json({ ok: true, reminded })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
