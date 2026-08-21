import { isOnboardingRoute } from "@/lib/onboarding"

export const PLANCKPASS_INTRO_SEASON_LABEL = "Sezonul 1"
export const PLANCKPASS_INTRO_STORAGE_PREFIX = "planckpass_s1_intro_seen_"

export function planckPassIntroStorageKey(userId: string) {
  return `${PLANCKPASS_INTRO_STORAGE_PREFIX}${userId}`
}

export function hasLocalPlanckPassIntroSeen(userId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(planckPassIntroStorageKey(userId)) === "1"
  } catch {
    return false
  }
}

export function markLocalPlanckPassIntroSeen(userId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(planckPassIntroStorageKey(userId), "1")
  } catch {
    // ignore
  }
}

/** App surfaces where the first-entry PLANCKPASS intro should appear. */
export function isPlanckPassIntroPath(pathname: string | null | undefined): boolean {
  if (!pathname || isOnboardingRoute(pathname)) return false
  if (pathname.startsWith("/dashboard/parent")) return false
  if (pathname.startsWith("/dashboard/teacher")) return false

  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/invata") ||
    pathname.startsWith("/exerseaza") ||
    pathname.startsWith("/pregatire") ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/probleme") ||
    pathname.startsWith("/matematica") ||
    pathname.startsWith("/informatica") ||
    pathname.startsWith("/grile") ||
    pathname.startsWith("/teste") ||
    pathname.startsWith("/abonament") ||
    pathname.startsWith("/castiga")
  )
}
