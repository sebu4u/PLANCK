import type { LucideIcon } from "lucide-react"
import { BookOpen, ClipboardList, Map, RotateCcw } from "lucide-react"
import type { FizicaLessonStatus, FizicaLessonType } from "@/lib/invata-fizica-config"

export type InfoLessonType = FizicaLessonType
export type InfoLessonStatus = FizicaLessonStatus

export interface InfoSidebarItem {
  id: string
  label: string
  subtitle: string
  icon: LucideIcon
  href?: string
  disabled?: boolean
}

export const INFO_LESSON_TYPE_LABEL: Record<InfoLessonType, string> = {
  invata: "Învață",
  scrie: "Scrie",
  exerseaza: "Exersează",
}

export const INFO_SIDEBAR_ITEMS: InfoSidebarItem[] = [
  {
    id: "harta",
    label: "Harta lecțiilor",
    subtitle: "Parcurge traseul",
    icon: Map,
    href: "/invata/info",
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

export const INFO_HUB_CARDS_ENABLED = false
export const INFO_CALENDAR_ENABLED = false

export const INFO_INSIGHT_STARTER_CHIPS = [
  "Explică conceptele din capitolul curent",
  "Ce lecție ar trebui să parcurg acum?",
  "Rezumă-mi algoritmii din acest capitol",
]

export const INFO_SAME_SIDE_GAP = 300
export const INFO_CROSS_SIDE_GAP = 100
export const INFO_MAP_MIN_HEIGHT = 980
