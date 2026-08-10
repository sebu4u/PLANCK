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
  has_recording: boolean
  unlock_count: number
  created_at?: string
  updated_at?: string
  teacher?: WorkshopTeacher | null
  unlocked?: boolean
  seats_remaining?: number | null
}

export interface WorkshopAdmin extends Omit<WorkshopPublic, "has_recording" | "unlock_count"> {
  meet_url: string
  recording_url: string | null
}

export interface WorkshopDetail extends WorkshopPublic {
  meet_url?: string | null
  recording_url?: string | null
}
