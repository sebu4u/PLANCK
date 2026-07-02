import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, ClipboardList, ListChecks, Route } from "lucide-react"
import { formatExerseazaCount } from "@/lib/exerseaza-config"
import type { ExerseazaCounts } from "@/lib/exerseaza-counts"

export type ProfesorResurseCardId =
  | "exercitii"
  | "grile"
  | "teste"
  | "cursuri"
  | "trasee_invata"

export interface ProfesorResurseCardConfig {
  id: ProfesorResurseCardId
  title: string
  subtitle: string
  description: string
  href: string | null
  icon: LucideIcon
  imageGradient: string
  comingSoon?: boolean
}

export const PROFESOR_RESURSE_CARDS: ProfesorResurseCardConfig[] = [
  {
    id: "exercitii",
    title: "Exerciții",
    subtitle: "Catalog de probleme",
    description: "Fizică, matematică și informatică — filtre pe clasă, capitol și dificultate.",
    href: "/probleme",
    icon: Calculator,
    imageGradient: "from-violet-500 via-purple-500 to-indigo-600",
  },
  {
    id: "grile",
    title: "Grile",
    subtitle: "Teste grilă",
    description: "Întrebări cu variante multiple, pe clase, pentru pregătire rapidă.",
    href: "/grile",
    icon: ListChecks,
    imageGradient: "from-emerald-500 via-teal-500 to-cyan-600",
  },
  {
    id: "teste",
    title: "Teste",
    subtitle: "În curând",
    description: "Simulări și teste complete — disponibile în curând.",
    href: null,
    icon: ClipboardList,
    imageGradient: "from-amber-400 via-orange-400 to-rose-500",
    comingSoon: true,
  },
  {
    id: "cursuri",
    title: "Cursuri",
    subtitle: "Lecții structurate",
    description: "Lecții de fizică organizate pe clase, capitole și subiecte.",
    href: "/cursuri",
    icon: BookOpen,
    imageGradient: "from-sky-500 via-blue-500 to-indigo-600",
  },
  {
    id: "trasee_invata",
    title: "Trasee de învățare",
    subtitle: "Parcurs interactiv",
    description: "Capitole, lecții și itemi din hub-ul Învață — pentru explorare sau recomandare.",
    href: "/invata",
    icon: Route,
    imageGradient: "from-fuchsia-500 via-pink-500 to-rose-500",
  },
]

export function getProfesorResurseCardCountLabel(
  card: ProfesorResurseCardConfig,
  counts: ExerseazaCounts,
): string {
  switch (card.id) {
    case "exercitii":
      return formatExerseazaCount(counts.exercises, "problemă", "probleme")
    case "grile":
      return formatExerseazaCount(counts.grile, "grilă", "grile")
    case "teste":
      return "În curând"
    case "cursuri":
      return "Catalog complet"
    case "trasee_invata":
      return "Hub interactiv"
    default:
      return ""
  }
}
