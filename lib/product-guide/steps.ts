import {
  isInvataHubRoute,
  isLearningPathItemRoute,
  isParentDashboardRoute,
  isParentTemeRoute,
  isPregatireRoute,
  isProfesorResurseRoute,
  isProfesorTemeRoute,
  isClassroomsRoute,
} from "@/lib/mobile-app-nav"
import { isStudentDashboardRoute } from "@/lib/practice-subject"
import type { UserType } from "@/lib/user-types"
import type { ProductGuideProgress, ProductGuideStep, ProductGuideStepId } from "@/lib/product-guide/types"

function isProblemsCatalogRoute(pathname: string): boolean {
  if (pathname === "/probleme" || pathname.startsWith("/probleme/pagina/")) return true
  if (pathname === "/matematica/probleme") return true
  if (pathname === "/informatica/probleme") return true
  return false
}

function isExerseazaOrCatalogRoute(pathname: string): boolean {
  if (pathname === "/exerseaza" || pathname.startsWith("/exerseaza/")) return true
  return isProblemsCatalogRoute(pathname)
}

function isTeacherDashboardRoute(pathname: string): boolean {
  return pathname === "/dashboard/teacher" || pathname === "/dashboard/teacher/"
}

function isAbonamentRoute(pathname: string): boolean {
  return pathname === "/abonament" || pathname.startsWith("/abonament/")
}

export const PRODUCT_GUIDE_STEPS: ProductGuideStep[] = [
  // —— Elev ——
  {
    id: "elev-home-subject",
    userType: "elev",
    kind: "spotlight",
    anchorId: "subject-switcher",
    title: "Acasă și materia ta",
    body: "Aici e dashboard-ul tău. Poți schimba materia din selectorul de sus.",
    requires: [],
    match: (pathname) => isStudentDashboardRoute(pathname),
  },
  {
    id: "elev-invata-trasee",
    userType: "elev",
    kind: "soft",
    title: "Traseele tale",
    body: "În Învață găsești trasee pe capitole. Alege unul și începe.",
    requires: ["elev-home-subject"],
    match: (pathname) => isInvataHubRoute(pathname),
  },
  {
    id: "elev-exerseaza",
    userType: "elev",
    kind: "soft",
    title: "Exersează pe cont propriu",
    body: "Pe lângă trasee, poți rezolva și probleme individuale aici.",
    requires: ["elev-invata-trasee"],
    requiresFlags: ["visitedLearningPathItem"],
    match: (pathname) => isExerseazaOrCatalogRoute(pathname),
  },
  {
    id: "elev-probleme",
    userType: "elev",
    kind: "soft",
    title: "Catalogul de probleme",
    body: "Filtrează după clasă, capitol și dificultate, apoi rezolvă.",
    requires: ["elev-exerseaza"],
    match: (pathname) => isProblemsCatalogRoute(pathname),
  },
  {
    id: "elev-pregatire",
    userType: "elev",
    kind: "soft",
    title: "Pregătiri live",
    body: "Vezi sesiunile programate și intră la pregătiri când ești gata.",
    requires: ["elev-probleme"],
    match: (pathname) => isPregatireRoute(pathname) || isStudentDashboardRoute(pathname),
  },
  {
    id: "elev-create-path",
    userType: "elev",
    kind: "spotlight",
    anchorId: "create-path",
    title: "Creează un traseu",
    body: "Scrie ce vrei să înveți și generăm un traseu de la zero pentru tine.",
    requires: ["elev-home-subject", "elev-invata-trasee", "elev-exerseaza"],
    match: (pathname) => isInvataHubRoute(pathname),
  },

  // —— Părinte ——
  {
    id: "parent-home",
    userType: "parinte",
    kind: "soft",
    title: "Progresul copilului",
    body: "Aici vezi cum evoluează. Dacă nu e legat încă, adaugă-l din acest ecran.",
    requires: [],
    match: (pathname) => isParentDashboardRoute(pathname),
  },
  {
    id: "parent-teme",
    userType: "parinte",
    kind: "soft",
    title: "Temele",
    body: "Urmărește statusul temelor primite de copil.",
    requires: ["parent-home"],
    match: (pathname) => isParentTemeRoute(pathname),
  },
  {
    id: "parent-abonament",
    userType: "parinte",
    kind: "soft",
    title: "Abonamentul",
    body: "De aici gestionezi abonamentul elevului.",
    requires: ["parent-teme"],
    match: (pathname) => isAbonamentRoute(pathname),
  },

  // —— Profesor ——
  {
    id: "teacher-home",
    userType: "profesor",
    kind: "soft",
    title: "Clasele tale",
    body: "De pe dashboard creezi clase și vezi ce ai de verificat.",
    requires: [],
    match: (pathname) => isTeacherDashboardRoute(pathname),
  },
  {
    id: "teacher-classrooms",
    userType: "profesor",
    kind: "soft",
    title: "Codul clasei",
    body: "Deschide o clasă și împărtășește codul de join elevilor.",
    requires: ["teacher-home"],
    match: (pathname) => isClassroomsRoute(pathname),
  },
  {
    id: "teacher-teme",
    userType: "profesor",
    kind: "soft",
    title: "Teme",
    body: "Creează teme noi și verifică lucrările elevilor.",
    requires: ["teacher-classrooms"],
    match: (pathname) => isProfesorTemeRoute(pathname),
  },
  {
    id: "teacher-resurse",
    userType: "profesor",
    kind: "soft",
    title: "Resurse",
    body: "Găsește probleme, grile și cursuri pe care le poți folosi la predare.",
    requires: ["teacher-teme"],
    match: (pathname) => isProfesorResurseRoute(pathname),
  },
]

export function getProductGuideStepsForUserType(userType: UserType): ProductGuideStep[] {
  return PRODUCT_GUIDE_STEPS.filter((step) => step.userType === userType)
}

export function pickActiveProductGuideStep(
  userType: UserType,
  pathname: string,
  progress: ProductGuideProgress,
): ProductGuideStep | null {
  const seen = new Set<ProductGuideStepId>(progress.seen)
  const steps = getProductGuideStepsForUserType(userType)

  for (const step of steps) {
    if (seen.has(step.id)) continue
    if (!step.requires.every((id) => seen.has(id))) continue
    if (step.requiresFlags?.some((flag) => !progress.flags[flag])) continue
    if (!step.match(pathname)) continue
    return step
  }

  return null
}

export function shouldTrackLearningPathItemVisit(pathname: string | null | undefined): boolean {
  return isLearningPathItemRoute(pathname)
}
