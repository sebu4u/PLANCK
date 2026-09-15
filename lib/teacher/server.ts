import { createAdminClient } from "@/lib/supabaseAdmin"
import type { ClassroomSummary } from "@/lib/classrooms/types"
import {
  getClassroomMembers,
  getClassroomsForUser,
} from "@/lib/classrooms/server"
import { estimateGradeFromElo, formatGrade } from "@/lib/parent/grade-estimate"

export interface TeacherStudentStat {
  user_id: string
  name: string
  elo: number
  rank: string
  current_streak: number
  problems_solved_total: number
  last_activity_date: string | null
  activity_minutes_30d: number
}

export interface TeacherClassroomOverview {
  classroom: ClassroomSummary
  students: TeacherStudentStat[]
  class_stats: {
    student_count: number
    avg_elo: number
    avg_streak: number
    active_last_7_days: number
    total_problems_solved: number
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

export async function getTeacherDashboardOverview(userId: string): Promise<TeacherClassroomOverview[]> {
  const classrooms = (await getClassroomsForUser(userId)).filter(
    (classroom) => classroom.role === "teacher"
  )

  if (classrooms.length === 0) return []

  const admin = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString().slice(0, 10)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString().slice(0, 10)

  const overview: TeacherClassroomOverview[] = []

  for (const classroom of classrooms) {
    const members = await getClassroomMembers(classroom.id)
    const students = members.filter((member) => member.role === "student")
    const studentIds = students.map((student) => student.user_id)

    let statsByUser = new Map<string, Record<string, unknown>>()
    let activityByUser = new Map<string, number>()

    if (studentIds.length > 0) {
      const [{ data: statsRows }, { data: activityRows }] = await Promise.all([
        admin.from("user_stats").select("*").in("user_id", studentIds),
        admin
          .from("daily_activity")
          .select("user_id, time_minutes, activity_date")
          .in("user_id", studentIds)
          .gte("activity_date", sinceIso),
      ])

      statsByUser = new Map(
        (statsRows ?? [])
          .filter(isObject)
          .map((row) => [asString(row.user_id), row] as const)
      )

      for (const row of activityRows ?? []) {
        if (!isObject(row)) continue
        const activityUserId = asString(row.user_id)
        activityByUser.set(
          activityUserId,
          (activityByUser.get(activityUserId) ?? 0) + asNumber(row.time_minutes)
        )
      }
    }

    const studentStats: TeacherStudentStat[] = students.map((student) => {
      const stats = statsByUser.get(student.user_id)
      return {
        user_id: student.user_id,
        name: student.name,
        elo: asNumber(stats?.elo, student.elo),
        rank: asString(stats?.rank, student.rank),
        current_streak: asNumber(stats?.current_streak),
        problems_solved_total: asNumber(stats?.problems_solved_total),
        last_activity_date: asNullableString(stats?.last_activity_date),
        activity_minutes_30d: activityByUser.get(student.user_id) ?? 0,
      }
    })

    const avgElo =
      studentStats.length > 0
        ? Math.round(studentStats.reduce((sum, s) => sum + s.elo, 0) / studentStats.length)
        : 0
    const avgStreak =
      studentStats.length > 0
        ? Math.round(
            (studentStats.reduce((sum, s) => sum + s.current_streak, 0) / studentStats.length) * 10
          ) / 10
        : 0
    const activeLast7 =
      studentStats.filter(
        (student) =>
          student.last_activity_date && student.last_activity_date >= weekAgoIso
      ).length
    const totalProblems = studentStats.reduce((sum, s) => sum + s.problems_solved_total, 0)

    overview.push({
      classroom,
      students: studentStats.sort((a, b) => b.elo - a.elo),
      class_stats: {
        student_count: studentStats.length,
        avg_elo: avgElo,
        avg_streak: avgStreak,
        active_last_7_days: activeLast7,
        total_problems_solved: totalProblems,
      },
    })
  }

  return overview
}

export interface TeacherAssignmentOverviewItem {
  id: string
  classroom_id: string
  classroom_name: string
  title: string
  description: string
  deadline: string | null
  created_at: string
  problem_count: number
  status: "draft" | "published" | "closed"
  kind: "homework" | "test"
  submitted_count?: number
}

export async function getTeacherAssignmentsOverview(
  userId: string,
): Promise<TeacherAssignmentOverviewItem[]> {
  const classrooms = (await getClassroomsForUser(userId)).filter(
    (classroom) => classroom.role === "teacher",
  )

  if (classrooms.length === 0) return []

  const admin = createAdminClient()
  const classroomIds = classrooms.map((classroom) => classroom.id)
  const classroomNameById = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]))

  const { data: assignmentRows } = await admin
    .from("assignments")
    .select("id, classroom_id, title, description, deadline, created_at, status, kind")
    .in("classroom_id", classroomIds)
    .order("created_at", { ascending: false })

  const assignments = (assignmentRows ?? []).filter(isObject)
  if (assignments.length === 0) return []

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

  return assignments.map((row) => {
    const id = asString(row.id)
    const classroomId = asString(row.classroom_id)
    return {
      id,
      classroom_id: classroomId,
      classroom_name: classroomNameById.get(classroomId) ?? "Clasă",
      title: asString(row.title, "Temă"),
      description: asString(row.description),
      deadline: asNullableString(row.deadline),
      created_at: asString(row.created_at),
      problem_count: countsByAssignment.get(id) ?? 0,
      status: asString(row.status) === "draft" || asString(row.status) === "closed" ? asString(row.status) as "draft" | "closed" : "published",
      kind: asString(row.kind) === "test" ? "test" : "homework",
    }
  })
}

