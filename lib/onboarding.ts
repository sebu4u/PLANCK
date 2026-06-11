export const OAUTH_ONBOARDING_PARAM = "oauth"
export const REGISTER_ONBOARDING_PATH = `/register?onboarding=${OAUTH_ONBOARDING_PARAM}`
export const ONBOARDING_REDIRECT_STORAGE_KEY = "planck_onboarding_redirect_after_complete"

export type OnboardingProfile = {
  onboarding_completed_at?: string | null
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
