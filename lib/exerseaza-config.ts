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

export const EXERSEAZA_CARDS: ExerseazaCardConfig[] = [
  {
    id: "exercitii",
    title: "Exerciții",
    subtitle: "Catalog de probleme",
    description: "Fizică, matematică și informatică — filtre pe clasă, capitol și dificultate.",
    href: "/probleme",
    icon: Calculator,
    imageSrc: EXERSEAZA_CARD_IMAGE("exercitii.png"),
    imageGradient: "from-violet-500 via-purple-500 to-indigo-600",
  },
  {
    id: "grile",
    title: "Grile",
    subtitle: "Teste grilă",
    description: "Întrebări cu variante multiple, pe clase, pentru pregătire rapidă.",
    href: "/grile",
    icon: ListChecks,
    imageSrc: EXERSEAZA_CARD_IMAGE("grile.png"),
    imageGradient: "from-emerald-500 via-teal-500 to-cyan-600",
  },
  {
    id: "teste",
    title: "Teste",
    subtitle: "În curând",
    description: "Simulări și teste complete — disponibile în curând.",
    href: null,
    icon: ClipboardList,
    imageSrc: EXERSEAZA_CARD_IMAGE("teste.png"),
    imageGradient: "from-amber-400 via-orange-400 to-rose-500",
    comingSoon: true,
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

export function formatExerseazaCount(count: number | null | undefined, singular: string, plural: string): string {
  if (count == null) return "Se încarcă..."
  if (count === 0) return `0 ${plural}`
  if (count === 1) return `1 ${singular}`
  return `${count} ${plural}`
}
