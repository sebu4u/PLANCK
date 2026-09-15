"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  classroomAnnouncementNotificationCopy,
  notifyClassroomStudents,
} from "@/lib/classrooms/in-app-notifications"
import { classroomCoverPublicPath, listClassroomCoverFilenames } from "@/lib/classrooms/cover-images"
import {
  currentSchoolYear,
  isAssignmentKind,
  isAssignmentStatus,
  isClassroomGradeLevel,
  isClassroomSubject,
  isLatePolicy,
} from "@/lib/classrooms/constants"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { normalizeUserType } from "@/lib/user-types"

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function parseJsonArrayAnswer(raw: string): number[] | null {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const numbers = parsed.map((value) => Number(value))
    return numbers.every((value) => Number.isFinite(value)) ? numbers : null
  } catch {
    return null
  }
}

function isWithinTolerance(userValue: number, correctValue: number): boolean {
  if (correctValue === 0) {
    return Math.abs(userValue) <= 0.001
  }

  const tolerance = Math.abs(correctValue) * 0.05
  return Math.abs(userValue - correctValue) <= tolerance
}

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function toSafeStorageName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const TEACHER_SUBMISSION_PHOTO_BUCKET = "assignment-teacher-attachments"
const TEACHER_SUBMISSION_PHOTO_LIMIT = 5
const TEACHER_SUBMISSION_PHOTO_MAX_BYTES = 5 * 1024 * 1024
const TEACHER_SUBMISSION_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

function collectTeacherSubmissionPhotos(formData: FormData): File[] {
  return formData
    .getAll("teacher_photos")
    .filter((item): item is File => item instanceof File && item.size > 0)
}

function validateTeacherSubmissionPhotos(files: File[]): "too_many" | "too_large" | "bad_type" | null {
  if (files.length > TEACHER_SUBMISSION_PHOTO_LIMIT) {
    return "too_many"
  }
  for (const file of files) {
    if (file.size > TEACHER_SUBMISSION_PHOTO_MAX_BYTES) {
      return "too_large"
    }
    if (!TEACHER_SUBMISSION_PHOTO_TYPES.has(file.type)) {
      return "bad_type"
    }
  }
  return null
}

async function replaceTeacherOnlySubmissionPhotos(
  supabase: SupabaseClient,
  params: {
    submissionId: string
    classroomId: string
    studentId: string
    assignmentId: string
    problemId: string
    photos: File[]
  }
): Promise<{ ok: true } | { ok: false }> {
  const { submissionId, classroomId, studentId, assignmentId, problemId, photos } = params

  if (photos.length === 0) {
    return { ok: true }
  }

  const { data: existing } = await supabase
    .from("submission_teacher_attachments")
    .select("id, storage_path")
    .eq("submission_id", submissionId)

  if (existing && existing.length > 0) {
    const paths = existing
      .map((row) => (typeof row.storage_path === "string" ? row.storage_path : ""))
      .filter(Boolean)
    await supabase.from("submission_teacher_attachments").delete().eq("submission_id", submissionId)
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from(TEACHER_SUBMISSION_PHOTO_BUCKET).remove(paths)
      if (removeError) {
        console.error("replaceTeacherOnlySubmissionPhotos remove old:", removeError)
      }
    }
  }

  const uploadedPaths: string[] = []

  try {
    for (let index = 0; index < photos.length; index += 1) {
      const file = photos[index]
      const ext = file.name.split(".").pop() ?? "jpg"
      const safeBase = toSafeStorageName(file.name.replace(`.${ext}`, "")) || "poza"
      const objectPath = `${classroomId}/${studentId}/${assignmentId}/${problemId}/${Date.now()}-${index}-${safeBase}.${ext}`

      const { error: uploadError } = await supabase.storage.from(TEACHER_SUBMISSION_PHOTO_BUCKET).upload(objectPath, file, {
        upsert: false,
        contentType: file.type || undefined,
      })

      if (uploadError) {
        console.error("replaceTeacherOnlySubmissionPhotos upload:", uploadError)
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(TEACHER_SUBMISSION_PHOTO_BUCKET).remove(uploadedPaths)
        }
        return { ok: false }
      }

      uploadedPaths.push(objectPath)
    }

    const rows = uploadedPaths.map((storage_path) => ({
      submission_id: submissionId,
      storage_path,
    }))

    const { error: insertError } = await supabase.from("submission_teacher_attachments").insert(rows)
    if (insertError) {
      console.error("replaceTeacherOnlySubmissionPhotos insert:", insertError)
      await supabase.storage.from(TEACHER_SUBMISSION_PHOTO_BUCKET).remove(uploadedPaths)
      return { ok: false }
    }
  } catch (error) {
    console.error("replaceTeacherOnlySubmissionPhotos:", error)
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(TEACHER_SUBMISSION_PHOTO_BUCKET).remove(uploadedPaths)
    }
    return { ok: false }
  }

  return { ok: true }
}

