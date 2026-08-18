import type { OnboardingSubjectId } from "@/lib/onboarding"
import { isWorkshopSubject, type WorkshopSubject } from "@/lib/pregatire/types"

export type LandingSubjectGroup = {
  id: WorkshopSubject
  shortLabel: string
  badge: string
  heading: string
  description: string
  groupNote: string
}

export const LANDING_SUBJECT_GROUPS: LandingSubjectGroup[] = [
  {
    id: "mate",
    shortLabel: "Mate",
    badge: "Matematică · grupă live",
    heading: "Algebră, analiză și geometrie — cu un profesor, nu dintr-un PDF.",
    description:
      "Grupa de meditații la mate acoperă programa de clasă, BAC și antrenament pentru performanță. Lucrezi live, pui întrebări pe loc și primești teme verificate.",
    groupNote: "Mai multe pregătiri pe săptămână, incluse în Premium.",
  },
  {
    id: "fizica",
    shortLabel: "Fizică",
    badge: "Fizică · grupă live",
    heading: "De la mecanică la electricitate, cu formule care au sens.",
    description:
      "În grupă lucrezi probleme ca la clasă și ca la BAC, pas cu pas. Profesorul vede unde te blochezi — nu treci mai departe cu goluri.",
    groupNote: "Sesiuni live + înregistrări, dacă ai ratat ora.",
  },
  {
    id: "info",
    shortLabel: "Info",
    badge: "Informatică · grupă live",
    heading: "Algoritmi și programare, de la primele probleme până la olimpiadă.",
    description:
      "Grupa de info e pentru cine vrea să scrie cod care ține la test, nu doar să copieze soluții. Structuri de date, logică și antrenament pe probleme reale.",
    groupNote: "Lucru live pe probleme, cu feedback de la profesor.",
  },
  {
    id: "chimie",
    shortLabel: "Chimie",
    badge: "Chimie · grupă live",
    heading: "Reacții, stoechiometrie și organică — fără să memorezi în gol.",
    description:
      "În meditație lucrezi exercițiile care contează la clasă și la BAC. Înțelegi de ce se întâmplă reacția, nu doar coeficienții de pe tablă.",
    groupNote: "Grupa urmărește programa de liceu, cu recapitulări înainte de teste.",
  },
  {
    id: "biologie",
    shortLabel: "Biologie",
    badge: "Biologie · grupă live",
    heading: "Anatomie, genetică și ecologie, legate de programa de liceu.",
    description:
      "Grupa de bio te ajută să structurezi materia densă și să rezolvi itemi ca la examen. Explicații clare, recapitulări și întrebări live.",
    groupNote: "Pregătiri de grup, cu loc rezervat din cont.",
  },
]

const WORKSHOP_TO_ONBOARDING_SUBJECT: Partial<Record<WorkshopSubject, OnboardingSubjectId>> = {
  mate: "matematica",
  fizica: "fizica",
  info: "informatica",
  biologie: "biologie",
}

export function parseLandingSubjectParam(value: string | null | undefined): WorkshopSubject {
  return isWorkshopSubject(value) ? value : "mate"
}

export function getLandingSubjectGroup(id: WorkshopSubject) {
  return LANDING_SUBJECT_GROUPS.find((subject) => subject.id === id) ?? LANDING_SUBJECT_GROUPS[0]!
}

export function workshopSubjectToOnboardingSubject(
  subject: WorkshopSubject,
): OnboardingSubjectId | null {
  return WORKSHOP_TO_ONBOARDING_SUBJECT[subject] ?? null
}
