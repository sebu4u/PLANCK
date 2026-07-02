import type { UserType } from "@/lib/user-types"

export const GUARDIAN_ONBOARDING_PATH = "/register/guardian?onboarding=oauth"
export const GUARDIAN_ONBOARDING_STORAGE_KEY = "planck_guardian_onboarding"
export const GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY = "planck_guardian_onboarding_after_oauth"

export type GuardianRole = Extract<UserType, "parinte" | "profesor">
export type GuardianTeachingMaterie = "matematica" | "fizica" | "informatica" | "biologie"
export type GuardianStep = 1 | 2 | 3 | 4 | 5 | 6 | "name"
export type GuardianDailyTimeOption = "15" | "30" | "60"

export type GuardianOnboardingState = {
  step: GuardianStep
  role: GuardianRole | null
  childAge: number | null
  dailyTime: GuardianDailyTimeOption | null
  teachingMaterie: GuardianTeachingMaterie | null
  awaitingPostAuth: boolean
}

export const GUARDIAN_CHILD_AGE_MIN = 8
export const GUARDIAN_CHILD_AGE_MAX = 60
export const GUARDIAN_CHILD_AGE_DEFAULT = 14

export const defaultGuardianOnboardingState: GuardianOnboardingState = {
  step: 1,
  role: null,
  childAge: GUARDIAN_CHILD_AGE_DEFAULT,
  dailyTime: null,
  teachingMaterie: null,
  awaitingPostAuth: false,
}

const isNumericGuardianStep = (step: GuardianStep): step is 1 | 2 | 3 | 4 | 5 | 6 =>
  typeof step === "number"

export function isGuardianOnboardingRoute(pathname: string | null | undefined): boolean {
  return pathname === "/register/guardian"
}

export function isGuardianRole(value: unknown): value is GuardianRole {
  return value === "parinte" || value === "profesor"
}

const sanitizeStep = (value: unknown): GuardianStep => {
  if (value === "name") return "name"
  if (typeof value === "number" && value >= 1 && value <= 6) return value as GuardianStep
  return 1
}

const sanitizeDailyTime = (value: unknown): GuardianDailyTimeOption | null =>
  value === "15" || value === "30" || value === "60" ? value : null

const sanitizeChildAge = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  if (rounded < GUARDIAN_CHILD_AGE_MIN || rounded > GUARDIAN_CHILD_AGE_MAX) return null
  return rounded
}

const guardianTeachingMaterii = new Set<string>(["matematica", "fizica", "informatica", "biologie"])

const isGuardianTeachingMaterie = (value: unknown): value is GuardianTeachingMaterie =>
  typeof value === "string" && guardianTeachingMaterii.has(value)

export function sanitizeGuardianOnboardingState(value: unknown): GuardianOnboardingState {
  if (!value || typeof value !== "object") return defaultGuardianOnboardingState

  const raw = value as Partial<GuardianOnboardingState>
  const role = isGuardianRole(raw.role) ? raw.role : null

  return {
    step: sanitizeStep(raw.step),
    role,
    childAge: sanitizeChildAge(raw.childAge) ?? GUARDIAN_CHILD_AGE_DEFAULT,
    dailyTime: sanitizeDailyTime(raw.dailyTime),
    teachingMaterie: isGuardianTeachingMaterie(raw.teachingMaterie) ? raw.teachingMaterie : null,
    awaitingPostAuth: raw.awaitingPostAuth === true,
  }
}

export function readGuardianOnboardingState(): GuardianOnboardingState | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(GUARDIAN_ONBOARDING_STORAGE_KEY)
  if (!raw) return null
  try {
    return sanitizeGuardianOnboardingState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function hasGuardianOnboardingInProgress(): boolean {
  return readGuardianOnboardingState() !== null
}

export function hasGuardianOAuthReturnPending(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY) === "1"
}

export function getGuardianOAuthStep(role: GuardianRole | null): GuardianStep {
  return role === "profesor" ? 6 : 5
}

export function getGuardianProgressPercent(
  step: GuardianStep,
  role: GuardianRole | null,
): number {
  if (step === "name") return 100
  if (!isNumericGuardianStep(step)) return 0

  const totalSteps = role === "profesor" ? 6 : 5
  return (step / totalSteps) * 100
}

export function getGuardianDashboardPath(role: GuardianRole): string {
  return role === "parinte" ? "/dashboard/parent" : "/dashboard/teacher"
}

export const GUARDIAN_ROLE_OPTIONS = [
  {
    id: "parinte" as const,
    label: "Părinte",
    description: "Urmăresc progresul copilului meu",
  },
  {
    id: "profesor" as const,
    label: "Profesor",
    description: "Predau și gestionez clase",
  },
] as const

export const GUARDIAN_DAILY_TIME_OPTIONS: { id: GuardianDailyTimeOption; label: string }[] = [
  { id: "15", label: "15 min" },
  { id: "30", label: "30 min" },
  { id: "60", label: "1h+" },
]
