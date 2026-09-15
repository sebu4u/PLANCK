"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { classroomCoverPublicPath, listClassroomCoverFilenames } from "@/lib/classrooms/cover-images"
import {
  isAttendanceStatus,
  isClassroomGradeLevel,
  isClassroomSubject,
  isLatePolicy,
} from "@/lib/classrooms/constants"
import { notifyClassroomStudents } from "@/lib/classrooms/in-app-notifications"
import { lookupUserIdsByEmails } from "@/lib/classrooms/extra-server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { normalizeUserType } from "@/lib/user-types"

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateJoinCode(length = 6): string {
  let result = ""
  for (let index = 0; index < length; index += 1) {
    result += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)]
  }
  return result
}

async function getAuth() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect("/")
  return { user, admin: createAdminClient() }
}

async function assertTeacher(admin: ReturnType<typeof createAdminClient>, userId: string, classroomId: string) {
  const { data: membership } = await admin
    .from("classroom_members")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("user_id", userId)
    .eq("role", "teacher")
    .maybeSingle()
  if (membership) return
  const { data: classroom } = await admin
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("teacher_id", userId)
    .maybeSingle()
  if (!classroom) redirect(`/classrooms/${classroomId}?error=teacher_only`)
}

async function assertOwner(admin: ReturnType<typeof createAdminClient>, userId: string, classroomId: string) {
  const { data: classroom } = await admin
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("teacher_id", userId)
    .maybeSingle()
  if (!classroom) redirect(`/classrooms/${classroomId}/setari?error=owner_only`)
}

function revalidateClassroom(classroomId: string) {
  revalidatePath("/classrooms")
  revalidatePath(`/classrooms/${classroomId}`)
  revalidatePath(`/classrooms/${classroomId}/assignments`)
  revalidatePath(`/classrooms/${classroomId}/students`)
  revalidatePath(`/classrooms/${classroomId}/setari`)
  revalidatePath(`/classrooms/${classroomId}/ora`)
  revalidatePath("/profesor/teme")
  revalidatePath("/dashboard/teacher")
}

export async function updateClassroomSettingsAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  await assertTeacher(admin, user.id, classroomId)

  const name = getStringValue(formData, "name")
  const coverFilename = getStringValue(formData, "cover_image")
  const subjectRaw = getStringValue(formData, "subject")
  const gradeRaw = getStringValue(formData, "grade_level")
  const sectionRaw = getStringValue(formData, "section").toUpperCase()
  const schoolYear = getStringValue(formData, "school_year")
  const joinLocked = getStringValue(formData, "join_locked") === "on"
  const schoolId = getStringValue(formData, "school_id")

  if (!name) redirect(`/classrooms/${classroomId}/setari?error=name_required`)

  const patch: Record<string, unknown> = {
    name,
    subject: isClassroomSubject(subjectRaw) ? subjectRaw : null,
    grade_level: isClassroomGradeLevel(gradeRaw) ? gradeRaw : null,
    section: /^[A-Z]$/.test(sectionRaw) ? sectionRaw : null,
    school_year: schoolYear || null,
    join_locked: joinLocked,
    school_id: schoolId || null,
  }

  if (coverFilename) {
    const allowed = await listClassroomCoverFilenames()
    if (allowed.includes(coverFilename)) {
      patch.cover_image = classroomCoverPublicPath(coverFilename)
    }
  }

  const { error } = await admin.from("classrooms").update(patch).eq("id", classroomId)
  if (error) {
    console.error("updateClassroomSettingsAction", error)
    redirect(`/classrooms/${classroomId}/setari?error=update_failed`)
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/setari?saved=1`)
}

export async function archiveClassroomAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  await assertOwner(admin, user.id, classroomId)
  const archived = getStringValue(formData, "archived") === "1"
  await admin
    .from("classrooms")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", classroomId)
  revalidateClassroom(classroomId)
  redirect(archived ? "/classrooms?archived=1" : `/classrooms/${classroomId}/setari?saved=1`)
}

export async function regenerateJoinCodeAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  await assertOwner(admin, user.id, classroomId)

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const joinCode = generateJoinCode(6)
    const { error } = await admin.from("classrooms").update({ join_code: joinCode }).eq("id", classroomId)
    if (!error) {
      revalidateClassroom(classroomId)
      redirect(`/classrooms/${classroomId}/setari?saved=1`)
    }
    if (error.code !== "23505") {
      redirect(`/classrooms/${classroomId}/setari?error=update_failed`)
    }
  }
  redirect(`/classrooms/${classroomId}/setari?error=join_code_conflict`)
}

export async function deleteAnnouncementAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const announcementId = getStringValue(formData, "announcement_id")
  await assertTeacher(admin, user.id, classroomId)
  await admin.from("announcements").delete().eq("id", announcementId).eq("classroom_id", classroomId)
  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}`)
}

