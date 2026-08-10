import type { LucideIcon } from "lucide-react"
import { Atom, Calculator, Code2, FlaskConical, Leaf } from "lucide-react"

/** Slug-uri publice pentru cursurile text pe materii. */
export const CURSURI_SUBJECT_IDS = [
  "fizica",
  "mate",
  "info-cpp",
  "info-py",
  "chimie",
  "biologie",
] as const

export type CursuriSubjectId = (typeof CURSURI_SUBJECT_IDS)[number]

export interface CursuriSubjectConfig {
  id: CursuriSubjectId
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  href: string
}

export const CURSURI_SUBJECTS: CursuriSubjectConfig[] = [
  {
    id: "fizica",
    label: "Fizică",
    shortLabel: "Fizică",
    description: "Lecții de fizică pe clase, capitole și lecții.",
    icon: Atom,
    href: "/invata/cursuri/fizica",
  },
  {
    id: "mate",
    label: "Matematică",
    shortLabel: "Mate",
    description: "Lecții de matematică pe clase, capitole și lecții.",
    icon: Calculator,
    href: "/invata/cursuri/mate",
  },
  {
    id: "info-cpp",
    label: "Informatică C++",
    shortLabel: "Info C++",
    description: "Lecții de informatică în C++ pe clase, capitole și lecții.",
    icon: Code2,
    href: "/invata/cursuri/info-cpp",
  },
  {
    id: "info-py",
    label: "Informatică Python",
    shortLabel: "Info Python",
    description: "Lecții de informatică în Python pe clase, capitole și lecții.",
    icon: Code2,
    href: "/invata/cursuri/info-py",
  },
  {
    id: "chimie",
    label: "Chimie",
    shortLabel: "Chimie",
    description: "Lecții de chimie pe clase, capitole și lecții.",
    icon: FlaskConical,
    href: "/invata/cursuri/chimie",
  },
  {
    id: "biologie",
    label: "Biologie",
    shortLabel: "Biologie",
    description: "Lecții de biologie pe clase, capitole și lecții.",
    icon: Leaf,
    href: "/invata/cursuri/biologie",
  },
]

export function isCursuriSubjectId(value: string): value is CursuriSubjectId {
  return (CURSURI_SUBJECT_IDS as readonly string[]).includes(value)
}

export function getCursuriSubject(id: string): CursuriSubjectConfig | null {
  return CURSURI_SUBJECTS.find((s) => s.id === id) ?? null
}

export function cursuriSubjectHref(subject: CursuriSubjectId, slug?: string): string {
  const base = `/invata/cursuri/${subject}`
  return slug ? `${base}/${slug}` : base
}

export const DEFAULT_CURSURI_SUBJECT: CursuriSubjectId = "fizica"
