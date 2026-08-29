import type { LucideIcon } from "lucide-react"
import { Calculator, ClipboardList, Layers, ListChecks } from "lucide-react"
import {
  PRACTICE_SUBJECTS,
  type PracticeSubjectConfig,
  type PracticeSubjectId,
} from "@/lib/practice-subject"

export type ExerseazaSubjectId = PracticeSubjectId
export type ExerseazaSubjectConfig = PracticeSubjectConfig

/** Materii disponibile în hub Exersează. */
export const EXERSEAZA_SUBJECTS = PRACTICE_SUBJECTS

export type ExerseazaCardId = "exercitii" | "grile" | "teste" | "flashcard"

const EXERSEAZA_CARD_IMAGE = (filename: string) => `/images/exerseaza/${filename}`

export interface ExerseazaCardConfig {
  id: ExerseazaCardId
  title: string
  subtitle: string
  description: string
  href: string | null
  icon: LucideIcon
  /** Optional custom image path — replace when assets are ready */
  imageSrc?: string
  /** Tailwind gradient classes used as placeholder when imageSrc is absent */
  imageGradient: string
  comingSoon?: boolean
}

const EXERCISES_HREF: Record<PracticeSubjectId, string> = {
  fizica: "/probleme",
  matematica: "/matematica/probleme",
  informatica: "/informatica/probleme",
}

const EXERCISES_DESCRIPTION: Record<PracticeSubjectId, string> = {
  fizica: "Probleme de fizică — filtre pe clasă, capitol și dificultate.",
  matematica: "Probleme de matematică — filtre pe clasă, capitol și dificultate.",
  informatica: "Probleme de informatică — C++ și Python, pe clasă și capitol.",
}

export function getExerseazaHubIntro(subject: PracticeSubjectId): string {
  switch (subject) {
    case "matematica":
      return "Alege cum vrei să exersezi la matematică: probleme, teste sau flashcard-uri."
    case "informatica":
      return "Alege cum vrei să exersezi la informatică: probleme, teste sau flashcard-uri."
    default:
      return "Alege cum vrei să exersezi la fizică: probleme, grile, teste sau flashcard-uri."
  }
}

export function getExerseazaCards(subject: PracticeSubjectId): ExerseazaCardConfig[] {
  const grileAvailable = subject === "fizica"

  return [
    {
      id: "exercitii",
      title: "Exerciții",
      subtitle: "Catalog de probleme",
      description: EXERCISES_DESCRIPTION[subject],
      href: EXERCISES_HREF[subject],
      icon: Calculator,
      imageSrc: EXERSEAZA_CARD_IMAGE("exercitii.png"),
      imageGradient: "from-violet-500 via-purple-500 to-indigo-600",
    },
    {
      id: "grile",
      title: "Grile",
      subtitle: grileAvailable ? "Teste grilă" : "În curând",
      description: grileAvailable
        ? "Întrebări cu variante multiple, pe clase, pentru pregătire rapidă."
        : "Grilele pentru această materie vor fi disponibile în curând.",
      href: grileAvailable ? "/grile" : null,
      icon: ListChecks,
      imageSrc: EXERSEAZA_CARD_IMAGE("grile.png"),
      imageGradient: "from-emerald-500 via-teal-500 to-cyan-600",
      comingSoon: !grileAvailable,
    },
    {
      id: "teste",
      title: "Teste",
      subtitle: "Simulări cronometrate",
      description: "Teste pe clasă și capitol — cu limită de timp și review cu Insight.",
      href: `/teste?subject=${subject}`,
      icon: ClipboardList,
      imageSrc: EXERSEAZA_CARD_IMAGE("teste.png"),
      imageGradient: "from-amber-400 via-orange-400 to-rose-500",
    },
    {
      id: "flashcard",
      title: "Flashcard",
      subtitle: "Revizuire rapidă",
      description: "Carduri generate din traseele de învățare, pentru fixarea conceptelor.",
      href: "/invata/flashcard-uri",
      icon: Layers,
      imageSrc: EXERSEAZA_CARD_IMAGE("flashcard.png"),
      imageGradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    },
  ]
}

/** Fizică — used where a static card list is enough (profesor hub). */
export const EXERSEAZA_CARDS: ExerseazaCardConfig[] = getExerseazaCards("fizica")

export function formatExerseazaCount(count: number | null | undefined, singular: string, plural: string): string {
  if (count == null) return "Se încarcă..."
  if (count === 0) return `0 ${plural}`
  if (count === 1) return `1 ${singular}`
  return `${count} ${plural}`
}