function generateJoinCode(length = 6): string {
  let result = ""
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)
    result += JOIN_CODE_ALPHABET[randomIndex]
  }
  return result
}

async function getAuthenticatedUserOrRedirect() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const supabase = createAdminClient()
  return { supabase, user }
}

async function assertTeacherAccess(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  classroomId: string
) {
  const { data: membership } = await supabase
    .from("classroom_members")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("user_id", userId)
    .eq("role", "teacher")
    .maybeSingle()

  if (membership) return

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("teacher_id", userId)
    .maybeSingle()

  if (!classroom) {
    redirect(`/classrooms/${classroomId}?error=teacher_only`)
  }
}

async function requireProfesorOrRedirect(userId: string, fallback = "/classrooms") {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("user_id", userId)
    .maybeSingle()
  if (normalizeUserType(profile?.user_type) !== "profesor") {
    redirect(`${fallback}?error=teacher_account_required`)
  }
}

export async function createClassroomAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  await requireProfesorOrRedirect(user.id, "/classrooms/new")
  const classroomName = getStringValue(formData, "name")
  const coverFilename = getStringValue(formData, "cover_image")
  const subjectRaw = getStringValue(formData, "subject")
  const gradeRaw = getStringValue(formData, "grade_level")
  const sectionRaw = getStringValue(formData, "section").toUpperCase()
  const schoolYear = getStringValue(formData, "school_year") || currentSchoolYear()

  if (!classroomName) {
    redirect("/classrooms/new?error=name_required")
  }

  const allowedCovers = await listClassroomCoverFilenames()
  if (allowedCovers.length === 0) {
    redirect("/classrooms/new?error=no_covers")
  }
  if (!coverFilename || !allowedCovers.includes(coverFilename)) {
    redirect("/classrooms/new?error=cover_required")
  }
  const coverImagePath = classroomCoverPublicPath(coverFilename)
  const subject = isClassroomSubject(subjectRaw) ? subjectRaw : null
  const gradeLevel = isClassroomGradeLevel(gradeRaw) ? gradeRaw : null
  const section = /^[A-Z]$/.test(sectionRaw) ? sectionRaw : null

  let createdClassroomId: string | null = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const joinCode = generateJoinCode(6)
    const { data: classroom, error } = await supabase
      .from("classrooms")
      .insert({
        name: classroomName,
        teacher_id: user.id,
        join_code: joinCode,
        cover_image: coverImagePath,
        subject,
        grade_level: gradeLevel,
        section,
        school_year: schoolYear,
      })
      .select("id")
      .single()

    if (!error && classroom) {
      createdClassroomId = classroom.id
      break
    }

    if (error?.code !== "23505") {
      console.error("createClassroomAction insert error:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      })
      const errorCode = encodeURIComponent(error?.code ?? "unknown")
      redirect(`/classrooms/new?error=create_failed&reason=${errorCode}`)
    }
  }

  if (!createdClassroomId) {
    redirect("/classrooms/new?error=join_code_conflict")
  }

  const { error: memberInsertError } = await supabase.from("classroom_members").insert({
    classroom_id: createdClassroomId,
    user_id: user.id,
    role: "teacher",
  })

  if (memberInsertError) {
    console.error("createClassroomAction member insert error:", {
      code: memberInsertError.code,
      message: memberInsertError.message,
      details: memberInsertError.details,
      hint: memberInsertError.hint,
    })
    await supabase.from("classrooms").delete().eq("id", createdClassroomId)
    redirect("/classrooms/new?error=create_failed&reason=member_insert_failed")
  }

  revalidatePath("/classrooms")
  redirect(`/classrooms/${createdClassroomId}`)
}

