import type { LucideIcon } from "lucide-react"
import { BookOpen, ClipboardList, Map, RotateCcw } from "lucide-react"
import type { FizicaLessonStatus, FizicaLessonType } from "@/lib/invata-fizica-config"

export type MateLessonType = FizicaLessonType
export type MateLessonStatus = FizicaLessonStatus

export interface MateSidebarItem {
  id: string
  label: string
  subtitle: string
  icon: LucideIcon
  href?: string
  disabled?: boolean
}

export const MATE_LESSON_TYPE_LABEL: Record<MateLessonType, string> = {
  invata: "Învață",
  scrie: "Scrie",
  exerseaza: "Exersează",
}

export const MATE_SIDEBAR_ITEMS: MateSidebarItem[] = [
  {
    id: "harta",
    label: "Harta lecțiilor",
    subtitle: "Parcurge traseul",
    icon: Map,
    href: "/invata/mate",
  },
  {
    id: "capitole",
    label: "Capitole",
    subtitle: "În curând",
    icon: BookOpen,
    disabled: true,
  },
  {
    id: "recapitulare",
    label: "Recapitulare",
    subtitle: "În curând",
    icon: RotateCcw,
    disabled: true,
  },
  {
    id: "teste",
    label: "Teste rapide",
    subtitle: "În curând",
    icon: ClipboardList,
    disabled: true,
  },
]

export const MATE_HUB_CARDS_ENABLED = false
export const MATE_CALENDAR_ENABLED = false

export const MATE_INSIGHT_STARTER_CHIPS = [
  "Explică conceptele din capitolul curent",
  "Ce lecție ar trebui să parcurg acum?",
  "Rezumă-mi materia din acest capitol",
]

export const MATE_SAME_SIDE_GAP = 300
export const MATE_CROSS_SIDE_GAP = 100
export const MATE_MAP_MIN_HEIGHT = 980