export interface TeacherPendingHomeworkReview {
  submission_id: string
  classroom_id: string
  classroom_name: string
  assignment_id: string
  assignment_title: string
  student_name: string
  problem_title: string
  submitted_at: string
  photo_count: number
  photo_urls: string[]
  teacher_comment: string | null
}

export interface TeacherPendingHomeworkReviewsResult {
  items: TeacherPendingHomeworkReview[]
  total_count: number
}

const PENDING_HOMEWORK_LIST_LIMIT = 8

export async function getTeacherPendingHomeworkReviews(
  userId: string,
): Promise<TeacherPendingHomeworkReviewsResult> {
  const classrooms = (await getClassroomsForUser(userId)).filter(
    (classroom) => classroom.role === "teacher",
  )

  if (classrooms.length === 0) {
    return { items: [], total_count: 0 }
  }

  const admin = createAdminClient()
  const classroomIds = classrooms.map((classroom) => classroom.id)
  const classroomNameById = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]))

  const { data: assignmentRows } = await admin
    .from("assignments")
    .select("id, classroom_id, title")
    .in("classroom_id", classroomIds)

  const assignments = (assignmentRows ?? []).filter(isObject)
  if (assignments.length === 0) {
    return { items: [], total_count: 0 }
  }

  const assignmentById = new Map(
    assignments.map((row) => [
      asString(row.id),
      {
        classroom_id: asString(row.classroom_id),
        title: asString(row.title, "Temă"),
      },
    ] as const),
  )
  const assignmentIds = [...assignmentById.keys()]

  const { data: submissionRows } = await admin
    .from("submissions")
    .select("id, assignment_id, problem_id, student_id, submitted_at, teacher_comment")
    .in("assignment_id", assignmentIds)
    .is("reviewed_at", null)

  const submissions = (submissionRows ?? []).filter(isObject)
  if (submissions.length === 0) {
    return { items: [], total_count: 0 }
  }

  const submissionIds = submissions.map((row) => asString(row.id)).filter(Boolean)
  const { data: attachmentRows } = await admin
    .from("submission_teacher_attachments")
    .select("submission_id, storage_path")
    .in("submission_id", submissionIds)

  const photoCountBySubmission = new Map<string, number>()
  const photoPathsBySubmission = new Map<string, string[]>()
  for (const row of attachmentRows ?? []) {
    if (!isObject(row)) continue
    const submissionId = asString(row.submission_id)
    const storagePath = asString(row.storage_path)
    if (!submissionId) continue
    photoCountBySubmission.set(submissionId, (photoCountBySubmission.get(submissionId) ?? 0) + 1)
    if (!storagePath) continue
    const paths = photoPathsBySubmission.get(submissionId) ?? []
    paths.push(storagePath)
    photoPathsBySubmission.set(submissionId, paths)
  }

  const pendingSubmissions = submissions.filter((row) => {
    const id = asString(row.id)
    return id && (photoCountBySubmission.get(id) ?? 0) > 0
  })

  if (pendingSubmissions.length === 0) {
    return { items: [], total_count: 0 }
  }

  const studentIds = [...new Set(pendingSubmissions.map((row) => asString(row.student_id)).filter(Boolean))]
  const problemIds = [...new Set(pendingSubmissions.map((row) => asString(row.problem_id)).filter(Boolean))]

  const [{ data: profileRows }, { data: problemRows }] = await Promise.all([
    admin.from("profiles").select("user_id, name, nickname").in("user_id", studentIds),
    admin.from("problems").select("id, title").in("id", problemIds),
  ])

  const nameByStudent = new Map<string, string>()
  for (const row of profileRows ?? []) {
    if (!isObject(row)) continue
    const userIdKey = asString(row.user_id)
    if (!userIdKey) continue
    const nickname = asString(row.nickname).trim()
    const name = asString(row.name).trim()
    nameByStudent.set(userIdKey, nickname || name || "Elev")
  }

  const titleByProblem = new Map<string, string>()
  for (const row of problemRows ?? []) {
    if (!isObject(row)) continue
    titleByProblem.set(asString(row.id), asString(row.title, "Problemă"))
  }

  const items: TeacherPendingHomeworkReview[] = pendingSubmissions
    .map((row) => {
      const submissionId = asString(row.id)
      const assignmentId = asString(row.assignment_id)
      const assignment = assignmentById.get(assignmentId)
      if (!submissionId || !assignment) return null

      return {
        submission_id: submissionId,
        classroom_id: assignment.classroom_id,
        classroom_name: classroomNameById.get(assignment.classroom_id) ?? "Clasă",
        assignment_id: assignmentId,
        assignment_title: assignment.title,
        student_name: nameByStudent.get(asString(row.student_id)) ?? "Elev",
        problem_title: titleByProblem.get(asString(row.problem_id)) ?? "Problemă",
        submitted_at: asString(row.submitted_at),
        photo_count: photoCountBySubmission.get(submissionId) ?? 0,
        photo_urls: [] as string[],
        teacher_comment: asNullableString(row.teacher_comment),
      }
    })
    .filter((item): item is TeacherPendingHomeworkReview => item !== null)
    .sort((left, right) => right.submitted_at.localeCompare(left.submitted_at))

  const sliced = items.slice(0, PENDING_HOMEWORK_LIST_LIMIT)
  const bucket = admin.storage.from("assignment-teacher-attachments")
  for (const item of sliced) {
    const paths = photoPathsBySubmission.get(item.submission_id) ?? []
    const signedUrls: string[] = []
    for (const path of paths.slice(0, 6)) {
      const { data: signed } = await bucket.createSignedUrl(path, 60 * 60)
      if (signed?.signedUrl) signedUrls.push(signed.signedUrl)
    }
    item.photo_urls = signedUrls
  }

  return {
    items: sliced,
    total_count: items.length,
  }
}