export async function joinClassroomAction(formData: FormData) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) redirect("/")

  const joinCode = getStringValue(formData, "join_code").toUpperCase()
  const redirectError = (code: string) => redirect(`/classrooms/join?error=${code}`)

  if (!joinCode || joinCode.length !== 6) {
    redirectError("invalid_code")
  }

  const { data: classroomId, error } = await authClient.rpc("join_classroom", { p_join_code: joinCode })

  if (error || !classroomId) {
    const message = error?.message ?? ""
    if (message.includes("classroom_not_found")) redirectError("classroom_not_found")
    if (message.includes("classroom_archived")) redirectError("classroom_archived")
    if (message.includes("join_locked")) redirectError("join_locked")
    console.error("joinClassroomAction rpc error:", error)
    redirectError("join_failed")
  }

  revalidatePath("/classrooms")
  redirect(`/classrooms/${classroomId}`)
}

export async function createAnnouncementAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  const classroomId = getStringValue(formData, "classroom_id")
  const type = getStringValue(formData, "type")
  const content = getStringValue(formData, "content")
  const lessonSlug = getStringValue(formData, "lesson_slug")
  const file = formData.get("file")

  if (!classroomId) {
    redirect("/classrooms?error=missing_classroom")
  }

  await assertTeacherAccess(supabase, user.id, classroomId)

  let filePath: string | null = null
  const hasFile = file instanceof File && file.size > 0
  if ((type === "image" || type === "file") && hasFile) {
    const fileExt = file.name.split(".").pop() ?? "bin"
    const safeName = toSafeStorageName(file.name.replace(`.${fileExt}`, ""))
    const fileName = `${Date.now()}-${safeName || "attachment"}.${fileExt}`
    filePath = `${classroomId}/${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("classroom-files")
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      redirect(`/classrooms/${classroomId}?error=file_upload_failed`)
    }
  }

  const normalizedType: "text" | "image" | "file" | "lesson" =
    type === "image" || type === "file" || type === "lesson" ? type : "text"

  const payload = {
    classroom_id: classroomId,
    author_id: user.id,
    type: normalizedType,
    content: normalizedType === "text" ? content : content || null,
    file_url: normalizedType === "image" || normalizedType === "file" ? filePath : null,
    lesson_slug: normalizedType === "lesson" ? lessonSlug : null,
  }

  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert(payload)
    .select("id")
    .single()
  if (error || !announcement) {
    console.error("createAnnouncementAction insert error:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    })
    redirect(`/classrooms/${classroomId}?error=announcement_failed`)
  }

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("name")
    .eq("id", classroomId)
    .maybeSingle()
  const copy = classroomAnnouncementNotificationCopy({
    type: normalizedType,
    content: payload.content,
    classroomName: classroom?.name ?? "",
  })
  try {
    await notifyClassroomStudents({
      classroomId,
      type: "classroom_announcement",
      title: copy.title,
      body: copy.body,
      href: `/classrooms/${classroomId}`,
      announcementId: announcement.id,
    })
  } catch (notifyError) {
    console.error("createAnnouncementAction notify error:", notifyError)
  }

  revalidatePath(`/classrooms/${classroomId}`)
  redirect(`/classrooms/${classroomId}`)
}

export async function createAssignmentAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  const classroomId = getStringValue(formData, "classroom_id")
  const title = getStringValue(formData, "title")
  const description = getStringValue(formData, "description")
  const deadline = getStringValue(formData, "deadline")
  const kindRaw = getStringValue(formData, "kind")
  const statusRaw = getStringValue(formData, "status")
  const latePolicyRaw = getStringValue(formData, "late_policy")
  const windowStart = getStringValue(formData, "window_start")
  const windowEnd = getStringValue(formData, "window_end")
  const timeLimitRaw = getStringValue(formData, "time_limit_minutes")
  const shuffleOptions = getStringValue(formData, "shuffle_options") === "on" || getStringValue(formData, "shuffle_options") === "true"
  const allowCatalogSync = getStringValue(formData, "allow_catalog_sync") !== "false"
  const kind = isAssignmentKind(kindRaw) ? kindRaw : "homework"
  const status = isAssignmentStatus(statusRaw) ? statusRaw : "published"
  const latePolicy = isLatePolicy(latePolicyRaw) ? latePolicyRaw : "accept"
  const timeLimitMinutes = timeLimitRaw ? Number(timeLimitRaw) : NaN
  const selectedProblemIds = formData
    .getAll("problem_ids")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean)

  if (!classroomId) {
    redirect("/classrooms?error=missing_classroom")
  }

  await assertTeacherAccess(supabase, user.id, classroomId)

  if (!title || selectedProblemIds.length === 0) {
    redirect(`/classrooms/${classroomId}/assignments?error=title_and_problems_required`)
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      classroom_id: classroomId,
      title,
      description,
      deadline: deadline || null,
      status,
      kind,
      late_policy: latePolicy,
      window_start: windowStart || null,
      window_end: windowEnd || null,
      time_limit_minutes: Number.isFinite(timeLimitMinutes) && timeLimitMinutes > 0 ? timeLimitMinutes : null,
      shuffle_options: kind === "test" ? shuffleOptions : false,
      allow_catalog_sync: kind === "test" ? false : allowCatalogSync,
    })
    .select("id")
    .single()

  if (assignmentError || !assignment) {
    console.error("createAssignmentAction insert error:", assignmentError)
    redirect(`/classrooms/${classroomId}/assignments?error=assignment_create_failed`)
  }

  const assignmentProblems = selectedProblemIds.map((problemId) => ({
    assignment_id: assignment.id,
    problem_id: problemId,
  }))

  const { error: linkError } = await supabase.from("assignment_problems").insert(assignmentProblems)
  if (linkError) {
    console.error("createAssignmentAction link error:", {
      code: linkError.code,
      message: linkError.message,
      details: linkError.details,
      hint: linkError.hint,
      payload: assignmentProblems,
    })
    redirect(
      `/classrooms/${classroomId}/assignments?error=assignment_problem_link_failed&reason=${encodeURIComponent(linkError.code + ": " + linkError.message)}`
    )
  }

  if (status === "published") {
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("name")
      .eq("id", classroomId)
      .maybeSingle()
    const classroomName = classroom?.name?.trim() || "clasă"
    try {
      await notifyClassroomStudents({
        classroomId,
        type: "classroom_assignment",
        title: kind === "test" ? "Test nou" : "Temă nouă",
        body: `${title} · ${classroomName}`,
        href: `/classrooms/${classroomId}/assignments/${assignment.id}`,
        assignmentId: assignment.id,
      })
    } catch (notifyError) {
      console.error("createAssignmentAction notify error:", notifyError)
    }
  }

  revalidatePath(`/classrooms/${classroomId}`)
  revalidatePath(`/classrooms/${classroomId}/assignments`)
  redirect(`/classrooms/${classroomId}/assignments/${assignment.id}`)
}

export async function submitAssignmentAnswerAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  const problemId = getStringValue(formData, "problem_id")
  const directAnswer = getStringValue(formData, "answer")
  const redirectTo =
    getStringValue(formData, "redirect_to") ||
    `/classrooms/${classroomId}/assignments/${assignmentId}`

  if (!classroomId || !assignmentId || !problemId) {
    redirect(`${redirectTo}?error=invalid_submission`)
  }

  const { data: membership } = await supabase
    .from("classroom_members")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("user_id", user.id)
    .eq("role", "student")
    .maybeSingle()

  if (!membership) {
    redirect(`${redirectTo}?error=students_only`)
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, status, kind, late_policy, deadline, window_start, window_end, time_limit_minutes, allow_catalog_sync")
    .eq("id", assignmentId)
    .eq("classroom_id", classroomId)
    .maybeSingle()

  if (!assignment) {
    redirect(`${redirectTo}?error=assignment_not_found`)
  }

  if (assignment.status === "closed" || assignment.status === "draft") {
    redirect(`${redirectTo}?error=assignment_closed`)
  }

  const now = Date.now()
  if (assignment.window_start && new Date(assignment.window_start).getTime() > now) {
    redirect(`${redirectTo}?error=assignment_not_open`)
  }
  if (assignment.window_end && new Date(assignment.window_end).getTime() < now) {
    redirect(`${redirectTo}?error=assignment_closed`)
  }

  if (assignment.time_limit_minutes && assignment.kind === "test") {
    const { data: startRow } = await supabase
      .from("assignment_starts")
      .select("started_at")
      .eq("assignment_id", assignmentId)
      .eq("student_id", user.id)
      .maybeSingle()
    if (startRow?.started_at) {
      const elapsed = now - new Date(startRow.started_at).getTime()
      if (elapsed > assignment.time_limit_minutes * 60 * 1000) {
        redirect(`${redirectTo}?error=time_expired`)
      }
    }
  }

  const deadlineMs = assignment.deadline ? new Date(assignment.deadline).getTime() : null
  const isLate = deadlineMs !== null && Number.isFinite(deadlineMs) && deadlineMs < now
  if (isLate && assignment.late_policy === "block") {
    redirect(`${redirectTo}?error=assignment_closed`)
  }

  const teacherPhotos = collectTeacherSubmissionPhotos(formData)
  const teacherPhotoError = validateTeacherSubmissionPhotos(teacherPhotos)
  if (teacherPhotoError) {
    redirect(`${redirectTo}?error=teacher_photos_${teacherPhotoError}`)
  }

  const { data: relation } = await supabase
    .from("assignment_problems")
    .select("problems!inner(answer_type, grila_correct_index, value_subpoints)")
    .eq("assignment_id", assignmentId)
    .eq("problem_id", problemId)
    .maybeSingle()

  const problemConfig =
    relation && typeof relation.problems === "object" && relation.problems !== null
      ? (relation.problems as {
          answer_type?: "grila" | "value" | null
          grila_correct_index?: number | null
          value_subpoints?: Array<{ correct_value?: number | null }> | null
        })
      : null

  const answerType = problemConfig?.answer_type ?? null
  let isCorrect = false
  let normalizedAnswer = directAnswer

  if (answerType === "value") {
    const valueEntries = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("value_answer_"))
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([, value]) => (typeof value === "string" ? value : ""))

    if (valueEntries.length === 0 || valueEntries.some((value) => value.trim() === "")) {
      redirect(`${redirectTo}?error=invalid_submission`)
    }

    normalizedAnswer = JSON.stringify(valueEntries.map((value) => Number(value)))
  }

  if (answerType === "grila") {
    const correctIndex = Number(problemConfig?.grila_correct_index ?? -1)
    const submittedAnswer = Number(directAnswer)
    isCorrect = submittedAnswer === correctIndex
    normalizedAnswer = String(submittedAnswer)
  } else if (answerType === "value") {
    const submittedValues = parseJsonArrayAnswer(normalizedAnswer)
    const correctValues = Array.isArray(problemConfig?.value_subpoints)
      ? problemConfig.value_subpoints
          .map((subpoint) => Number(subpoint?.correct_value))
          .filter((value) => Number.isFinite(value))
      : []

    isCorrect =
      submittedValues !== null &&
      submittedValues.length === correctValues.length &&
      submittedValues.every((value, index) => isWithinTolerance(value, correctValues[index]))
  } else {
    normalizedAnswer = directAnswer || "submitted"
    isCorrect = false
  }

  const { data: existingSubmission } = await supabase
    .from("submissions")
    .select("id, answer, is_correct, submitted_at, attempt_count")
    .eq("assignment_id", assignmentId)
    .eq("problem_id", problemId)
    .eq("student_id", user.id)
    .maybeSingle()

  const { data: submissionRow, error } = await supabase
    .from("submissions")
    .upsert(
      {
        assignment_id: assignmentId,
        problem_id: problemId,
        student_id: user.id,
        answer: normalizedAnswer,
        is_correct: isCorrect,
        submitted_at: new Date().toISOString(),
        is_late: isLate,
        attempt_count: (existingSubmission?.attempt_count ?? 0) + 1,
      },
      {
        onConflict: "assignment_id,problem_id,student_id",
      }
    )
    .select("id")
    .single()

  if (error || !submissionRow?.id) {
    console.error("submitAssignmentAnswerAction upsert error:", error)
    redirect(`${redirectTo}?error=submission_failed`)
  }

  if (existingSubmission?.id && existingSubmission.answer) {
    await supabase.from("submission_attempts").insert({
      submission_id: existingSubmission.id,
      answer: existingSubmission.answer,
      is_correct: Boolean(existingSubmission.is_correct),
      submitted_at: existingSubmission.submitted_at,
      attempt_number: existingSubmission.attempt_count ?? 1,
    })
  }

  if (teacherPhotos.length > 0) {
    const photoResult = await replaceTeacherOnlySubmissionPhotos(supabase, {
      submissionId: submissionRow.id,
      classroomId,
      studentId: user.id,
      assignmentId,
      problemId,
      photos: teacherPhotos,
    })
    if (!photoResult.ok) {
      redirect(`${redirectTo}?error=teacher_photos_upload_failed`)
    }
  }

  revalidatePath(`/classrooms/${classroomId}/assignments/${assignmentId}`)
  redirect(`${redirectTo}?saved=1`)
}

export async function syncCatalogSolvedProblemAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  const classroomId = getStringValue(formData, "classroom_id")
  const assignmentId = getStringValue(formData, "assignment_id")
  const problemId = getStringValue(formData, "problem_id")
  const redirectTo =
    getStringValue(formData, "redirect_to") ||
    `/classrooms/${classroomId}/assignments/${assignmentId}`

  if (!classroomId || !assignmentId || !problemId) {
    redirect(`${redirectTo}?error=invalid_submission`)
  }

  const { data: membership } = await supabase
    .from("classroom_members")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("user_id", user.id)
    .eq("role", "student")
    .maybeSingle()

  if (!membership) {
    redirect(`${redirectTo}?error=students_only`)
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, status, kind, allow_catalog_sync, late_policy, deadline")
    .eq("id", assignmentId)
    .eq("classroom_id", classroomId)
    .maybeSingle()

  if (!assignment || assignment.status !== "published") {
    redirect(`${redirectTo}?error=assignment_closed`)
  }
  if (assignment.kind === "test" || assignment.allow_catalog_sync === false) {
    redirect(`${redirectTo}?error=catalog_sync_disabled`)
  }

  const deadlineMs = assignment.deadline ? new Date(assignment.deadline).getTime() : null
  const isLate = deadlineMs !== null && Number.isFinite(deadlineMs) && deadlineMs < Date.now()
  if (isLate && assignment.late_policy === "block") {
    redirect(`${redirectTo}?error=assignment_closed`)
  }

  const { data: solvedProblem } = await supabase
    .from("solved_problems")
    .select("problem_id")
    .eq("user_id", user.id)
    .eq("problem_id", problemId)
    .maybeSingle()

  if (!solvedProblem) {
    redirect(`${redirectTo}?error=solve_in_catalog_first`)
  }

  const teacherPhotos = collectTeacherSubmissionPhotos(formData)
  const teacherPhotoError = validateTeacherSubmissionPhotos(teacherPhotos)
  if (teacherPhotoError) {
    redirect(`${redirectTo}?error=teacher_photos_${teacherPhotoError}`)
  }

  const { data: submissionRow, error } = await supabase
    .from("submissions")
    .upsert(
      {
        assignment_id: assignmentId,
        problem_id: problemId,
        student_id: user.id,
        answer: "catalog_solved",
        is_correct: true,
        submitted_at: new Date().toISOString(),
        is_late: isLate,
      },
      {
        onConflict: "assignment_id,problem_id,student_id",
      }
    )
    .select("id")
    .single()

  if (error || !submissionRow?.id) {
    console.error("syncCatalogSolvedProblemAction upsert error:", error)
    redirect(`${redirectTo}?error=submission_failed`)
  }

  if (teacherPhotos.length > 0) {
    const photoResult = await replaceTeacherOnlySubmissionPhotos(supabase, {
      submissionId: submissionRow.id,
      classroomId,
      studentId: user.id,
      assignmentId,
      problemId,
      photos: teacherPhotos,
    })
    if (!photoResult.ok) {
      redirect(`${redirectTo}?error=teacher_photos_upload_failed`)
    }
  }

  revalidatePath(`/classrooms/${classroomId}/assignments/${assignmentId}`)
  redirect(`${redirectTo}?saved=1`)
}

export async function removeStudentAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  const classroomId = getStringValue(formData, "classroom_id")
  const memberId = getStringValue(formData, "member_id")

  if (!classroomId || !memberId) {
    redirect("/classrooms?error=invalid_remove_request")
  }

  await assertTeacherAccess(supabase, user.id, classroomId)

  await supabase
    .from("classroom_members")
    .delete()
    .eq("id", memberId)
    .eq("classroom_id", classroomId)
    .eq("role", "student")

  revalidatePath(`/classrooms/${classroomId}/students`)
  redirect(`/classrooms/${classroomId}/students`)
}

export async function leaveClassroomAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserOrRedirect()
  const classroomId = getStringValue(formData, "classroom_id")

  if (!classroomId) {
    redirect("/classrooms?error=invalid_leave_request")
  }

  const { data: membership } = await supabase
    .from("classroom_members")
    .select("id, role")
    .eq("classroom_id", classroomId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) {
    redirect("/classrooms?error=not_member")
  }

  if (membership.role === "teacher") {
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("teacher_id")
      .eq("id", classroomId)
      .maybeSingle()
    if (classroom?.teacher_id === user.id) {
      redirect("/classrooms?error=teacher_cannot_leave")
    }
  }

  await supabase.from("classroom_members").delete().eq("id", membership.id)

  revalidatePath("/classrooms")
  revalidatePath(`/classrooms/${classroomId}`)
  redirect("/classrooms?left=1")
}
