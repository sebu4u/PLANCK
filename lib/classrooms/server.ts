import { slugify } from "@/lib/slug"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import type {
  AssignmentProblem,
  AssignmentSubmission,
  ClassroomAnnouncement,
  ClassroomAssignmentListItem,
  ClassroomDetails,
  ClassroomMemberOverview,
  ClassroomSummary,
  TeacherAssignmentAttachmentGroup,
} from "@/lib/classrooms/types"

export interface AnnouncementLessonOption {
  id: string
  title: string
  slug: string
}

export interface AssignmentDetails {
  id: string
  classroom_id: string
  title: string
  description: string
  deadline: string | null
  created_at: string
  problems: AssignmentProblem[]
}

type AdminClient = ReturnType<typeof createAdminClient>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    supabase,
    admin: createAdminClient(),
    user,
  }
}

async function getClassroomMembership(
  admin: AdminClient,
  classroomId: string,
  userId: string
): Promise<ClassroomDetails | null> {
  const { data } = await admin
    .from("classroom_members")
    .select("role, classrooms!inner(id, name, join_code, teacher_id, created_at, cover_image)")
    .eq("classroom_id", classroomId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!isObject(data) || !isObject(data.classrooms)) {
    return null
  }

  return {
    id: asString(data.classrooms.id),
    name: asString(data.classrooms.name, "Classroom"),
    join_code: asString(data.classrooms.join_code),
    teacher_id: asString(data.classrooms.teacher_id),
    created_at: asString(data.classrooms.created_at),
    role: asString(data.role) === "teacher" ? "teacher" : "student",
    cover_image: asNullableString(data.classrooms.cover_image),
  }
}

async function getEmailMapForUserIds(admin: AdminClient, userIds: string[]) {
  const emailByUserId = new Map<string, string>()

  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data } = await admin.auth.admin.getUserById(userId)
        emailByUserId.set(userId, data.user?.email ?? "")
      } catch {
        emailByUserId.set(userId, "")
      }
    })
  )

  return emailByUserId
}

export async function requireAuthenticatedUser() {
  const { supabase, user } = await getAuthenticatedContext()
  return { supabase, user }
}

