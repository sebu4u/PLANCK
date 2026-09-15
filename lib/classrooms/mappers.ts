import type { ClassroomDetails, ClassroomRole } from "@/lib/classrooms/types"

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

export const CLASSROOM_ROW_COLUMNS =
  "id, name, join_code, teacher_id, created_at, cover_image, archived_at, join_locked, subject, grade_level, section, school_year, school_id"

export const ASSIGNMENT_ROW_COLUMNS =
  "id, classroom_id, title, description, deadline, created_at, status, kind, late_policy, window_start, window_end, time_limit_minutes, shuffle_options, allow_catalog_sync, source_assignment_id"

export function mapClassroomCore(
  raw: Record<string, unknown>,
  coverSrc: string | null,
): Omit<ClassroomDetails, "role"> {
  return {
    id: asString(raw.id),
    name: asString(raw.name, "Clasă"),
    join_code: asString(raw.join_code),
    teacher_id: asString(raw.teacher_id),
    created_at: asString(raw.created_at),
    cover_image: coverSrc,
    archived_at: asNullableString(raw.archived_at),
    join_locked: Boolean(raw.join_locked),
    subject: asNullableString(raw.subject),
    grade_level: asNullableString(raw.grade_level),
    section: asNullableString(raw.section),
    school_year: asNullableString(raw.school_year),
    school_id: asNullableString(raw.school_id),
  }
}

export function asClassroomRole(value: unknown): ClassroomRole {
  return asString(value) === "teacher" ? "teacher" : "student"
}

export { isObject, asString, asNullableString }
