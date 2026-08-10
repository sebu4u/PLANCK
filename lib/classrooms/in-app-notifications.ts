import "server-only"

import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

type ClassroomNotificationType = "classroom_assignment" | "classroom_announcement"

export async function notifyClassroomStudents(input: {
  classroomId: string
  type: ClassroomNotificationType
  title: string
  body: string
  href: string
  assignmentId?: string
  announcementId?: string
}): Promise<{ ok: true; sent: number } | { ok: false; message: string }> {
  const supabase = getServiceRoleSupabase()

  const { data: members, error: membersError } = await supabase
    .from("classroom_members")
    .select("user_id")
    .eq("classroom_id", input.classroomId)
    .eq("role", "student")

  if (membersError) {
    return { ok: false, message: membersError.message }
  }

  const studentIds = (members ?? [])
    .map((row) => row.user_id as string)
    .filter(Boolean)

  if (studentIds.length === 0) {
    return { ok: true, sent: 0 }
  }

  const now = new Date().toISOString()
  const rows = studentIds.map((userId) => ({
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    classroom_id: input.classroomId,
    assignment_id: input.assignmentId ?? null,
    announcement_id: input.announcementId ?? null,
    read_at: null,
    created_at: now,
  }))

  const { error } = await supabase.from("user_in_app_notifications").insert(rows)
  if (error) {
    // Unique conflict is fine if the same tema/material was notified already.
    if (error.code === "23505") {
      return { ok: true, sent: 0 }
    }
    logger.error("[classrooms/in-app] notify failed:", error.message)
    return { ok: false, message: error.message }
  }

  return { ok: true, sent: rows.length }
}

export function classroomAnnouncementNotificationCopy(input: {
  type: "text" | "image" | "file" | "lesson"
  content: string | null
  classroomName: string
}): { title: string; body: string } {
  const classroomName = input.classroomName.trim() || "clasă"
  if (input.type === "text") {
    const snippet = (input.content ?? "").trim()
    return {
      title: "Anunț nou",
      body: snippet
        ? `${snippet.slice(0, 120)}${snippet.length > 120 ? "…" : ""} · ${classroomName}`
        : `Anunț nou în ${classroomName}`,
    }
  }

  const materialLabel =
    input.type === "image"
      ? "Imagine nouă"
      : input.type === "lesson"
        ? "Lecție partajată"
        : "Fișier nou"

  return {
    title: "Material nou",
    body: `${materialLabel} · ${classroomName}`,
  }
}