export async function getClassroomsForUser(userId: string): Promise<ClassroomSummary[]> {
  const { admin } = await getAuthenticatedContext()

  const { data: membershipRows } = await admin
    .from("classroom_members")
    .select("role, joined_at, classrooms!inner(id, name, join_code, teacher_id, created_at, cover_image)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })

  const memberships = (membershipRows ?? []).filter(isObject)
  const classroomIds = memberships
    .map((row) => (isObject(row.classrooms) ? asString(row.classrooms.id) : ""))
    .filter(Boolean)

  const studentCountByClassroom = new Map<string, number>()
  if (classroomIds.length > 0) {
    const { data: countRows } = await admin
      .from("classroom_members")
      .select("classroom_id")
      .in("classroom_id", classroomIds)

    for (const row of countRows ?? []) {
      if (!isObject(row)) continue
      const classroomId = asString(row.classroom_id)
      if (!classroomId) continue
      studentCountByClassroom.set(classroomId, (studentCountByClassroom.get(classroomId) ?? 0) + 1)
    }
  }

  const teacherIds = Array.from(
    new Set(
      memberships
        .map((row) => {
          const classroom = isObject(row.classrooms) ? row.classrooms : null
          return classroom ? asString(classroom.teacher_id) : ""
        })
        .filter(Boolean)
    )
  )

  const teacherNameById = new Map<string, string>()
  if (teacherIds.length > 0) {
    const { data: teacherProfiles } = await admin
      .from("profiles")
      .select("user_id, name, nickname")
      .in("user_id", teacherIds)

    for (const profile of teacherProfiles ?? []) {
      if (!isObject(profile)) continue
      const teacherId = asString(profile.user_id)
      if (!teacherId) continue
      teacherNameById.set(teacherId, asString(profile.nickname) || asString(profile.name) || "Teacher")
    }
  }

  return memberships
    .map((row) => {
      const classroomRaw = isObject(row.classrooms) ? row.classrooms : null
      if (!classroomRaw) return null

      const classroomId = asString(classroomRaw.id)
      if (!classroomId) return null

      return {
        id: classroomId,
        name: asString(classroomRaw.name, "Untitled Classroom"),
        join_code: asString(classroomRaw.join_code),
        teacher_id: asString(classroomRaw.teacher_id),
        teacher_name: teacherNameById.get(asString(classroomRaw.teacher_id)) ?? "Teacher",
        created_at: asString(classroomRaw.created_at),
        role: asString(row.role) === "teacher" ? "teacher" : "student",
        joined_at: asString(row.joined_at),
        student_count: studentCountByClassroom.get(classroomId) ?? 0,
        cover_image: asNullableString(classroomRaw.cover_image),
      } satisfies ClassroomSummary
    })
    .filter((row): row is ClassroomSummary => row !== null)
}

export async function getClassroomDetailsForUser(
  classroomId: string,
  userId: string
): Promise<ClassroomDetails | null> {
  const { admin } = await getAuthenticatedContext()
  return getClassroomMembership(admin, classroomId, userId)
}

export async function getClassroomAnnouncements(classroomId: string): Promise<ClassroomAnnouncement[]> {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return []

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership) return []

  const { data: rows } = await admin
    .from("announcements")
    .select("id, classroom_id, author_id, type, content, file_url, lesson_slug, created_at")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false })

  const announcements = (rows ?? []).filter(isObject)
  const authorIds = Array.from(
    new Set(
      announcements
        .map((row) => asString(row.author_id))
        .filter(Boolean)
    )
  )

  const authorNameById = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, name, nickname")
      .in("user_id", authorIds)

    for (const profile of profiles ?? []) {
      if (!isObject(profile)) continue
      const authorId = asString(profile.user_id)
      if (!authorId) continue
      authorNameById.set(
        authorId,
        asString(profile.nickname) || asString(profile.name) || "Teacher"
      )
    }
  }

  const result: ClassroomAnnouncement[] = []
  for (const row of announcements) {
    const filePath = asNullableString(row.file_url)
    let signedFileUrl: string | null = null

    if (filePath) {
      const { data: signedData } = await admin.storage
        .from("classroom-files")
        .createSignedUrl(filePath, 60 * 60)
      signedFileUrl = signedData?.signedUrl ?? null
    }

    const authorId = asString(row.author_id)
    result.push({
      id: asString(row.id),
      classroom_id: asString(row.classroom_id),
      author_id: authorId,
      type: (asString(row.type) as ClassroomAnnouncement["type"]) || "text",
      content: asNullableString(row.content),
      file_url: filePath,
      lesson_slug: asNullableString(row.lesson_slug),
      created_at: asString(row.created_at),
      author_name: authorNameById.get(authorId) ?? "Teacher",
      signed_file_url: signedFileUrl,
    })
  }

  return result
}

export async function getLessonOptionsForAnnouncements(): Promise<AnnouncementLessonOption[]> {
  const { admin } = await getAuthenticatedContext()
  const { data } = await admin
    .from("lessons")
    .select("id, title")
    .eq("is_active", true)
    .order("title", { ascending: true })
    .limit(300)

  return (data ?? [])
    .filter(isObject)
    .map((row) => {
      const title = asString(row.title)
      return {
        id: asString(row.id),
        title,
        slug: slugify(title),
      }
    })
    .filter((row) => row.id && row.title && row.slug)
}

export async function getClassroomAssignments(classroomId: string): Promise<ClassroomAssignmentListItem[]> {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return []

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership) return []

  let teacherName = "Teacher"
  if (membership.teacher_id) {
    const { data: teacherProfile } = await admin
      .from("profiles")
      .select("name, nickname")
      .eq("user_id", membership.teacher_id)
      .maybeSingle()

    if (isObject(teacherProfile)) {
      teacherName = asString(teacherProfile.nickname) || asString(teacherProfile.name) || teacherName
    }
  }

  const { data: assignmentRows } = await admin
    .from("assignments")
    .select("id, classroom_id, title, description, deadline, created_at")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false })

  const assignments = (assignmentRows ?? []).filter(isObject)
  const assignmentIds = assignments.map((row) => asString(row.id)).filter(Boolean)

  const countsByAssignment = new Map<string, number>()
  if (assignmentIds.length > 0) {
    const { data: problemRows } = await admin
      .from("assignment_problems")
      .select("assignment_id")
      .in("assignment_id", assignmentIds)

    for (const row of problemRows ?? []) {
      if (!isObject(row)) continue
      const assignmentId = asString(row.assignment_id)
      if (!assignmentId) continue
      countsByAssignment.set(assignmentId, (countsByAssignment.get(assignmentId) ?? 0) + 1)
    }
  }

  return assignments.map((row) => ({
    id: asString(row.id),
    classroom_id: asString(row.classroom_id),
    title: asString(row.title, "Untitled Assignment"),
    description: asString(row.description),
    deadline: asNullableString(row.deadline),
    created_at: asString(row.created_at),
    problem_count: countsByAssignment.get(asString(row.id)) ?? 0,
    author_name: teacherName,
  }))
}

