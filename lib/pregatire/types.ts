import type { PracticeSubjectId } from "@/lib/practice-subject"

export const WORKSHOP_SUBJECTS = [
  "mate",
  "fizica",
  "info",
  "biologie",
  "chimie",
] as const

export type WorkshopSubject = (typeof WORKSHOP_SUBJECTS)[number]

/** Maps dashboard/practice preferred materie to workshop subject keys. */
export function practiceSubjectToWorkshopSubject(id: PracticeSubjectId): WorkshopSubject {
  switch (id) {
    case "matematica":
      return "mate"
    case "informatica":
      return "info"
    default:
      return "fizica"
  }
}

export const WORKSHOP_SUBJECT_LABELS: Record<WorkshopSubject, string> = {
  mate: "Matematică",
  fizica: "Fizică",
  info: "Informatică",
  biologie: "Biologie",
  chimie: "Chimie",
}

export const WORKSHOP_SUBJECT_COLORS: Record<WorkshopSubject, string> = {
  mate: "#2563eb",
  fizica: "#7c3aed",
  info: "#059669",
  biologie: "#16a34a",
  chimie: "#ea580c",
}

/** Right-side hero art on `/pregatire` — files in `public/images/pregatire/`. */
export const WORKSHOP_HERO_IMAGE_SRC: Record<WorkshopSubject, string> = {
  mate: "/images/pregatire/hero-mate.png",
  fizica: "/images/pregatire/hero-fizica.png",
  info: "/images/pregatire/hero-info.png",
  biologie: "/images/pregatire/hero-biologie.png",
  chimie: "/images/pregatire/hero-chimie.png",
}

export const WORKSHOP_ENERGY_SIGNUP = 25
export const WORKSHOP_ENERGY_PREMIUM_WEEKLY = 100
export const WORKSHOP_ENERGY_FREE_WEEKLY = WORKSHOP_ENERGY_SIGNUP
export const WORKSHOP_ENERGY_PLUS_WEEKLY = WORKSHOP_ENERGY_SIGNUP
export const WORKSHOP_DEFAULT_DURATION_MINUTES = 60
export const WORKSHOP_DEFAULT_ENERGY_COST = 25

export const WORKSHOP_TZ = "Europe/Bucharest"

export function isWorkshopSubject(value: unknown): value is WorkshopSubject {
  return typeof value === "string" && (WORKSHOP_SUBJECTS as readonly string[]).includes(value)
}

/** Premium weekly refill; free/plus get 0 weekly (one-time signup grant is separate). */
export function weeklyEnergyForPlan(plan: string | null | undefined): number {
  const normalized = (plan ?? "free").trim().toLowerCase()
  if (normalized === "premium" || normalized === "pro") {
    return WORKSHOP_ENERGY_PREMIUM_WEEKLY
  }
  return 0
}

export interface WorkshopTeacher {
  id: string
  name: string
  description: string
  icon_url: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface WorkshopPublic {
  id: string
  title: string
  slug: string
  description: string
  subject: WorkshopSubject
  teacher_id: string
  starts_at: string
  duration_minutes: number
  energy_cost: number
  max_seats: number | null
  is_published: boolean
  is_bac: boolean
  has_recording: boolean
  unlock_count: number
  created_at?: string
  updated_at?: string
  teacher?: WorkshopTeacher | null
  unlocked?: boolean
  seats_remaining?: number | null
}

export const WORKSHOP_HOMEWORK_ITEM_TYPES = [
  "physics_problem",
  "math_problem",
  "coding_problem",
  "grila_fizica",
  "grila_biologie",
] as const

export type WorkshopHomeworkItemType = (typeof WORKSHOP_HOMEWORK_ITEM_TYPES)[number]

export const WORKSHOP_HOMEWORK_ITEM_LABELS: Record<WorkshopHomeworkItemType, string> = {
  physics_problem: "Problemă fizică",
  math_problem: "Problemă matematică",
  coding_problem: "Problemă informatică",
  grila_fizica: "Grilă fizică",
  grila_biologie: "Grilă biologie",
}

export function isWorkshopHomeworkItemType(value: unknown): value is WorkshopHomeworkItemType {
  return (
    typeof value === "string" &&
    (WORKSHOP_HOMEWORK_ITEM_TYPES as readonly string[]).includes(value)
  )
}

export function workshopHomeworkHref(
  itemType: WorkshopHomeworkItemType,
  refId: string,
  codingSlug?: string,
): string {
  switch (itemType) {
    case "physics_problem":
      return `/probleme/${encodeURIComponent(refId)}`
    case "math_problem":
      return `/matematica/probleme/${encodeURIComponent(refId)}`
    case "coding_problem":
      return `/informatica/probleme/${encodeURIComponent(codingSlug || refId)}`
    case "grila_fizica":
      return `/grile?question=${encodeURIComponent(refId)}`
    case "grila_biologie":
      return `/biologie/grile?question=${encodeURIComponent(refId)}`
  }
}

export interface WorkshopHomeworkItem {
  id?: string
  item_type: WorkshopHomeworkItemType
  ref_id: string
  title: string
  href: string
  sort_order?: number
}

export interface WorkshopMaterials {
  whiteboard_url: string | null
  notes_markdown: string | null
  notes_pdf_url: string | null
  homework_pdf_url: string | null
  homework_items: WorkshopHomeworkItem[]
}

export const EMPTY_WORKSHOP_MATERIALS: WorkshopMaterials = {
  whiteboard_url: null,
  notes_markdown: null,
  notes_pdf_url: null,
  homework_pdf_url: null,
  homework_items: [],
}

export interface WorkshopAdmin extends Omit<WorkshopPublic, "has_recording" | "unlock_count"> {
  meet_url: string
  recording_url: string | null
  whiteboard_url: string | null
  notes_markdown: string
  notes_pdf_path: string | null
  homework_pdf_path: string | null
  notes_pdf_url: string | null
  homework_pdf_url: string | null
  homework_items: WorkshopHomeworkItem[]
}

export interface WorkshopMaterialsHubItem {
  workshop: WorkshopPublic
  has_notes: boolean
  has_homework: boolean
  notes_markdown: string | null
  notes_pdf_url: string | null
  homework_pdf_url: string | null
  homework_items: WorkshopHomeworkItem[]
}

export interface WorkshopDetail extends WorkshopPublic {
  confirmed_at?: string | null
  meet_url?: string | null
  recording_url?: string | null
  whiteboard_url?: string | null
  notes_markdown?: string | null
  notes_pdf_url?: string | null
  homework_pdf_url?: string | null
  homework_items?: WorkshopHomeworkItem[]
  /** Public presence flags — never leak actual material content when locked. */
  has_whiteboard?: boolean
  has_notes?: boolean
  has_homework?: boolean
}
