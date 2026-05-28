import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, Home, User, Users } from "lucide-react"

export const MOBILE_BOTTOM_NAV_HEIGHT = "4.5rem"

/** Scoped to body.mobile-app-shell below 948px — safe on desktop and non-shell routes */
export const MOBILE_BOTTOM_NAV_PADDING_CLASS = "mobile-bottom-nav-pad"
export const MOBILE_BOTTOM_NAV_OFFSET_CLASS = "mobile-bottom-nav-offset"
export const MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS = "mobile-bottom-nav-fab-offset"
export const MOBILE_BOTTOM_NAV_QUIZ_PADDING_CLASS = "mobile-bottom-nav-quiz-pad"
export const MOBILE_BOTTOM_NAV_FAB_ABOVE_QUIZ_CLASS = "mobile-bottom-nav-fab-above-quiz"
export const MOBILE_BOTTOM_NAV_DRAFT_PADDING_CLASS = "mobile-bottom-nav-draft-pad"
export const MOBILE_BOTTOM_NAV_DRAFT_PREVIEW_PADDING_CLASS = "mobile-bottom-nav-draft-preview-pad"

const LEARNING_PATH_ITEM_ROUTE = /^\/invata\/[^/]+\/[^/]+\/\d+\/?$/
const LEARNING_PATH_LESSON_ROUTE = /^\/invata\/[^/]+\/[^/]+\/?$/

export function isLearningPathItemRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return LEARNING_PATH_ITEM_ROUTE.test(pathname)
}

/** Lecție cu listă de itemi (/invata/capitol/lectie), fără index de item. */
export function isLearningPathLessonRoute(pathname: string | null | undefined): boolean {
  if (!pathname || isLearningPathItemRoute(pathname)) return false
  return LEARNING_PATH_LESSON_ROUTE.test(pathname)
}

export function isMobileLessonItemsShellRoute(
  pathname: string | null | undefined,
  isAuthenticated: boolean,
): boolean {
  return isAuthenticated && isLearningPathLessonRoute(pathname)
}

/** Hub learning paths list (`/invata` exact, not lesson/item routes). */
export function isInvataHubRoute(pathname: string | null | undefined): boolean {
  return pathname === "/invata"
}

export function isMobileAppShellRoute(
  pathname: string | null | undefined,
  isAuthenticated: boolean,
): boolean {
  if (!isAuthenticated || !pathname) return false
  if (isLearningPathItemRoute(pathname) || isLearningPathLessonRoute(pathname)) return false

  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/invata") ||
    pathname.startsWith("/probleme") ||
    pathname.startsWith("/classrooms") ||
    pathname.startsWith("/profil") ||
    pathname === "/grile"
  )
}

function formatMobileTopBarDate(): string {
  const d = new Date()
  const weekdays = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]
  const months = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"]
  return `${weekdays[d.getDay()]} • ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export interface MobileTopBarContent {
  primary: string
  secondary?: string
}

export function getMobileTopBarContent(
  pathname: string | null | undefined,
  displayName: string,
): MobileTopBarContent {
  const isDashboard =
    pathname === "/dashboard" || pathname?.startsWith("/dashboard/") === true

  if (isDashboard) {
    return {
      primary: `Bună, ${displayName} 👋`,
      secondary: formatMobileTopBarDate(),
    }
  }

  if (pathname?.startsWith("/invata")) {
    return { primary: "Invata" }
  }

  if (pathname?.startsWith("/probleme")) {
    return { primary: "Exerseaza" }
  }

  if (pathname?.startsWith("/classrooms")) {
    return { primary: "Classroom" }
  }

  if (pathname?.startsWith("/profil")) {
    return { primary: "Profil" }
  }

  if (pathname === "/grile") {
    return { primary: "Grile" }
  }

  return { primary: "PLANCK" }
}

export interface MobileBottomNavItem {
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string | null | undefined) => boolean
}

export const MOBILE_BOTTOM_NAV_ITEMS: MobileBottomNavItem[] = [
  {
    href: "/dashboard",
    label: "Acasa",
    icon: Home,
    isActive: (pathname) =>
      pathname === "/dashboard" || pathname?.startsWith("/dashboard/") === true,
  },
  {
    href: "/invata",
    label: "Invata",
    icon: BookOpen,
    isActive: (pathname) =>
      Boolean(pathname?.startsWith("/invata")) && !isLearningPathItemRoute(pathname),
  },
  {
    href: "/probleme",
    label: "Exerseaza",
    icon: Calculator,
    isActive: (pathname) => Boolean(pathname?.startsWith("/probleme")),
  },
  {
    href: "/classrooms",
    label: "Classroom",
    icon: Users,
    isActive: (pathname) => Boolean(pathname?.startsWith("/classrooms")),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: User,
    isActive: (pathname) => Boolean(pathname?.startsWith("/profil")),
  },
]