export async function getProblemPool() {
  const { admin } = await getAuthenticatedContext()

  const { data } = await admin
    .from("problems")
    .select("id, title, statement, difficulty, class, answer_type, image_url, category, tags, solve_percentage")
    .order("created_at", { ascending: false })
    .limit(300)

  return (data ?? [])
    .filter(isObject)
    .map((row) => ({
      id: asString(row.id),
      title: asString(row.title, "Problem"),
      statement: asString(row.statement),
      difficulty: asNullableString(row.difficulty),
      class: asNumber(row.class, 0),
      answer_type:
        asString(row.answer_type) === "value" || asString(row.answer_type) === "grila"
          ? (asString(row.answer_type) as "value" | "grila")
          : null,
      image_url: asNullableString(row.image_url),
      category: asNullableString(row.category),
      tags: asNullableString(row.tags),
      solve_percentage:
        typeof row.solve_percentage === "number" && Number.isFinite(row.solve_percentage)
          ? row.solve_percentage
          : null,
    }))
    .filter((row) => row.id)
}

export async function getClassroomMembers(classroomId: string): Promise<ClassroomMemberOverview[]> {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return []

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership) return []

  const [{ data: rows }, { data: classroomRow }] = await Promise.all([
    admin
      .from("classroom_members")
      .select("id, user_id, role, joined_at")
      .eq("classroom_id", classroomId)
      .order("joined_at", { ascending: true }),
    admin.from("classrooms").select("teacher_id, created_at").eq("id", classroomId).maybeSingle(),
  ])

  let members = (rows ?? []).filter(isObject)
  const teacherIdFromClass = isObject(classroomRow) ? asString(classroomRow.teacher_id) : ""
  const classCreatedAt = isObject(classroomRow) ? asString(classroomRow.created_at) : ""

  const teacherUserInMembers = teacherIdFromClass
    ? members.some((row) => asString(row.user_id) === teacherIdFromClass)
    : true

  if (teacherIdFromClass && !teacherUserInMembers) {
    members = [
      {
        id: `virtual-teacher-${teacherIdFromClass}`,
        user_id: teacherIdFromClass,
        role: "teacher",
        joined_at: classCreatedAt || new Date(0).toISOString(),
      },
      ...members,
    ]
  }

  const userIds = members.map((row) => asString(row.user_id)).filter(Boolean)

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, name, nickname, user_icon")
    .in("user_id", userIds)

  const profileByUserId = new Map<string, { name: string; nickname: string; user_icon: string | null }>()
  for (const profile of profiles ?? []) {
    if (!isObject(profile)) continue
    const userIdValue = asString(profile.user_id)
    if (!userIdValue) continue
    profileByUserId.set(userIdValue, {
      name: asString(profile.name),
      nickname: asString(profile.nickname),
      user_icon: (() => {
        const raw = asNullableString(profile.user_icon)
        return raw && raw.trim() ? raw.trim() : null
      })(),
    })
  }

  const { data: statsRows } = await admin.from("user_stats").select("user_id, elo, rank").in("user_id", userIds)

  const statsByUserId = new Map<string, { elo: number; rank: string }>()
  for (const stat of statsRows ?? []) {
    if (!isObject(stat)) continue
    const uid = asString(stat.user_id)
    if (!uid) continue
    statsByUserId.set(uid, {
      elo: asNumber(stat.elo, 500),
      rank: asString(stat.rank, "Bronze III"),
    })
  }

  const emailByUserId = await getEmailMapForUserIds(admin, userIds)

  return members.map((row) => {
    const userIdValue = asString(row.user_id)
    const profile = profileByUserId.get(userIdValue)
    const role: "teacher" | "student" = asString(row.role) === "teacher" ? "teacher" : "student"
    const stats = statsByUserId.get(userIdValue)
    return {
      member_id: asString(row.id),
      user_id: userIdValue,
      role,
      joined_at: asString(row.joined_at),
      name: profile?.nickname || profile?.name || (role === "teacher" ? "Profesor" : "Elev"),
      email: emailByUserId.get(userIdValue) ?? "",
      user_icon: profile?.user_icon ?? null,
      elo: stats?.elo ?? 500,
      rank: stats?.rank ?? "Bronze III",
    }
  })
}