export async function updateAnnouncementAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const announcementId = getStringValue(formData, "announcement_id")
  const content = getStringValue(formData, "content")
  await assertTeacher(admin, user.id, classroomId)
  await admin
    .from("announcements")
    .update({ content: content || null })
    .eq("id", announcementId)
    .eq("classroom_id", classroomId)
  revalidatePath(`/classrooms/${classroomId}`)
  redirect(`/classrooms/${classroomId}?saved=1`)
}

export async function togglePinAnnouncementAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const announcementId = getStringValue(formData, "announcement_id")
  const pinned = getStringValue(formData, "pinned") === "1"
  await assertTeacher(admin, user.id, classroomId)
  await admin
    .from("announcements")
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq("id", announcementId)
    .eq("classroom_id", classroomId)
  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}`)
}

export async function updateAssignmentAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  await assertTeacher(admin, user.id, classroomId)

  const title = getStringValue(formData, "title")
  const description = getStringValue(formData, "description")
  const deadline = getStringValue(formData, "deadline")
  const latePolicyRaw = getStringValue(formData, "late_policy")
  if (!title) redirect(`/classrooms/${classroomId}/assignments/${assignmentId}?error=title_required`)

  await admin
    .from("assignments")
    .update({
      title,
      description,
      deadline: deadline || null,
      late_policy: isLatePolicy(latePolicyRaw) ? latePolicyRaw : "accept",
    })
    .eq("id", assignmentId)
    .eq("classroom_id", classroomId)

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/assignments/${assignmentId}?saved=1`)
}

export async function setAssignmentStatusAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  const status = getStringValue(formData, "status")
  await assertTeacher(admin, user.id, classroomId)
  if (status !== "draft" && status !== "published" && status !== "closed") {
    redirect(`/classrooms/${classroomId}/assignments/${assignmentId}?error=invalid_status`)
  }

  await admin.from("assignments").update({ status }).eq("id", assignmentId).eq("classroom_id", classroomId)

  if (status === "closed") {
    const { data: assignment } = await admin.from("assignments").select("title, closed_notified_at").eq("id", assignmentId).maybeSingle()
    if (assignment && !assignment.closed_notified_at) {
      try {
        await notifyClassroomStudents({
          classroomId,
          type: "classroom_assignment_closed",
          title: "Temă închisă",
          body: assignment.title ?? "Tema a fost închisă.",
          href: `/classrooms/${classroomId}/assignments/${assignmentId}`,
          assignmentId,
        })
      } catch (error) {
        console.error("setAssignmentStatusAction notify", error)
      }
      await admin.from("assignments").update({ closed_notified_at: new Date().toISOString() }).eq("id", assignmentId)
    }
  }

  if (status === "published") {
    const { data: assignment } = await admin.from("assignments").select("title, kind").eq("id", assignmentId).maybeSingle()
    try {
      await notifyClassroomStudents({
        classroomId,
        type: "classroom_assignment",
        title: assignment?.kind === "test" ? "Test nou" : "Temă nouă",
        body: assignment?.title ?? "A fost publicată o temă.",
        href: `/classrooms/${classroomId}/assignments/${assignmentId}`,
        assignmentId,
      })
    } catch (error) {
      console.error("setAssignmentStatusAction publish notify", error)
    }
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/assignments/${assignmentId}`)
}

export async function deleteAssignmentAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  await assertTeacher(admin, user.id, classroomId)
  await admin.from("assignments").delete().eq("id", assignmentId).eq("classroom_id", classroomId)
  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/assignments`)
}

