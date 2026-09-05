import { PLATFORM_STATS, TESTIMONIALS_COUNT } from "@/lib/platform-marketing"
import { HOMEPAGE_TESTIMONIALS } from "@/lib/homepage-testimonials"
import {
  WORKSHOP_SUBJECTS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopSubject,
} from "@/lib/pregatire/types"

export const PLANCK_WEEK_CTA = "Rezervă-ți locul gratuit →"

export const PLANCK_WEEK_DATES = "10-14 septembrie · Planck Week"

export const PLANCK_WEEK_MOBILE_CALENDAR_FROM = "2026-09-10"
export const PLANCK_WEEK_MOBILE_CALENDAR_TO = "2026-09-14"

export const PLANCK_WEEK_HEADLINE = "Planck Week. Meditații live gratuite, 10–14 septembrie."

export const PLANCK_WEEK_HERO_BULLETS = [
  "10–14 septembrie",
  "Cursuri live și înregistrate",
  "Strategie clară pentru parcurgerea materiei",
  "Complet GRATUIT",
] as const

export const PLANCK_WEEK_MICROCOPY = "Fără card. Fără abonament ascuns. Anulezi oricând."

export const PLANCK_WEEK_FINAL_MICROCOPY = "Fără card. Anulezi oricând după Planck Week."

export const PLANCK_WEEK_FINAL_HEADLINE = "Planck Week ține 10–14 septembrie."

export const PLANCK_WEEK_FINAL_SCARCITY =
  "Locurile sunt limitate, ca mentorii să poată răspunde fiecărui elev."

export const PLANCK_WEEK_PREGATIRE_PATH = "/pregatire?from=planck-week"

/** Inclusive end of Planck Week in Bucharest (promo overlay stays up through this day). */
const PLANCK_WEEK_PROMO_ENDS_AT = new Date("2026-09-15T00:00:00+03:00")

export function getPlanckWeekDashboardPromoSessionKey(userId: string) {
  return `planck_week_dashboard_promo_session_${userId}`
}

export function isPlanckWeekDashboardPromoActive(now = new Date()) {
  return now.getTime() < PLANCK_WEEK_PROMO_ENDS_AT.getTime()
}

export const PLANCK_WEEK_STATS = [
  { value: PLATFORM_STATS.activeUsers, label: "elevi pregătiți" },
  { value: "4,8/5", label: `${TESTIMONIALS_COUNT} recenzii` },
  { value: "5", label: "materii, câte un olimpic la fiecare" },
] as const

export const PLANCK_WEEK_DIFFERENTIATORS = [
  {
    id: "olimpici",
    title: "Predate de olimpici, nu de profesori vechi",
    body: "Fiecare materie are un olimpic care a dat BAC-ul recent și știe ce se cere azi.",
  },
  {
    id: "mentor",
    title: "Mentorat 24/7, nu doar la oră",
    body: "Nelămurire seara? Răspuns de la un mentor uman în maximum 24 de ore.",
  },
  {
    id: "teme",
    title: "Teme verificate, nu doar date",
    body: "Fiecare temă e verificată pe platformă, deci știi exact unde stai.",
  },
] as const

export const PLANCK_WEEK_STEPS = [
  {
    step: "1",
    title: "Îți alegi materia(le)",
    body: "Alegi una sau mai multe din cele 5 materii disponibile: Fizică, Matematică, Informatică, Biologie, Chimie.",
  },
  {
    step: "2",
    title: "Intri la 2 ședințe live/materie",
    body: "Ședințele au loc în timp real, în grup, și rămân înregistrate — le poți relua oricând dacă ai ratat ceva.",
  },
  {
    step: "3",
    title: "Primești acces la mentor și la teme",
    body: "Un mentor dedicat îți răspunde la întrebări, iar temele verificate îți arată exact ce mai ai de recuperat.",
  },
  {
    step: "4",
    title: "Alegi dacă continui",
    body: "După Planck Week, decizi tu dacă vrei să continui pregătirea. Nimic automat, nimic ascuns.",
  },
] as const

const TESTIMONIAL_IDS = ["student-1", "student-2", "student-3"] as const

export const PLANCK_WEEK_TESTIMONIALS = TESTIMONIAL_IDS.flatMap((id, index) => {
  const testimonial = HOMEPAGE_TESTIMONIALS.find((item) => item.id === id)
  if (!testimonial) return []
  return [
    {
      ...testimonial,
      avatarSrc: `/reviews/avatar-${index + 1}.webp`,
    },
  ]
})

export const PLANCK_WEEK_FAQ = [
  {
    id: "gratuit",
    question: "E chiar gratuit, fără niciun cost ascuns?",
    answer: "Da. Toată Planck Week e gratuită, fără card la înscriere.",
  },
  {
    id: "dupa",
    question: "Ce se întâmplă după Planck Week?",
    answer:
      "Decizi tu dacă vrei să continui cu abonamentul Planck Premium, care include acces nelimitat la meditații live prin sistemul de energie, plus tot restul platformei (probleme, AI tutor, simulări).",
  },
  {
    id: "live",
    question: "Meditațiile sunt live sau înregistrate?",
    answer:
      "Ambele — participi live, dar dacă ratezi o ședință, o găsești înregistrată pe platformă.",
  },
  {
    id: "locuri",
    question: "Câte locuri sunt disponibile?",
    answer:
      "Grupele au un număr limitat de locuri, pentru ca mentorii să poată răspunde efectiv fiecărui elev.",
  },
] as const

export const PLANCK_WEEK_SUBJECT_OPTIONS = WORKSHOP_SUBJECTS.map((id) => ({
  id,
  label: WORKSHOP_SUBJECT_LABELS[id],
}))

export const PLANCK_WEEK_TEACHER_VIDEOS = [
  {
    teacherId: "briana-bucur",
    name: "Bucur Briana",
    subject: "info" as const,
    youtubeUrl: "https://www.youtube.com/shorts/1gT4ak1Psuc",
  },
  {
    teacherId: "denisa",
    name: "Banu Denisa",
    subject: "chimie" as const,
    youtubeUrl: "https://www.youtube.com/shorts/Zagb-UZzbt4",
  },
  {
    teacherId: "pavel-andrei",
    name: "Pavel Andrei",
    subject: "mate" as const,
    youtubeUrl: "https://www.youtube.com/shorts/GQwGmeXVpaQ",
  },
  {
    teacherId: "diana",
    name: "Rotaru Diana",
    subject: "biologie" as const,
    youtubeUrl: "https://www.youtube.com/shorts/cVv0760eTu0",
  },
] as const

export function parsePlanckWeekSubjects(value: string | null | undefined): WorkshopSubject[] {
  if (!value) return []
  const allowed = new Set<string>(WORKSHOP_SUBJECTS)
  const seen = new Set<WorkshopSubject>()
  const result: WorkshopSubject[] = []
  for (const raw of value.split(",")) {
    const key = raw.trim() as WorkshopSubject
    if (!allowed.has(key) || seen.has(key)) continue
    seen.add(key)
    result.push(key)
  }
  return result
}

export function formatPlanckWeekSubjects(subjects: WorkshopSubject[]): string {
  return subjects.map((id) => WORKSHOP_SUBJECT_LABELS[id]).join(", ")
}