export interface TeacherPendingTestReview {
  assignment_id: string
  classroom_id: string
  classroom_name: string
  title: string
  status: "draft" | "published" | "closed"
  submitted_count: number
  student_count: number
  unreviewed_count: number
  created_at: string
}

export async function getTeacherPendingTests(userId: string): Promise<TeacherPendingTestReview[]> {
  const classrooms = (await getClassroomsForUser(userId)).filter((classroom) => classroom.role === "teacher")
  if (classrooms.length === 0) return []

  const admin = createAdminClient()
  const classroomIds = classrooms.map((classroom) => classroom.id)
  const classroomNameById = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]))
  const studentCountByClassroom = new Map(classrooms.map((classroom) => [classroom.id, classroom.student_count]))

  const { data: testRows } = await admin
    .from("assignments")
    .select("id, classroom_id, title, status, created_at")
    .in("classroom_id", classroomIds)
    .eq("kind", "test")
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(20)

  const tests = (testRows ?? []).filter(isObject)
  if (tests.length === 0) return []

  const assignmentIds = tests.map((row) => asString(row.id)).filter(Boolean)
  const { data: submissionRows } = await admin
    .from("submissions")
    .select("assignment_id, student_id, reviewed_at")
    .in("assignment_id", assignmentIds)

  const submittedByAssignment = new Map<string, Set<string>>()
  const unreviewedByAssignment = new Map<string, number>()
  for (const row of submissionRows ?? []) {
    if (!isObject(row)) continue
    const assignmentId = asString(row.assignment_id)
    const studentId = asString(row.student_id)
    if (!assignmentId || !studentId) continue
    const submitted = submittedByAssignment.get(assignmentId) ?? new Set<string>()
    submitted.add(studentId)
    submittedByAssignment.set(assignmentId, submitted)
    if (!asNullableString(row.reviewed_at)) {
      unreviewedByAssignment.set(assignmentId, (unreviewedByAssignment.get(assignmentId) ?? 0) + 1)
    }
  }

  return tests.map((row) => {
    const id = asString(row.id)
    const classroomId = asString(row.classroom_id)
    return {
      assignment_id: id,
      classroom_id: classroomId,
      classroom_name: classroomNameById.get(classroomId) ?? "Clasă",
      title: asString(row.title, "Test"),
      status: asString(row.status) === "closed" ? "closed" : "published",
      submitted_count: submittedByAssignment.get(id)?.size ?? 0,
      student_count: studentCountByClassroom.get(classroomId) ?? 0,
      unreviewed_count: unreviewedByAssignment.get(id) ?? 0,
      created_at: asString(row.created_at),
    }
  })
}