export async function duplicateAssignmentAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  const targetClassroomId = getStringValue(formData, "target_classroom_id") || classroomId
  await assertTeacher(admin, user.id, classroomId)
  await assertTeacher(admin, user.id, targetClassroomId)

  const { data: source } = await admin.from("assignments").select("*").eq("id", assignmentId).maybeSingle()
  if (!source) redirect(`/classrooms/${classroomId}/assignments?error=assignment_not_found`)

  const { data: problems } = await admin.from("assignment_problems").select("problem_id").eq("assignment_id", assignmentId)

  const { data: copy, error } = await admin
    .from("assignments")
    .insert({
      classroom_id: targetClassroomId,
      title: `${source.title} (copie)`,
      description: source.description ?? "",
      deadline: source.deadline,
      status: "draft",
      kind: source.kind ?? "homework",
      late_policy: source.late_policy ?? "accept",
      window_start: source.window_start,
      window_end: source.window_end,
      time_limit_minutes: source.time_limit_minutes,
      shuffle_options: Boolean(source.shuffle_options),
      allow_catalog_sync: source.allow_catalog_sync !== false,
      source_assignment_id: assignmentId,
    })
    .select("id")
    .single()

  if (error || !copy) {
    console.error("duplicateAssignmentAction", error)
    redirect(`/classrooms/${classroomId}/assignments/${assignmentId}?error=duplicate_failed`)
  }

  if (problems && problems.length > 0) {
    await admin.from("assignment_problems").insert(
      problems.map((row: { problem_id: string }) => ({
        assignment_id: copy.id,
        problem_id: row.problem_id,
      })),
    )
  }

  revalidateClassroom(targetClassroomId)
  redirect(`/classrooms/${targetClassroomId}/assignments/${copy.id}`)
}

export async function updateSubmissionFeedbackAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  const submissionId = getStringValue(formData, "submission_id")
  const comment = getStringValue(formData, "teacher_comment")
  const gradeRaw = getStringValue(formData, "teacher_grade")
  await assertTeacher(admin, user.id, classroomId)

  const grade = gradeRaw ? Number(gradeRaw.replace(",", ".")) : NaN
  await admin
    .from("submissions")
    .update({
      teacher_comment: comment || null,
      teacher_grade: Number.isFinite(grade) ? Math.min(10, Math.max(1, Math.round(grade * 10) / 10)) : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", submissionId)

  revalidatePath(`/classrooms/${classroomId}/assignments/${assignmentId}`)
  revalidatePath("/dashboard/teacher")
  redirect(`/classrooms/${classroomId}/assignments/${assignmentId}?saved=1`)
}

export async function remindIncompleteStudentsAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  await assertTeacher(admin, user.id, classroomId)

  const { data: assignment } = await admin.from("assignments").select("title").eq("id", assignmentId).maybeSingle()
  const { data: members } = await admin
    .from("classroom_members")
    .select("user_id")
    .eq("classroom_id", classroomId)
    .eq("role", "student")
  const { data: submissions } = await admin.from("submissions").select("student_id").eq("assignment_id", assignmentId)
  const submitted = new Set((submissions ?? []).map((row) => row.student_id as string))
  const missing = (members ?? []).map((row) => row.user_id as string).filter((id) => !submitted.has(id))

  if (missing.length > 0) {
    const now = new Date().toISOString()
    await admin.from("user_in_app_notifications").insert(
      missing.map((userId) => ({
        user_id: userId,
        type: "classroom_assignment_reminder",
        title: "Temă nerezolvată",
        body: assignment?.title ?? "Ai o temă de predat.",
        href: `/classrooms/${classroomId}/assignments/${assignmentId}`,
        classroom_id: classroomId,
        assignment_id: assignmentId,
        created_at: now,
      })),
    )
  }

  redirect(`/classrooms/${classroomId}/assignments/${assignmentId}?reminded=1`)
}

