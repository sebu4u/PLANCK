import type { WorkshopSubject } from "@/lib/pregatire/types"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_YEARLY_RON,
} from "@/lib/landing-earlybird"

export const PARENT_LANDING_CTA_HREF = "/register/guardian"

export const PARENT_CTA_LABEL_PRIMARY = "Creează cont de părinte"
export const PARENT_CTA_LABEL_ENROLL = "Înscrie copilul"

/** Private tutoring vs PLANCK — used only on /parinti. */
export const PARENT_TUTORING_HOUR_MIN_RON = 100
export const PARENT_TUTORING_HOUR_MAX_RON = 150
export const PARENT_TUTORING_MONTHLY_MIN_RON = 800
export const PARENT_TUTORING_MONTHLY_MAX_RON = 1200
export const PARENT_MEDITATION_FROM_RON = 7

export type ParentSubjectGroup = {
  id: WorkshopSubject
  shortLabel: string
  badge: string
  heading: string
  description: string
  groupNote: string
}

export const PARENT_SUBJECT_GROUPS: ParentSubjectGroup[] = [
  {
    id: "mate",
    shortLabel: "Mate",
    badge: "Matematică · grupă live",
    heading: "Mate de clasă și de BAC — cu profesor, nu dintr-un PDF.",
    description:
      "Copilul lucrează algebră, analiză și geometrie în grupă live, pe programa de liceu. Pune întrebări pe loc, primește teme verificate și recuperează golurile înainte de test sau de BAC.",
    groupNote: "Mai multe pregătiri pe săptămână, incluse în abonament.",
  },
  {
    id: "fizica",
    shortLabel: "Fizică",
    badge: "Fizică · grupă live",
    heading: "Formule care au sens — de la mecanică până la BAC.",
    description:
      "În grupă rezolvă probleme ca la clasă și ca la examen, pas cu pas. Profesorul vede unde se blochează, ca să nu treacă mai departe cu goluri.",
    groupNote: "Sesiuni live + înregistrări, dacă a ratat ora.",
  },
  {
    id: "info",
    shortLabel: "Info",
    badge: "Informatică · grupă live",
    heading: "Algoritmi și programare care țin la test, nu copiate.",
    description:
      "Grupa de info e pentru cine trebuie să scrie cod corect la clasă, la BAC sau la olimpiadă. Structuri de date, logică și antrenament pe probleme reale, cu feedback de la profesor.",
    groupNote: "Lucru live pe probleme, inclus în Premium.",
  },
  {
    id: "chimie",
    shortLabel: "Chimie",
    badge: "Chimie · grupă live",
    heading: "Reacții și organică — fără memorat în gol.",
    description:
      "Copilul lucrează exercițiile care contează la clasă și la BAC. Înțelege de ce se întâmplă reacția, nu doar coeficienții de pe tablă.",
    groupNote: "Grupa urmărește programa de liceu, cu recapitulări înainte de teste.",
  },
  {
    id: "biologie",
    shortLabel: "Biologie",
    badge: "Biologie · grupă live",
    heading: "Anatomie, genetică și itemi ca la examen.",
    description:
      "Materia densă e structurată pe programa de liceu. Copilul rezolvă itemi ca la BAC, cu explicații clare, recapitulări și întrebări live.",
    groupNote: "Pregătiri de grup, cu loc rezervat din cont.",
  },
]

export const PARENT_PREMIUM_BULLETS = [
  "Toate traseele de învățare, la orice materie",
  "Tutorul AI Insight 2.5, fără limite",
  "10+ pregătiri live săptămânale (cu energie)",
  "Acces complet la PlanckPass și Planck Code",
] as const

export const PARENT_FAQ_ITEMS = [
  {
    id: "cont-parinte",
    question: "Ce este un cont de părinte?",
    answer:
      "Contul de părinte e al tău, separat de al copilului. După ce îl creezi, trimiți un link de invitație copilului. El se autentifică, conturile se leagă, iar tu vezi progresul din dashboard.",
    href: PARENT_LANDING_CTA_HREF,
    linkLabel: "Creează cont de părinte",
  },
  {
    id: "leaga-copilul",
    question: "Cum leg copilul de contul meu?",
    answer:
      "Din dashboard-ul de părinte copiezi link-ul de invitație și i-l trimiți copilului. După ce se autentifică, contul lui e conectat de al tău. Poți adăuga și un alt elev, dacă e nevoie.",
  },
  {
    id: "progres",
    question: "Văd nota estimată și cât lucrează?",
    answer:
      "Da. După ce copilul e conectat, vezi statisticile de lucru, temele recente, abonamentul și o notă estimată pe baza activității — ca să știi dacă recuperează, nu doar dacă „a deschis aplicația”.",
  },
  {
    id: "cost-vs-meditatii",
    question: "Cât economisesc față de meditațiile private?",
    answer: `O meditație privată costă de obicei ${PARENT_TUTORING_HOUR_MIN_RON}–${PARENT_TUTORING_HOUR_MAX_RON} RON/oră. Două ședințe pe săptămână înseamnă circa ${PARENT_TUTORING_MONTHLY_MIN_RON}–${PARENT_TUTORING_MONTHLY_MAX_RON} RON/lună — pe o singură materie. PLANCK e ${EARLYBIRD_YEARLY_RON} RON/an (earlybird până pe ${EARLYBIRD_DEADLINE_LABEL}) pentru toate materiile, cu pregătiri live zilnice și înregistrări.`,
  },
  {
    id: "anulare",
    question: "Pot anula oricând?",
    answer:
      "Da. Anulezi din cont în aproximativ 30 de secunde. Păstrezi accesul Premium până la finalul perioadei deja plătite.",
  },
  {
    id: "materii",
    question: "Ce materii acoperă PLANCK?",
    answer:
      "Matematică, fizică, informatică, chimie și biologie — trasee complete pentru clasele 9–12, de la notă la clasă până la BAC.",
  },
  {
    id: "earlybird",
    question: `Ce înseamnă oferta earlybird de ${EARLYBIRD_YEARLY_RON} RON/an?`,
    answer: `Până pe ${EARLYBIRD_DEADLINE_LABEL} prețul de campanie pentru 1 an de Premium este ${EARLYBIRD_YEARLY_RON} RON. Creezi contul de părinte, legi copilul și activezi abonamentul. Oferta e limitată în timp.`,
    href: PARENT_LANDING_CTA_HREF,
    linkLabel: "Înscrie copilul",
  },
] as const

export const PARENT_PLANCKPASS_REWARDS = [
  { id: "nivele", label: "50 de niveluri", text: "Vezi progresul copilului, nu doar o listă bifată" },
  { id: "quante", label: "Monedă Quante", text: "Câștigă pe măsură ce învață — fără să-l tragi tu" },
  { id: "recompense", label: "Recompense reale", text: "Badge-uri, freeze, boost-uri de progres" },
  { id: "ritm", label: "Motivație zilnică", text: "Îl ține în ritm fără presiune toxică acasă" },
] as const
