import {
  GUARDIAN_ONBOARDING_PATH,
  hasGuardianOAuthReturnPending,
  hasGuardianOnboardingInProgress,
} from "@/lib/guardian-onboarding"
import { normalizeUserType, USER_TYPE_LABELS, type UserType } from "@/lib/user-types"

export const OAUTH_ONBOARDING_PARAM = "oauth"
export const REGISTER_ONBOARDING_PATH = `/register?onboarding=${OAUTH_ONBOARDING_PARAM}`
export const ONBOARDING_REDIRECT_STORAGE_KEY = "planck_onboarding_redirect_after_complete"

export {
  GUARDIAN_ONBOARDING_PATH,
  GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY,
  GUARDIAN_ONBOARDING_STORAGE_KEY,
  hasGuardianOAuthReturnPending,
  hasGuardianOnboardingInProgress,
  isGuardianOnboardingRoute,
} from "@/lib/guardian-onboarding"

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
  user_type?: string | null
} | null

export type OnboardingFlow = "student" | "guardian"

export function needsOnboarding(profile: OnboardingProfile): boolean {
  return !profile?.onboarding_completed_at
}

export function getDashboardPathForUserType(userType: UserType): string {
  if (userType === "parinte") return "/dashboard/parent"
  if (userType === "profesor") return "/dashboard/teacher"
  return "/dashboard"
}

function isIncompleteElevProfile(profile: OnboardingProfile): boolean {
  if (!profile || profile.onboarding_completed_at) return false
  return normalizeUserType(profile.user_type) === "elev"
}

export function canAccessStudentOnboarding(profile: OnboardingProfile): boolean {
  return isIncompleteElevProfile(profile)
}

export function canAccessGuardianOnboarding(profile: OnboardingProfile): boolean {
  return isIncompleteElevProfile(profile)
}

export function getOnboardingBlockedToast(
  userType: UserType,
  flow: OnboardingFlow,
): { title: string; description: string } {
  const roleLabel = USER_TYPE_LABELS[userType]

  if (flow === "guardian" && userType === "elev") {
    return {
      title: "Cont de elev existent",
      description:
        "Contul tău de elev nu poate fi folosit pentru înregistrarea de profesor/părinte.",
    }
  }

  if (flow === "student" && userType !== "elev") {
    return {
      title: "Cont activ",
      description: `Contul tău de ${roleLabel.toLowerCase()} nu poate fi folosit pentru înregistrarea de elev.`,
    }
  }

  return {
    title: "Cont activ",
    description: `Ai deja un cont activ ca ${roleLabel.toLowerCase()}.`,
  }
}

export function isOnboardingRoute(pathname: string | null | undefined): boolean {
  return pathname === "/register" || pathname === "/register/guardian"
}

export function resolveIncompleteOnboardingPath(): string {
  if (typeof window === "undefined") return REGISTER_ONBOARDING_PATH
  if (hasGuardianOnboardingInProgress() || hasGuardianOAuthReturnPending()) {
    return GUARDIAN_ONBOARDING_PATH
  }
  return REGISTER_ONBOARDING_PATH
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