export async function inviteClassroomMemberAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const email = getStringValue(formData, "email").toLowerCase()
  const role = getStringValue(formData, "role") === "teacher" ? "teacher" : "student"
  const fullName = getStringValue(formData, "full_name")
  await assertTeacher(admin, user.id, classroomId)
  if (role === "teacher") await assertOwner(admin, user.id, classroomId)

  if (!email || !email.includes("@")) {
    redirect(`/classrooms/${classroomId}/students?error=invalid_email`)
  }

  if (role === "teacher") {
    const matches = await lookupUserIdsByEmails(admin, [email])
    const match = matches[0]
    if (match) {
      const { data: profile } = await admin.from("profiles").select("user_type").eq("user_id", match.user_id).maybeSingle()
      if (normalizeUserType(profile?.user_type) !== "profesor") {
        redirect(`/classrooms/${classroomId}/students?error=not_a_teacher`)
      }
      await admin.from("classroom_members").insert({
        classroom_id: classroomId,
        user_id: match.user_id,
        role: "teacher",
      })
      await admin.from("classroom_invites").upsert(
        {
          classroom_id: classroomId,
          email,
          full_name: fullName || null,
          role: "teacher",
          invited_by: user.id,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "classroom_id,email,role" },
      )
      revalidateClassroom(classroomId)
      redirect(`/classrooms/${classroomId}/students?invited=1`)
    }
  }

  await admin.from("classroom_invites").upsert(
    {
      classroom_id: classroomId,
      email,
      full_name: fullName || null,
      role,
      invited_by: user.id,
      accepted_at: null,
    },
    { onConflict: "classroom_id,email,role" },
  )

  const matches = await lookupUserIdsByEmails(admin, [email])
  const match = matches[0]
  if (match && role === "student") {
    await admin.from("classroom_members").insert({
      classroom_id: classroomId,
      user_id: match.user_id,
      role: "student",
    })
    await admin
      .from("classroom_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("classroom_id", classroomId)
      .eq("email", email)
      .eq("role", "student")
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/students?invited=1`)
}

export async function importClassroomStudentsCsvAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  await assertTeacher(admin, user.id, classroomId)
  const csv = getStringValue(formData, "csv")
  if (!csv) redirect(`/classrooms/${classroomId}/students?error=csv_required`)

  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, second] = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""))
      if (first?.includes("@")) return { email: first.toLowerCase(), fullName: second || null }
      if (second?.includes("@")) return { email: second.toLowerCase(), fullName: first || null }
      return null
    })
    .filter((row): row is { email: string; fullName: string | null } => Boolean(row?.email))

  const emails = rows.map((row) => row.email)
  const matches = await lookupUserIdsByEmails(admin, emails)
  const userByEmail = new Map(matches.map((row) => [row.email, row.user_id]))

  for (const row of rows) {
    const existingUserId = userByEmail.get(row.email)
    if (existingUserId) {
      await admin.from("classroom_members").upsert(
        {
          classroom_id: classroomId,
          user_id: existingUserId,
          role: "student",
        },
        { onConflict: "classroom_id,user_id" },
      )
      await admin.from("classroom_invites").upsert(
        {
          classroom_id: classroomId,
          email: row.email,
          full_name: row.fullName,
          role: "student",
          invited_by: user.id,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "classroom_id,email,role" },
      )
    } else {
      await admin.from("classroom_invites").upsert(
        {
          classroom_id: classroomId,
          email: row.email,
          full_name: row.fullName,
          role: "student",
          invited_by: user.id,
          accepted_at: null,
        },
        { onConflict: "classroom_id,email,role" },
      )
    }
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/students?imported=${rows.length}`)
}

