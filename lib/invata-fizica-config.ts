import type { LucideIcon } from "lucide-react"
import { BookOpen, ClipboardList, Map, RotateCcw } from "lucide-react"

export type FizicaLessonType = "invata" | "scrie" | "exerseaza"

export type FizicaLessonStatus = "active" | "available" | "completed" | "locked"

export interface FizicaSidebarItem {
  id: string
  label: string
  subtitle: string
  icon: LucideIcon
  href?: string
  disabled?: boolean
}

export interface FizicaPlaceholderLesson {
  id: string
  title: string
  type: FizicaLessonType
  durationMinutes: number
  status: FizicaLessonStatus
  /** Card position relative to node */
  cardPosition: "above" | "below"
  /** Percentage-based position inside the map canvas */
  xPercent: number
  y: number
}

export const FIZICA_LESSON_TYPE_LABEL: Record<FizicaLessonType, string> = {
  invata: "Învață",
  scrie: "Scrie",
  exerseaza: "Exersează",
}

export const FIZICA_SIDEBAR_ITEMS: FizicaSidebarItem[] = [
  {
    id: "harta",
    label: "Harta lecțiilor",
    subtitle: "Parcurge traseul",
    icon: Map,
    href: "/invata/fizica",
  },
  {
    id: "capitole",
    label: "Capitole",
    subtitle: "12 capitole",
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

/** Set to `true` to show the bottom hub cards strip on /invata/fizica */
export const FIZICA_HUB_CARDS_ENABLED = false

/** Set to `true` to show the calendar card on /invata/fizica */
export const FIZICA_CALENDAR_ENABLED = true

export type FizicaCalendarEventType = "pregatire" | "curs" | "workshop" | "simulare"

export const FIZICA_CALENDAR_EVENT_TYPES: Record<
  FizicaCalendarEventType,
  { label: string; defaultColor: string }
> = {
  pregatire: { label: "Pregătire", defaultColor: "#2563eb" },
  curs: { label: "Curs", defaultColor: "#16a34a" },
  workshop: { label: "Workshop", defaultColor: "#9333ea" },
  simulare: { label: "Simulare", defaultColor: "#ca8a04" },
}

export const FIZICA_CALENDAR_EVENT_TYPE_LIST = Object.keys(
  FIZICA_CALENDAR_EVENT_TYPES,
) as FizicaCalendarEventType[]

/** Proba scrisă la alegere (Fizică) — sesiunea iunie-iulie 2026. */
export const FIZICA_BAC_EXAM_DATE = new Date(2026, 6, 2, 23, 59, 59, 999)

export function getFizicaBacRemainingDays(referenceDate = new Date()): number {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const examDay = new Date(FIZICA_BAC_EXAM_DATE)
  examDay.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((examDay.getTime() - today.getTime()) / 86_400_000))
}

export const FIZICA_INSIGHT_STARTER_CHIPS = [
  "Explică conceptele din capitolul curent",
  "Ce lecție ar trebui să parcurg acum?",
  "Rezumă-mi materia din acest capitol",
]

/** Vertical spacing between consecutive lessons on the same side */
export const FIZICA_SAME_SIDE_GAP = 300

/** Vertical spacing when switching between left and right columns */
export const FIZICA_CROSS_SIDE_GAP = 100

/** Placeholder lessons arranged in a zig-zag, matching the reference layout. */
export const FIZICA_PLACEHOLDER_LESSONS: FizicaPlaceholderLesson[] = [
  {
    id: "lectie-1",
    title: "Diviziuni Topografice, Axe și Planuri ale Corpului Uman",
    type: "invata",
    durationMinutes: 17,
    status: "active",
    cardPosition: "below",
    xPercent: 38,
    y: 32,
  },
  {
    id: "lectie-2",
    title: "Sistemul de coordonate și repere",
    type: "invata",
    durationMinutes: 17,
    status: "available",
    cardPosition: "above",
    xPercent: 72,
    y: 150,
  },
  {
    id: "lectie-3",
    title: "Vectori și operații de bază",
    type: "scrie",
    durationMinutes: 2,
    status: "available",
    cardPosition: "below",
    xPercent: 72,
    y: 410,
  },
  {
    id: "lectie-4",
    title: "Mișcare rectilinie uniformă",
    type: "invata",
    durationMinutes: 3,
    status: "available",
    cardPosition: "above",
    xPercent: 28,
    y: 430,
  },
  {
    id: "lectie-5",
    title: "Accelerația și graficele de mișcare",
    type: "invata",
    durationMinutes: 3,
    status: "available",
    cardPosition: "below",
    xPercent: 28,
    y: 690,
  },
]

/** Minimum map canvas height for desktop layout */
export const FIZICA_MAP_MIN_HEIGHT = 980