export async function getClassroomLeaderboard(classroomId: string) {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return []

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership) return []

  const members = await getClassroomMembers(classroomId)
  const students = members.filter((member) => member.role === "student")

  const { data: assignmentRows } = await admin
    .from("assignments")
    .select("id")
    .eq("classroom_id", classroomId)

  const assignmentIds = (assignmentRows ?? [])
    .filter(isObject)
    .map((row) => asString(row.id))
    .filter(Boolean)

  if (assignmentIds.length === 0) {
    return students.map((student) => ({
      user_id: student.user_id,
      name: student.name,
      email: student.email,
      solved: 0,
    }))
  }

  const { data: submissionRows } = await admin
    .from("submissions")
    .select("student_id, is_correct")
    .in("assignment_id", assignmentIds)
    .eq("is_correct", true)

  const solvedByStudent = new Map<string, number>()
  for (const row of submissionRows ?? []) {
    if (!isObject(row)) continue
    const studentId = asString(row.student_id)
    if (!studentId) continue
    solvedByStudent.set(studentId, (solvedByStudent.get(studentId) ?? 0) + 1)
  }

  return students
    .map((student) => ({
      user_id: student.user_id,
      name: student.name,
      email: student.email,
      solved: solvedByStudent.get(student.user_id) ?? 0,
    }))
    .sort((a, b) => b.solved - a.solved || a.name.localeCompare(b.name))
}

export async function getAssignmentDetails(
  classroomId: string,
  assignmentId: string
): Promise<AssignmentDetails | null> {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return null

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership) return null

  const { data: assignment } = await admin
    .from("assignments")
    .select("id, classroom_id, title, description, deadline, created_at")
    .eq("id", assignmentId)
    .eq("classroom_id", classroomId)
    .maybeSingle()

  if (!isObject(assignment)) {
    return null
  }

  const { data: problemRows } = await admin
    .from("assignment_problems")
    .select(
      "problem_id, problems!inner(id, title, statement, difficulty, answer_type, value_subpoints, grila_options, grila_correct_index, image_url)"
    )
    .eq("assignment_id", assignmentId)

  const problems: AssignmentProblem[] = []
  for (const row of problemRows ?? []) {
    if (!isObject(row) || !isObject(row.problems)) continue
    const optionsRaw = row.problems.grila_options
    const options = Array.isArray(optionsRaw) ? optionsRaw.map((option) => String(option ?? "")) : null

    problems.push({
      id: asString(row.problems.id),
      title: asString(row.problems.title, "Problem"),
      statement: asString(row.problems.statement),
      difficulty: asNullableString(row.problems.difficulty),
      answer_type:
        asString(row.problems.answer_type) === "value" || asString(row.problems.answer_type) === "grila"
          ? (asString(row.problems.answer_type) as "value" | "grila")
          : null,
      value_subpoints: Array.isArray(row.problems.value_subpoints)
        ? row.problems.value_subpoints
            .filter((item) => isObject(item))
            .map((item) => ({
              label: asString(item.label),
              text_before: asString(item.text_before),
              text_after: asString(item.text_after),
              correct_value: asNumber(item.correct_value),
            }))
        : null,
      grila_options: options,
      grila_correct_index:
        typeof row.problems.grila_correct_index === "number"
          ? row.problems.grila_correct_index
          : null,
      image_url: asNullableString(row.problems.image_url),
    })
  }

  return {
    id: asString(assignment.id),
    classroom_id: asString(assignment.classroom_id),
    title: asString(assignment.title),
    description: asString(assignment.description),
    deadline: asNullableString(assignment.deadline),
    created_at: asString(assignment.created_at),
    problems,
  }
}

