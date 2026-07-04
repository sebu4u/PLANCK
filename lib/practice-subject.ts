import type { LucideIcon } from "lucide-react"
import { Atom, Calculator, Monitor } from "lucide-react"

export type PracticeSubjectId = "fizica" | "matematica" | "informatica"

export interface PracticeSubjectConfig {
  id: PracticeSubjectId
  label: string
  icon: LucideIcon
}

export const PRACTICE_SUBJECTS: PracticeSubjectConfig[] = [
  {
    id: "fizica",
    label: "Fizică",
    icon: Atom,
  },
  {
    id: "matematica",
    label: "Matematică",
    icon: Calculator,
  },
  {
    id: "informatica",
    label: "Informatică",
    icon: Monitor,
  },
]

const PRACTICE_SUBJECT_IDS = new Set<string>(PRACTICE_SUBJECTS.map((s) => s.id))

export function isPracticeSubjectId(value: unknown): value is PracticeSubjectId {
  return typeof value === "string" && PRACTICE_SUBJECT_IDS.has(value)
}

/** Maps DB preferred_materie to a practice subject; biologie/null/invalid → fizica. */
export function normalizePracticeSubject(value: unknown): PracticeSubjectId {
  if (value === "matematica" || value === "informatica") return value
  return "fizica"
}

export function getPracticeSubjectRoute(id: PracticeSubjectId): string {
  switch (id) {
    case "matematica":
      return "/matematica/probleme"
    case "informatica":
      return "/informatica/probleme"
    default:
      return "/exerseaza"
  }
}

export function getPracticeSubjectLabel(id: PracticeSubjectId): string {
  return PRACTICE_SUBJECTS.find((subject) => subject.id === id)?.label ?? "Fizică"
}

/** Returns redirect path for /exerseaza, or null when hub should render. */
export function resolveExerseazaRedirect(preferred: unknown): string | null {
  if (preferred === "matematica") return "/matematica/probleme"
  if (preferred === "informatica") return "/informatica/probleme"
  return null
}

/** Student home dashboard only — not parent/teacher/dev sub-routes. */
export function isStudentDashboardRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/dashboard" || pathname === "/dashboard/"
}

export const DASHBOARD_SUBJECT_LEARNING_PATH_SLUG = {
  matematica: "Introducere-matematica",
  informatica: "Introducere-Python",
} as const satisfies Partial<Record<PracticeSubjectId, string>>

export function getDashboardPrimaryLearningPathSlug(preferredMaterie: unknown): string | null {
  const subject = normalizePracticeSubject(preferredMaterie)
  if (subject === "matematica") return DASHBOARD_SUBJECT_LEARNING_PATH_SLUG.matematica
  if (subject === "informatica") return DASHBOARD_SUBJECT_LEARNING_PATH_SLUG.informatica
  return null
}

export function getPostOnboardingLearningPathCtaLabel(preferredMaterie: unknown): string {
  if (preferredMaterie === "matematica") return "Începe Introducerea în Matematică"
  if (preferredMaterie === "informatica") return "Începe Introducerea în Python"
  return "Începe Cinematică"
}