export async function startClassroomSessionAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id") || null
  await assertTeacher(admin, user.id, classroomId)

  await admin
    .from("classroom_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("classroom_id", classroomId)
    .eq("status", "active")

  const { data: session, error } = await admin
    .from("classroom_sessions")
    .insert({
      classroom_id: classroomId,
      started_by: user.id,
      assignment_id: assignmentId,
      status: "active",
    })
    .select("id")
    .single()

  if (error || !session) {
    console.error("startClassroomSessionAction", error)
    redirect(`/classrooms/${classroomId}?error=session_failed`)
  }

  const { data: students } = await admin
    .from("classroom_members")
    .select("user_id")
    .eq("classroom_id", classroomId)
    .eq("role", "student")

  if (students && students.length > 0) {
    await admin.from("classroom_session_attendance").insert(
      students.map((row) => ({
        session_id: session.id,
        student_id: row.user_id,
        status: "absent",
        marked_by: user.id,
      })),
    )
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/ora`)
}

export async function endClassroomSessionAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const sessionId = getStringValue(formData, "session_id")
  const freezeAssignment = getStringValue(formData, "freeze") === "1"
  await assertTeacher(admin, user.id, classroomId)

  const { data: session } = await admin
    .from("classroom_sessions")
    .select("assignment_id, exit_ticket_assignment_id")
    .eq("id", sessionId)
    .maybeSingle()

  await admin
    .from("classroom_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("classroom_id", classroomId)

  if (freezeAssignment && session?.assignment_id) {
    await admin.from("assignments").update({ status: "closed" }).eq("id", session.assignment_id)
  }
  if (freezeAssignment && session?.exit_ticket_assignment_id) {
    await admin.from("assignments").update({ status: "closed" }).eq("id", session.exit_ticket_assignment_id)
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/ora?ended=1`)
}

export async function setSessionCurrentProblemAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const sessionId = getStringValue(formData, "session_id")
  const problemId = getStringValue(formData, "problem_id") || null
  await assertTeacher(admin, user.id, classroomId)
  await admin.from("classroom_sessions").update({ current_problem_id: problemId }).eq("id", sessionId)
  revalidatePath(`/classrooms/${classroomId}/ora`)
  revalidatePath(`/classrooms/${classroomId}/ora/proiector`)
}

export async function markAttendanceAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const sessionId = getStringValue(formData, "session_id")
  const studentId = getStringValue(formData, "student_id")
  const statusRaw = getStringValue(formData, "status")
  await assertTeacher(admin, user.id, classroomId)
  const status = isAttendanceStatus(statusRaw) ? statusRaw : "present"
  await admin.from("classroom_session_attendance").upsert(
    {
      session_id: sessionId,
      student_id: studentId,
      status,
      marked_at: new Date().toISOString(),
      marked_by: user.id,
    },
    { onConflict: "session_id,student_id" },
  )
  revalidatePath(`/classrooms/${classroomId}/ora`)
}

export async function createExitTicketAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const sessionId = getStringValue(formData, "session_id")
  const problemIds = formData
    .getAll("problem_ids")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean)
    .slice(0, 3)
  await assertTeacher(admin, user.id, classroomId)
  if (problemIds.length === 0) {
    redirect(`/classrooms/${classroomId}/ora?error=exit_ticket_problems`)
  }

  const windowEnd = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const { data: assignment, error } = await admin
    .from("assignments")
    .insert({
      classroom_id: classroomId,
      title: "Exit ticket",
      description: "5 minute la final de oră.",
      status: "published",
      kind: "test",
      late_policy: "block",
      window_start: new Date().toISOString(),
      window_end: windowEnd,
      time_limit_minutes: 5,
      shuffle_options: true,
      allow_catalog_sync: false,
    })
    .select("id")
    .single()

  if (error || !assignment) {
    console.error("createExitTicketAction", error)
    redirect(`/classrooms/${classroomId}/ora?error=exit_ticket_failed`)
  }

  await admin.from("assignment_problems").insert(
    problemIds.map((problemId) => ({ assignment_id: assignment.id, problem_id: problemId })),
  )
  await admin.from("classroom_sessions").update({ exit_ticket_assignment_id: assignment.id }).eq("id", sessionId)

  try {
    await notifyClassroomStudents({
      classroomId,
      type: "classroom_assignment",
      title: "Exit ticket",
      body: "Ai 5 minute pentru bilețelul de ieșire.",
      href: `/classrooms/${classroomId}/assignments/${assignment.id}`,
      assignmentId: assignment.id,
    })
  } catch (notifyError) {
    console.error("createExitTicketAction notify", notifyError)
  }

  revalidateClassroom(classroomId)
  redirect(`/classrooms/${classroomId}/ora`)
}

export async function markStudentPresentOnOpenAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const sessionId = getStringValue(formData, "session_id")
  const { data: membership } = await admin
    .from("classroom_members")
    .select("role")
    .eq("classroom_id", classroomId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership || membership.role !== "student") return
  await admin.from("classroom_session_attendance").upsert(
    {
      session_id: sessionId,
      student_id: user.id,
      status: "present",
      marked_at: new Date().toISOString(),
    },
    { onConflict: "session_id,student_id" },
  )
}

export async function startAssignmentAttemptAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const assignmentId = getStringValue(formData, "assignment_id")
  if (!assignmentId) return
  await admin.from("assignment_starts").upsert(
    {
      assignment_id: assignmentId,
      student_id: user.id,
      started_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id", ignoreDuplicates: true },
  )
}

export async function sendParentMessageAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const classroomId = getStringValue(formData, "classroom_id")
  const studentId = getStringValue(formData, "student_id") || null
  const body = getStringValue(formData, "body")
  await assertTeacher(admin, user.id, classroomId)
  if (!body) redirect(`/classrooms/${classroomId}/students?error=message_required`)

  const { data: message, error } = await admin
    .from("classroom_parent_messages")
    .insert({
      classroom_id: classroomId,
      author_id: user.id,
      student_id: studentId,
      body,
    })
    .select("id")
    .single()

  if (error || !message) {
    console.error("sendParentMessageAction", error)
    redirect(`/classrooms/${classroomId}/students?error=message_failed`)
  }

  const { data: students } = await admin
    .from("classroom_members")
    .select("user_id")
    .eq("classroom_id", classroomId)
    .eq("role", "student")
  const childIds = studentId ? [studentId] : (students ?? []).map((row) => row.user_id as string)
  if (childIds.length > 0) {
    const { data: parents } = await admin
      .from("parent_child_relationships")
      .select("parent_id")
      .in("child_id", childIds)
      .eq("status", "active")
    const parentIds = Array.from(new Set((parents ?? []).map((row) => row.parent_id as string)))
    if (parentIds.length > 0) {
      const now = new Date().toISOString()
      await admin.from("user_in_app_notifications").insert(
        parentIds.map((parentId) => ({
          user_id: parentId,
          type: "classroom_parent_message",
          title: "Mesaj de la profesor",
          body: body.slice(0, 160),
          href: "/dashboard/parent/mesaje",
          classroom_id: classroomId,
          created_at: now,
        })),
      )
    }
  }

  revalidatePath(`/classrooms/${classroomId}/students`)
  redirect(`/classrooms/${classroomId}/students?message_sent=1`)
}

export async function createSchoolAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const { data: profile } = await admin.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle()
  if (normalizeUserType(profile?.user_type) !== "profesor") redirect("/dashboard")
  const name = getStringValue(formData, "name")
  if (!name) redirect("/profesor/scoala?error=name_required")

  const { data: school, error } = await admin.from("schools").insert({ name, created_by: user.id }).select("id").single()
  if (error || !school) {
    console.error("createSchoolAction", error)
    redirect("/profesor/scoala?error=create_failed")
  }
  await admin.from("school_members").insert({ school_id: school.id, user_id: user.id, role: "admin" })
  revalidatePath("/profesor/scoala")
  redirect("/profesor/scoala?saved=1")
}

export async function inviteSchoolTeacherAction(formData: FormData) {
  const { user, admin } = await getAuth()
  const schoolId = getStringValue(formData, "school_id")
  const email = getStringValue(formData, "email").toLowerCase()
  const { data: membership } = await admin
    .from("school_members")
    .select("role")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (membership?.role !== "admin") redirect("/profesor/scoala?error=admin_only")
  if (!email.includes("@")) redirect("/profesor/scoala?error=invalid_email")

  const matches = await lookupUserIdsByEmails(admin, [email])
  const match = matches[0]
  if (!match) redirect("/profesor/scoala?error=user_not_found")
  await admin.from("school_members").upsert(
    { school_id: schoolId, user_id: match.user_id, role: "teacher" },
    { onConflict: "school_id,user_id" },
  )
  revalidatePath("/profesor/scoala")
  redirect("/profesor/scoala?saved=1")
}