export async function getAssignmentSubmissions(
  classroomId: string,
  assignmentId: string
): Promise<AssignmentSubmission[]> {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return []

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership) return []

  let submissionsQuery = admin
    .from("submissions")
    .select("id, assignment_id, problem_id, student_id, answer, is_correct, submitted_at")
    .eq("assignment_id", assignmentId)

  if (membership.role === "student") {
    submissionsQuery = submissionsQuery.eq("student_id", user.id)
  }

  const { data } = await submissionsQuery

  const rows = (data ?? []).filter(isObject).map((row) => ({
    id: asString(row.id),
    assignment_id: asString(row.assignment_id),
    problem_id: asString(row.problem_id),
    student_id: asString(row.student_id),
    answer: asString(row.answer),
    is_correct: Boolean(row.is_correct),
    submitted_at: asString(row.submitted_at),
  }))

  if (membership.role !== "student" || rows.length === 0) {
    return rows
  }

  const submissionIds = rows.map((row) => row.id).filter(Boolean)
  const { data: attachmentRows } = await admin
    .from("submission_teacher_attachments")
    .select("submission_id")
    .in("submission_id", submissionIds)

  const countBySubmission = new Map<string, number>()
  for (const raw of attachmentRows ?? []) {
    if (!isObject(raw)) continue
    const sid = asString(raw.submission_id)
    if (!sid) continue
    countBySubmission.set(sid, (countBySubmission.get(sid) ?? 0) + 1)
  }

  return rows.map((row) => ({
    ...row,
    teacher_attachment_count: countBySubmission.get(row.id) ?? 0,
  }))
}

export async function getTeacherAssignmentAttachmentGroups(
  classroomId: string,
  assignmentId: string,
  problems: Pick<AssignmentProblem, "id" | "title">[],
  members: Pick<ClassroomMemberOverview, "user_id" | "name" | "role">[]
): Promise<TeacherAssignmentAttachmentGroup[]> {
  const { admin, user } = await getAuthenticatedContext()
  if (!user) return []

  const membership = await getClassroomMembership(admin, classroomId, user.id)
  if (!membership || membership.role !== "teacher") return []

  const { data: submissionRows } = await admin
    .from("submissions")
    .select("id, student_id, problem_id")
    .eq("assignment_id", assignmentId)

  const submissions = (submissionRows ?? []).filter(isObject)
  if (submissions.length === 0) return []

  const submissionIds = submissions.map((row) => asString(row.id)).filter(Boolean)
  const { data: attachmentRows } = await admin
    .from("submission_teacher_attachments")
    .select("submission_id, storage_path")
    .in("submission_id", submissionIds)

  const attachments = (attachmentRows ?? []).filter(isObject)
  if (attachments.length === 0) return []

  const submissionById = new Map(
    submissions.map((row) => {
      const id = asString(row.id)
      return [
        id,
        {
          student_id: asString(row.student_id),
          problem_id: asString(row.problem_id),
        },
      ] as const
    })
  )

  const titleByProblem = new Map(problems.map((problem) => [problem.id, problem.title]))
  const nameByStudent = new Map(
    members.filter((member) => member.role === "student").map((member) => [member.user_id, member.name])
  )

  type MutableGroup = {
    student_id: string
    student_name: string
    problem_id: string
    problem_title: string
    paths: string[]
  }
  const groupMap = new Map<string, MutableGroup>()

  for (const raw of attachments) {
    const submissionId = asString(raw.submission_id)
    const storagePath = asString(raw.storage_path)
    if (!submissionId || !storagePath) continue

    const submission = submissionById.get(submissionId)
    if (!submission) continue

    const key = `${submission.student_id}::${submission.problem_id}`
    let group = groupMap.get(key)
    if (!group) {
      group = {
        student_id: submission.student_id,
        student_name: nameByStudent.get(submission.student_id) ?? "Elev",
        problem_id: submission.problem_id,
        problem_title: titleByProblem.get(submission.problem_id) ?? "Problemă",
        paths: [],
      }
      groupMap.set(key, group)
    }
    group.paths.push(storagePath)
  }

  const bucket = admin.storage.from("assignment-teacher-attachments")
  const result: TeacherAssignmentAttachmentGroup[] = []

  for (const group of groupMap.values()) {
    const signed_urls: string[] = []
    for (const path of group.paths) {
      const { data: signed } = await bucket.createSignedUrl(path, 60 * 60)
      if (signed?.signedUrl) {
        signed_urls.push(signed.signedUrl)
      }
    }
    result.push({
      student_id: group.student_id,
      student_name: group.student_name,
      problem_id: group.problem_id,
      problem_title: group.problem_title,
      signed_urls,
    })
  }

  result.sort((left, right) => {
    const nameCmp = left.student_name.localeCompare(right.student_name, "ro")
    if (nameCmp !== 0) return nameCmp
    return left.problem_id.localeCompare(right.problem_id)
  })

  return result
}
