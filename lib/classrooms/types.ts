export type ClassroomRole = "teacher" | "student"

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
}

export interface ClassroomMemberOverview {
  member_id: string
  user_id: string
  role: ClassroomRole
  joined_at: string
  name: string
  email: string
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
}
