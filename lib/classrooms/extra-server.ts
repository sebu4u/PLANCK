import { createAdminClient } from "@/lib/supabaseAdmin"
import { createClient } from "@/lib/supabase/server"
import { asNullableString, asString, isObject } from "@/lib/classrooms/mappers"
import type {
  AttendanceStatus,
  ClassroomAttendanceRow,
  ClassroomInvite,
  ClassroomSession,
  ParentClassroomMessage,
  SchoolSummary,
} from "@/lib/classrooms/types"
import { getClassroomDetailsForUser, getClassroomMembers } from "@/lib/classrooms/server"

type AdminClient = ReturnType<typeof createAdminClient>

async function adminAndUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { admin: createAdminClient(), user }
}

function asAttendanceStatus(value: unknown): AttendanceStatus {
  return value === "absent" || value === "late" ? value : "present"
}

export async function getClassroomInvites(classroomId: string): Promise<ClassroomInvite[]> {
  const { admin, user } = await adminAndUser()
  if (!user) return []
  const membership = await getClassroomDetailsForUser(classroomId, user.id)
  if (!membership || membership.role !== "teacher") return []

  const { data } = await admin
    .from("classroom_invites")
    .select("id, classroom_id, email, full_name, role, created_at, accepted_at")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false })

  return (data ?? []).filter(isObject).map((row) => ({
    id: asString(row.id),
    classroom_id: asString(row.classroom_id),
    email: asString(row.email),
    full_name: asNullableString(row.full_name),
    role: asString(row.role) === "teacher" ? "teacher" : "student",
    created_at: asString(row.created_at),
    accepted_at: asNullableString(row.accepted_at),
  }))
}

export async function getActiveClassroomSession(classroomId: string): Promise<ClassroomSession | null> {
  const { admin, user } = await adminAndUser()
  if (!user) return null
  const membership = await getClassroomDetailsForUser(classroomId, user.id)
  if (!membership) return null

  const { data } = await admin
    .from("classroom_sessions")
    .select(
      "id, classroom_id, started_by, started_at, ended_at, status, current_problem_id, assignment_id, exit_ticket_assignment_id",
    )
    .eq("classroom_id", classroomId)
    .eq("status", "active")
    .maybeSingle()

  if (!isObject(data)) return null
  return mapSession(data)
}

export async function getClassroomSessionById(
  classroomId: string,
  sessionId: string,
): Promise<ClassroomSession | null> {
  const { admin, user } = await adminAndUser()
  if (!user) return null
  const membership = await getClassroomDetailsForUser(classroomId, user.id)
  if (!membership) return null

  const { data } = await admin
    .from("classroom_sessions")
    .select(
      "id, classroom_id, started_by, started_at, ended_at, status, current_problem_id, assignment_id, exit_ticket_assignment_id",
    )
    .eq("id", sessionId)
    .eq("classroom_id", classroomId)
    .maybeSingle()

  if (!isObject(data)) return null
  return mapSession(data)
}

export async function getRecentClassroomSessions(classroomId: string, limit = 8): Promise<ClassroomSession[]> {
  const { admin, user } = await adminAndUser()
  if (!user) return []
  const membership = await getClassroomDetailsForUser(classroomId, user.id)
  if (!membership || membership.role !== "teacher") return []

  const { data } = await admin
    .from("classroom_sessions")
    .select(
      "id, classroom_id, started_by, started_at, ended_at, status, current_problem_id, assignment_id, exit_ticket_assignment_id",
    )
    .eq("classroom_id", classroomId)
    .order("started_at", { ascending: false })
    .limit(limit)

  return (data ?? []).filter(isObject).map(mapSession)
}

function mapSession(row: Record<string, unknown>): ClassroomSession {
  return {
    id: asString(row.id),
    classroom_id: asString(row.classroom_id),
    started_by: asString(row.started_by),
    started_at: asString(row.started_at),
    ended_at: asNullableString(row.ended_at),
    status: asString(row.status) === "ended" ? "ended" : "active",
    current_problem_id: asNullableString(row.current_problem_id),
    assignment_id: asNullableString(row.assignment_id),
    exit_ticket_assignment_id: asNullableString(row.exit_ticket_assignment_id),
  }
}

