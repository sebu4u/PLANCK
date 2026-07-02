import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, Home, KeyRound, Library, NotebookPen, User, Users } from "lucide-react"

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

/** Hub /exerseaza and destinations opened from it (catalogs, grile, flashcards). */
export function isExerseazaRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname === "/exerseaza" ||
    pathname.startsWith("/exerseaza/") ||
    pathname.startsWith("/probleme") ||
    pathname.startsWith("/matematica/probleme") ||
    pathname.startsWith("/informatica/probleme") ||
    pathname === "/grile" ||
    pathname.startsWith("/grile/") ||
    pathname === "/invata/flashcard-uri" ||
    pathname.startsWith("/invata/flashcard-uri/")
  )
}

export function isGrileRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/grile" || pathname.startsWith("/grile/")
}

export function isProfesorTemeRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/profesor/teme" || pathname.startsWith("/profesor/teme/")
}

export function isProfesorResurseRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/profesor/resurse" || pathname.startsWith("/profesor/resurse/")
}

export function isClassroomsRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/classrooms" || pathname.startsWith("/classrooms/")
}

export function isProfesorRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === "/profesor" || pathname.startsWith("/profesor/")
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
    pathname === "/exerseaza" ||
    pathname.startsWith("/exerseaza/") ||
    pathname.startsWith("/probleme") ||
    pathname.startsWith("/abonament") ||
    pathname.startsWith("/profil") ||
    isClassroomsRoute(pathname) ||
    isProfesorRoute(pathname) ||
    isGrileRoute(pathname)
  )
}

/** Grile uses a full-screen quiz layout without the global bottom tab bar. */
export function shouldShowMobileBottomNav(
  pathname: string | null | undefined,
  isAuthenticated: boolean,
): boolean {
  return isMobileAppShellRoute(pathname, isAuthenticated) && !isGrileRoute(pathname)
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

  if (pathname === "/invata/fizica") {
    return { primary: "Fizica" }
  }

  if (pathname?.startsWith("/invata")) {
    return { primary: "Invata" }
  }

  if (pathname === "/exerseaza" || pathname?.startsWith("/exerseaza/")) {
    return { primary: "Exerseaza" }
  }

  if (pathname?.startsWith("/probleme")) {
    return { primary: "Exerseaza" }
  }

  if (pathname?.startsWith("/abonament")) {
    return { primary: "Premium" }
  }

  if (pathname?.startsWith("/profil")) {
    return { primary: "Profil" }
  }

  if (pathname === "/grile") {
    return { primary: "Grile" }
  }

  if (isClassroomsRoute(pathname)) {
    return { primary: "Clasele mele" }
  }

  if (isProfesorTemeRoute(pathname)) {
    return { primary: "Teme" }
  }

  if (isProfesorResurseRoute(pathname)) {
    return { primary: "Resurse de predare" }
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
    href: "/exerseaza",
    label: "Exerseaza",
    icon: Calculator,
    isActive: (pathname) => isExerseazaRoute(pathname),
  },
  {
    href: "/abonament",
    label: "Premium",
    icon: KeyRound,
    isActive: (pathname) => Boolean(pathname?.startsWith("/abonament")),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: User,
    isActive: (pathname) => Boolean(pathname?.startsWith("/profil")),
  },
]

export const MOBILE_BOTTOM_NAV_TEACHER_ITEMS: MobileBottomNavItem[] = [
  {
    href: "/dashboard",
    label: "Acasa",
    icon: Home,
    isActive: (pathname) =>
      pathname === "/dashboard" || pathname?.startsWith("/dashboard/") === true,
  },
  {
    href: "/classrooms",
    label: "Clasele mele",
    icon: Users,
    isActive: (pathname) => isClassroomsRoute(pathname),
  },
  {
    href: "/profesor/teme",
    label: "Teme",
    icon: NotebookPen,
    isActive: (pathname) => isProfesorTemeRoute(pathname),
  },
  {
    href: "/profesor/resurse",
    label: "Resurse",
    icon: Library,
    isActive: (pathname) => isProfesorResurseRoute(pathname),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: User,
    isActive: (pathname) => Boolean(pathname?.startsWith("/profil")),
  },
]