export async function markSubmissionReviewed(
  teacherId: string,
  submissionId: string,
  comment?: string,
): Promise<void> {
  const admin = createAdminClient()

  const { data: submissionRow } = await admin
    .from("submissions")
    .select("id, assignment_id")
    .eq("id", submissionId)
    .maybeSingle()

  if (!isObject(submissionRow)) {
    throw new Error("SUBMISSION_NOT_FOUND")
  }

  const assignmentId = asString(submissionRow.assignment_id)
  const { data: assignmentRow } = await admin
    .from("assignments")
    .select("classroom_id")
    .eq("id", assignmentId)
    .maybeSingle()

  if (!isObject(assignmentRow)) {
    throw new Error("ASSIGNMENT_NOT_FOUND")
  }

  const classroomId = asString(assignmentRow.classroom_id)
  const { data: classroomRow } = await admin
    .from("classrooms")
    .select("teacher_id")
    .eq("id", classroomId)
    .maybeSingle()

  const isOwner = isObject(classroomRow) && asString(classroomRow.teacher_id) === teacherId
  if (!isOwner) {
    const { data: membership } = await admin
      .from("classroom_members")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("user_id", teacherId)
      .eq("role", "teacher")
      .maybeSingle()
    if (!membership) {
      throw new Error("FORBIDDEN")
    }
  }

  const payload: {
    reviewed_at: string
    reviewed_by: string
    teacher_comment?: string
  } = {
    reviewed_at: new Date().toISOString(),
    reviewed_by: teacherId,
  }
  const trimmedComment = comment?.trim()
  if (trimmedComment) {
    payload.teacher_comment = trimmedComment
  }

  const { error } = await admin
    .from("submissions")
    .update(payload)
    .eq("id", submissionId)

  if (error) {
    throw new Error("UPDATE_FAILED")
  }
}

export interface TeacherStudentProfileSnapshot {
  user_id: string
  display_name: string
  username: string | null
  user_icon: string | null
  school_grade: string | null
  classroom_name: string
  estimated_grade: number
  stats: {
    elo: number
    rank: string
    current_streak: number
    problems_solved_total: number
    total_time_minutes: number
    last_activity_date: string | null
  }
}

export async function getTeacherStudentProfilesForClassroom(
  teacherId: string,
  classroomId: string,
): Promise<TeacherStudentProfileSnapshot[]> {
  const admin = createAdminClient()

  const { data: classroomRow } = await admin
    .from("classrooms")
    .select("id, name, teacher_id")
    .eq("id", classroomId)
    .maybeSingle()

  const isOwner = isObject(classroomRow) && asString(classroomRow.teacher_id) === teacherId
  if (!isObject(classroomRow)) {
    return []
  }
  if (!isOwner) {
    const { data: membership } = await admin
      .from("classroom_members")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("user_id", teacherId)
      .eq("role", "teacher")
      .maybeSingle()
    if (!membership) return []
  }

  const classroomName = asString(classroomRow.name, "Clasă")
  const members = await getClassroomMembers(classroomId)
  const students = members.filter((member) => member.role === "student")

  if (students.length === 0) return []

  const studentIds = students.map((student) => student.user_id)

  const [{ data: profileRows }, { data: statsRows }] = await Promise.all([
    admin
      .from("profiles")
      .select("user_id, name, nickname, user_icon, grade")
      .in("user_id", studentIds),
    admin
      .from("user_stats")
      .select(
        "user_id, elo, rank, current_streak, problems_solved_total, total_time_minutes, last_activity_date",
      )
      .in("user_id", studentIds),
  ])

  const profileByUserId = new Map<
    string,
    { name: string; nickname: string; user_icon: string | null; grade: string | null }
  >()
  for (const row of profileRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    if (!userId) continue
    const rawIcon = asNullableString(row.user_icon)
    profileByUserId.set(userId, {
      name: asString(row.name),
      nickname: asString(row.nickname),
      user_icon: rawIcon && rawIcon.trim() ? rawIcon.trim() : null,
      grade: asNullableString(row.grade),
    })
  }

  const statsByUserId = new Map<string, Record<string, unknown>>()
  for (const row of statsRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    if (!userId) continue
    statsByUserId.set(userId, row)
  }

  return students.map((student) => {
    const profile = profileByUserId.get(student.user_id)
    const stats = statsByUserId.get(student.user_id)
    const elo = asNumber(stats?.elo, student.elo)
    const nickname = profile?.nickname.trim() || null
    const name = profile?.name.trim() || student.name

    return {
      user_id: student.user_id,
      display_name: nickname || name || "Elev",
      username: nickname,
      user_icon: profile?.user_icon ?? student.user_icon,
      school_grade: profile?.grade ?? null,
      classroom_name: classroomName,
      estimated_grade: estimateGradeFromElo(elo),
      stats: {
        elo,
        rank: asString(stats?.rank, student.rank),
        current_streak: asNumber(stats?.current_streak),
        problems_solved_total: asNumber(stats?.problems_solved_total),
        total_time_minutes: asNumber(stats?.total_time_minutes),
        last_activity_date: asNullableString(stats?.last_activity_date),
      },
    }
  })
}
