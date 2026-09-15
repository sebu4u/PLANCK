export type ClassroomRole = "teacher" | "student"

export type AssignmentStatus = "draft" | "published" | "closed"
export type AssignmentKind = "homework" | "test"
export type AssignmentLatePolicy = "accept" | "mark_late" | "block"
export type AttendanceStatus = "present" | "absent" | "late"

export interface ClassroomSummary {
  id: string
  name: string
  join_code: string
  teacher_id: string
  teacher_name: string
  created_at: string
  role: ClassroomRole
  joined_at: string
  student_count: number
  /** Public path e.g. `/clase/cover-1.svg` */
  cover_image: string | null
  archived_at: string | null
  join_locked: boolean
  subject: string | null
  grade_level: string | null
  section: string | null
  school_year: string | null
  school_id: string | null
}

export interface ClassroomDetails {
  id: string
  name: string
  join_code: string
  teacher_id: string
  created_at: string
  role: ClassroomRole
  /** Public path e.g. `/clase/cover-1.svg` */
  cover_image: string | null
  archived_at: string | null
  join_locked: boolean
  subject: string | null
  grade_level: string | null
  section: string | null
  school_year: string | null
  school_id: string | null
}

export interface ClassroomAnnouncement {
  id: string
  classroom_id: string
  author_id: string
  type: "text" | "image" | "file" | "lesson"
  content: string | null
  file_url: string | null
  lesson_slug: string | null
  created_at: string
  pinned_at: string | null
  author_name: string
  signed_file_url: string | null
}

export interface ClassroomAssignmentListItem {
  id: string
  classroom_id: string
  title: string
  description: string
  deadline: string | null
  created_at: string
  problem_count: number
  author_name: string
  status: AssignmentStatus
  kind: AssignmentKind
  late_policy: AssignmentLatePolicy
  window_start: string | null
  window_end: string | null
  time_limit_minutes: number | null
  shuffle_options: boolean
  allow_catalog_sync: boolean
  submitted_count?: number
  student_count?: number
  partial_count?: number
  unreviewed_photo_count?: number
}

/** Assignment row for cross-classroom student lists (e.g. Exersează → Teme). */
export interface UserAssignmentListItem extends ClassroomAssignmentListItem {
  classroom_name: string
}

export interface ClassroomMemberOverview {
  member_id: string
  user_id: string
  role: ClassroomRole
  joined_at: string
  name: string
  email: string
  /** Public profile image URL from `profiles.user_icon` */
  user_icon: string | null
  elo: number
  rank: string
}

export interface AssignmentProblem {
  id: string
  title: string
  statement: string
  difficulty: string | null
  answer_type: "value" | "grila" | null
  value_subpoints: {
    label: string
    text_before: string
    text_after: string
    correct_value: number
  }[] | null
  grila_options: string[] | null
  grila_correct_index: number | null
  image_url: string | null
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  problem_id: string
  student_id: string
  answer: string
  is_correct: boolean
  submitted_at: string
  teacher_comment: string | null
  teacher_grade: number | null
  is_late: boolean
  attempt_count: number
  reviewed_at: string | null
  /** Count of teacher-only photos; set for the current student’s rows only. */
  teacher_attachment_count?: number
}

export interface TeacherAssignmentAttachmentGroup {
  student_id: string
  student_name: string
  problem_id: string
  problem_title: string
  signed_urls: string[]
  submission_id?: string
}

export interface ClassroomInvite {
  id: string
  classroom_id: string
  email: string
  full_name: string | null
  role: ClassroomRole
  created_at: string
  accepted_at: string | null
}

export interface ClassroomSession {
  id: string
  classroom_id: string
  started_by: string
  started_at: string
  ended_at: string | null
  status: "active" | "ended"
  current_problem_id: string | null
  assignment_id: string | null
  exit_ticket_assignment_id: string | null
}

export interface ClassroomAttendanceRow {
  student_id: string
  student_name: string
  status: AttendanceStatus
  marked_at: string | null
}

export interface ParentClassroomMessage {
  id: string
  classroom_id: string
  classroom_name: string
  author_name: string
  student_id: string | null
  student_name: string | null
  body: string
  created_at: string
}

export interface SchoolSummary {
  id: string
  name: string
  created_by: string
  created_at: string
  role: "admin" | "teacher"
  member_count: number
}
