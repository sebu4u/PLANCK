export const CONTENT_REPORT_ISSUE_TYPES = [
  "enunt_gresit",
  "raspuns_gresit",
  "imagine_gresita",
  "formatare",
  "continut_lipsa",
  "altceva",
] as const

export type ContentReportIssueType = (typeof CONTENT_REPORT_ISSUE_TYPES)[number]

export const CONTENT_REPORT_ISSUE_TYPE_LABELS: Record<ContentReportIssueType, string> = {
  enunt_gresit: "Enunț greșit / incomplet",
  raspuns_gresit: "Răspuns greșit",
  imagine_gresita: "Imagine / figură greșită",
  formatare: "Formatare / LaTeX stricat",
  continut_lipsa: "Conținut lipsă",
  altceva: "Altceva",
}

export const CONTENT_REPORT_SOURCE_TYPES = [
  "learning_path_item",
  "physics_problem",
  "math_problem",
  "coding_problem",
  "grila",
  "course_lesson",
] as const

export type ContentReportSourceType = (typeof CONTENT_REPORT_SOURCE_TYPES)[number]

export const CONTENT_REPORT_SOURCE_TYPE_LABELS: Record<ContentReportSourceType, string> = {
  learning_path_item: "Learning path",
  physics_problem: "Problemă fizică",
  math_problem: "Problemă mate",
  coding_problem: "Problemă info",
  grila: "Grilă",
  course_lesson: "Lecție curs",
}

export const CONTENT_REPORT_STATUSES = ["open", "in_progress", "resolved", "dismissed"] as const

export type ContentReportStatus = (typeof CONTENT_REPORT_STATUSES)[number]

export const CONTENT_REPORT_STATUS_LABELS: Record<ContentReportStatus, string> = {
  open: "Deschis",
  in_progress: "În lucru",
  resolved: "Rezolvat",
  dismissed: "Respins",
}

export const CONTENT_REPORT_MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024
export const CONTENT_REPORT_MIN_DESCRIPTION_LENGTH = 10
export const CONTENT_REPORT_MAX_PER_HOUR = 10
export const CONTENT_REPORTS_BUCKET = "content-reports"

export const CONTENT_REPORT_ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

export type ContentReportSourceMeta = Record<string, string | number | boolean | null | undefined>

export type ContentReportRow = {
  id: string
  user_id: string
  created_at: string
  issue_type: ContentReportIssueType
  description: string
  screenshot_path: string
  source_type: ContentReportSourceType
  source_id: string
  source_url: string
  source_meta: ContentReportSourceMeta
  status: ContentReportStatus
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
}

export function isContentReportIssueType(value: string): value is ContentReportIssueType {
  return (CONTENT_REPORT_ISSUE_TYPES as readonly string[]).includes(value)
}

export function isContentReportSourceType(value: string): value is ContentReportSourceType {
  return (CONTENT_REPORT_SOURCE_TYPES as readonly string[]).includes(value)
}

export function isContentReportStatus(value: string): value is ContentReportStatus {
  return (CONTENT_REPORT_STATUSES as readonly string[]).includes(value)
}

export function screenshotExtensionForMime(mime: string): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}