export async function getSessionAttendance(
  classroomId: string,
  sessionId: string,
): Promise<ClassroomAttendanceRow[]> {
  const { admin, user } = await adminAndUser()
  if (!user) return []
  const membership = await getClassroomDetailsForUser(classroomId, user.id)
  if (!membership || membership.role !== "teacher") return []

  const members = await getClassroomMembers(classroomId)
  const students = members.filter((member) => member.role === "student")

  const { data } = await admin
    .from("classroom_session_attendance")
    .select("student_id, status, marked_at")
    .eq("session_id", sessionId)

  const byStudent = new Map<string, { status: AttendanceStatus; marked_at: string | null }>()
  for (const row of data ?? []) {
    if (!isObject(row)) continue
    byStudent.set(asString(row.student_id), {
      status: asAttendanceStatus(row.status),
      marked_at: asNullableString(row.marked_at),
    })
  }

  return students
    .map((student) => {
      const row = byStudent.get(student.user_id)
      return {
        student_id: student.user_id,
        student_name: student.name,
        status: row?.status ?? "absent",
        marked_at: row?.marked_at ?? null,
      }
    })
    .sort((a, b) => a.student_name.localeCompare(b.student_name, "ro"))
}

export async function getAssignmentStart(
  assignmentId: string,
  studentId: string,
): Promise<{ started_at: string; tab_blur_count: number } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("assignment_starts")
    .select("started_at, tab_blur_count")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle()
  if (!isObject(data)) return null
  return {
    started_at: asString(data.started_at),
    tab_blur_count: typeof data.tab_blur_count === "number" ? data.tab_blur_count : 0,
  }
}

export async function getSchoolsForUser(userId: string): Promise<SchoolSummary[]> {
  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from("school_members")
    .select("role, schools!inner(id, name, created_by, created_at)")
    .eq("user_id", userId)

  const memberships = (memberRows ?? []).filter(isObject)
  const schoolIds = memberships
    .map((row) => (isObject(row.schools) ? asString(row.schools.id) : ""))
    .filter(Boolean)

  const countBySchool = new Map<string, number>()
  if (schoolIds.length > 0) {
    const { data: counts } = await admin.from("school_members").select("school_id").in("school_id", schoolIds)
    for (const row of counts ?? []) {
      if (!isObject(row)) continue
      const id = asString(row.school_id)
      countBySchool.set(id, (countBySchool.get(id) ?? 0) + 1)
    }
  }

  return memberships
    .map((row) => {
      const school = isObject(row.schools) ? row.schools : null
      if (!school) return null
      const id = asString(school.id)
      return {
        id,
        name: asString(school.name, "Școală"),
        created_by: asString(school.created_by),
        created_at: asString(school.created_at),
        role: asString(row.role) === "admin" ? "admin" : "teacher",
        member_count: countBySchool.get(id) ?? 0,
      } satisfies SchoolSummary
    })
    .filter((row): row is SchoolSummary => row !== null)
}

export async function getSchoolMembers(schoolId: string) {
  const { admin, user } = await adminAndUser()
  if (!user) return []
  const { data: membership } = await admin
    .from("school_members")
    .select("role")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) return []

  const { data: rows } = await admin
    .from("school_members")
    .select("id, user_id, role, joined_at")
    .eq("school_id", schoolId)
    .order("joined_at", { ascending: true })

  const userIds = (rows ?? []).filter(isObject).map((row) => asString(row.user_id)).filter(Boolean)
  const { data: profiles } = await admin.from("profiles").select("user_id, name, nickname").in("user_id", userIds)
  const nameById = new Map<string, string>()
  for (const profile of profiles ?? []) {
    if (!isObject(profile)) continue
    nameById.set(
      asString(profile.user_id),
      asString(profile.nickname) || asString(profile.name) || "Profesor",
    )
  }

  return (rows ?? []).filter(isObject).map((row) => ({
    id: asString(row.id),
    user_id: asString(row.user_id),
    role: asString(row.role) === "admin" ? ("admin" as const) : ("teacher" as const),
    joined_at: asString(row.joined_at),
    name: nameById.get(asString(row.user_id)) ?? "Profesor",
  }))
}

