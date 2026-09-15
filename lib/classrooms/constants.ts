export const CLASSROOM_SUBJECTS = ["matematica", "fizica", "informatica", "chimie", "biologie"] as const
export type ClassroomSubject = (typeof CLASSROOM_SUBJECTS)[number]

export const CLASSROOM_SUBJECT_LABELS: Record<ClassroomSubject, string> = {
  matematica: "Matematică",
  fizica: "Fizică",
  informatica: "Informatică",
  chimie: "Chimie",
  biologie: "Biologie",
}

export const CLASSROOM_GRADE_LEVELS = ["IX", "X", "XI", "XII"] as const
export type ClassroomGradeLevel = (typeof CLASSROOM_GRADE_LEVELS)[number]

export const CLASSROOM_GRADE_LABELS: Record<ClassroomGradeLevel, string> = {
  IX: "Clasa a IX-a",
  X: "Clasa a X-a",
  XI: "Clasa a XI-a",
  XII: "Clasa a XII-a",
}

export const ASSIGNMENT_STATUSES = ["draft", "published", "closed"] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  draft: "Ciornă",
  published: "Publicată",
  closed: "Închisă",
}

export const ASSIGNMENT_KINDS = ["homework", "test"] as const
export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number]

export const ASSIGNMENT_KIND_LABELS: Record<AssignmentKind, string> = {
  homework: "Temă",
  test: "Test",
}

export const LATE_POLICIES = ["accept", "mark_late", "block"] as const
export type AssignmentLatePolicy = (typeof LATE_POLICIES)[number]

export const LATE_POLICY_LABELS: Record<AssignmentLatePolicy, string> = {
  accept: "Acceptă întârzieri",
  mark_late: "Acceptă, marchează ca întârziat",
  block: "Blochează după termen",
}

export const ATTENDANCE_STATUSES = ["present", "absent", "late"] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Prezent",
  absent: "Absent",
  late: "Întârziat",
}

export function currentSchoolYear(now = new Date()): string {
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = month >= 8 ? year : year - 1
  return `${start}-${start + 1}`
}

export function isClassroomSubject(value: unknown): value is ClassroomSubject {
  return typeof value === "string" && (CLASSROOM_SUBJECTS as readonly string[]).includes(value)
}

export function isClassroomGradeLevel(value: unknown): value is ClassroomGradeLevel {
  return typeof value === "string" && (CLASSROOM_GRADE_LEVELS as readonly string[]).includes(value)
}

export function isAssignmentStatus(value: unknown): value is AssignmentStatus {
  return typeof value === "string" && (ASSIGNMENT_STATUSES as readonly string[]).includes(value)
}

export function isAssignmentKind(value: unknown): value is AssignmentKind {
  return typeof value === "string" && (ASSIGNMENT_KINDS as readonly string[]).includes(value)
}

export function isLatePolicy(value: unknown): value is AssignmentLatePolicy {
  return typeof value === "string" && (LATE_POLICIES as readonly string[]).includes(value)
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return typeof value === "string" && (ATTENDANCE_STATUSES as readonly string[]).includes(value)
}

export function classroomJoinUrl(joinCode: string, origin?: string): string {
  const base = origin?.replace(/\/$/, "") || ""
  return `${base}/classrooms/join?code=${encodeURIComponent(joinCode)}`
}

export function formatClassroomMeta(input: {
  grade_level: string | null
  section: string | null
  subject: string | null
}): string | null {
  const parts: string[] = []
  if (input.grade_level) {
    const grade = isClassroomGradeLevel(input.grade_level)
      ? CLASSROOM_GRADE_LABELS[input.grade_level]
      : input.grade_level
    parts.push(input.section ? `${grade} ${input.section}` : grade)
  } else if (input.section) {
    parts.push(`Paralela ${input.section}`)
  }
  if (input.subject && isClassroomSubject(input.subject)) {
    parts.push(CLASSROOM_SUBJECT_LABELS[input.subject])
  }
  return parts.length > 0 ? parts.join(" · ") : null
}
