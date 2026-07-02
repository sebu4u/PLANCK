export const OAUTH_ONBOARDING_PARAM = "oauth"
export const REGISTER_ONBOARDING_PATH = `/register?onboarding=${OAUTH_ONBOARDING_PARAM}`
export const ONBOARDING_REDIRECT_STORAGE_KEY = "planck_onboarding_redirect_after_complete"

export {
  USER_TYPES,
  USER_TYPE_LABELS,
  isUserType,
  normalizeUserType,
  type UserType,
} from "@/lib/user-types"

export const ONBOARDING_SUBJECT_OPTIONS = [
  { id: "matematica", label: "Matematică" },
  { id: "fizica", label: "Fizică" },
  { id: "informatica", label: "Informatică" },
  { id: "biologie", label: "Biologie" },
] as const

export type OnboardingSubjectId = (typeof ONBOARDING_SUBJECT_OPTIONS)[number]["id"]

const onboardingSubjectIds = new Set<string>(
  ONBOARDING_SUBJECT_OPTIONS.map((option) => option.id),
)

export function isOnboardingSubjectId(value: unknown): value is OnboardingSubjectId {
  return typeof value === "string" && onboardingSubjectIds.has(value)
}

export type OnboardingProfile = {
  onboarding_completed_at?: string | null
  preferred_materie?: OnboardingSubjectId | null
} | null

export function needsOnboarding(profile: OnboardingProfile): boolean {
  return !profile?.onboarding_completed_at
}

export function isOnboardingRoute(pathname: string | null | undefined): boolean {
  return pathname === "/register"
}

export function savePostOnboardingRedirect(redirectTo: string | null | undefined) {
  if (typeof window === "undefined" || !redirectTo || !redirectTo.startsWith("/")) return
  sessionStorage.setItem(ONBOARDING_REDIRECT_STORAGE_KEY, redirectTo)
}

export function consumePostOnboardingRedirect(): string | null {
  if (typeof window === "undefined") return null
  const redirectTo = sessionStorage.getItem(ONBOARDING_REDIRECT_STORAGE_KEY)
  if (redirectTo) {
    sessionStorage.removeItem(ONBOARDING_REDIRECT_STORAGE_KEY)
  }
  return redirectTo
}