export async function getParentClassroomMessages(parentId: string): Promise<ParentClassroomMessage[]> {
  const admin = createAdminClient()
  const { data: links } = await admin
    .from("parent_child_relationships")
    .select("child_id")
    .eq("parent_id", parentId)
    .eq("status", "active")

  const childIds = (links ?? []).filter(isObject).map((row) => asString(row.child_id)).filter(Boolean)
  if (childIds.length === 0) return []

  const { data: memberships } = await admin
    .from("classroom_members")
    .select("classroom_id, user_id, classrooms!inner(id, name)")
    .in("user_id", childIds)
    .eq("role", "student")

  const classroomIds = Array.from(
    new Set(
      (memberships ?? [])
        .filter(isObject)
        .map((row) => asString(row.classroom_id))
        .filter(Boolean),
    ),
  )
  if (classroomIds.length === 0) return []

  const classroomNameById = new Map<string, string>()
  const childrenByClassroom = new Map<string, string[]>()
  for (const row of memberships ?? []) {
    if (!isObject(row)) continue
    const classroomId = asString(row.classroom_id)
    classroomNameById.set(
      classroomId,
      isObject(row.classrooms) ? asString(row.classrooms.name, "Clasă") : "Clasă",
    )
    const list = childrenByClassroom.get(classroomId) ?? []
    list.push(asString(row.user_id))
    childrenByClassroom.set(classroomId, list)
  }

  const { data: messages } = await admin
    .from("classroom_parent_messages")
    .select("id, classroom_id, author_id, student_id, body, created_at")
    .in("classroom_id", classroomIds)
    .order("created_at", { ascending: false })
    .limit(80)

  const authorIds = Array.from(
    new Set((messages ?? []).filter(isObject).map((row) => asString(row.author_id)).filter(Boolean)),
  )
  const studentIds = Array.from(
    new Set((messages ?? []).filter(isObject).map((row) => asString(row.student_id)).filter(Boolean)),
  )
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, name, nickname")
    .in("user_id", [...authorIds, ...studentIds])
  const nameById = new Map<string, string>()
  for (const profile of profiles ?? []) {
    if (!isObject(profile)) continue
    nameById.set(asString(profile.user_id), asString(profile.nickname) || asString(profile.name) || "Utilizator")
  }

  return (messages ?? [])
    .filter(isObject)
    .filter((row) => {
      const classroomId = asString(row.classroom_id)
      const studentId = asNullableString(row.student_id)
      const children = childrenByClassroom.get(classroomId) ?? []
      if (studentId) return children.includes(studentId)
      return children.length > 0
    })
    .map((row) => ({
      id: asString(row.id),
      classroom_id: asString(row.classroom_id),
      classroom_name: classroomNameById.get(asString(row.classroom_id)) ?? "Clasă",
      author_name: nameById.get(asString(row.author_id)) ?? "Profesor",
      student_id: asNullableString(row.student_id),
      student_name: asNullableString(row.student_id) ? nameById.get(asString(row.student_id)) ?? "Elev" : null,
      body: asString(row.body),
      created_at: asString(row.created_at),
    }))
}

export async function getClassroomParentMessages(classroomId: string): Promise<ParentClassroomMessage[]> {
  const { admin, user } = await adminAndUser()
  if (!user) return []
  const membership = await getClassroomDetailsForUser(classroomId, user.id)
  if (!membership || membership.role !== "teacher") return []

  const { data } = await admin
    .from("classroom_parent_messages")
    .select("id, classroom_id, author_id, student_id, body, created_at")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false })
    .limit(50)

  const ids = Array.from(
    new Set(
      (data ?? [])
        .filter(isObject)
        .flatMap((row) => [asString(row.author_id), asString(row.student_id)])
        .filter(Boolean),
    ),
  )
  const { data: profiles } = await admin.from("profiles").select("user_id, name, nickname").in("user_id", ids)
  const nameById = new Map<string, string>()
  for (const profile of profiles ?? []) {
    if (!isObject(profile)) continue
    nameById.set(asString(profile.user_id), asString(profile.nickname) || asString(profile.name) || "Utilizator")
  }

  return (data ?? []).filter(isObject).map((row) => ({
    id: asString(row.id),
    classroom_id: classroomId,
    classroom_name: membership.name,
    author_name: nameById.get(asString(row.author_id)) ?? "Profesor",
    student_id: asNullableString(row.student_id),
    student_name: asNullableString(row.student_id) ? nameById.get(asString(row.student_id)) ?? "Elev" : null,
    body: asString(row.body),
    created_at: asString(row.created_at),
  }))
}

export async function lookupUserIdsByEmails(admin: AdminClient, emails: string[]) {
  const cleaned = emails.map((email) => email.trim().toLowerCase()).filter(Boolean)
  if (cleaned.length === 0) return [] as Array<{ user_id: string; email: string }>
  const { data, error } = await admin.rpc("find_user_ids_by_emails", { p_emails: cleaned })
  if (error) {
    console.error("lookupUserIdsByEmails", error)
    return []
  }
  const rows: unknown[] = Array.isArray(data) ? data : []
  return rows
    .filter(isObject)
    .map((row) => ({
      user_id: asString(row.user_id),
      email: asString(row.email).toLowerCase(),
    }))
    .filter((row) => Boolean(row.user_id && row.email))
}
