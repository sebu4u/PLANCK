import type { LucideIcon } from "lucide-react"
import { Atom, Calculator, Code2 } from "lucide-react"

export type InvataSubjectId = "fizica" | "mate" | "info"

export interface InvataSubjectConfig {
  id: InvataSubjectId
  label: string
  icon: LucideIcon
  href: string
}

/** Materii disponibile în hub — extinde lista când se adaugă noi trasee. */
export const INVATA_SUBJECTS: InvataSubjectConfig[] = [
  {
    id: "fizica",
    label: "Fizică",
    icon: Atom,
    href: "/invata/fizica",
  },
  {
    id: "mate",
    label: "Matematică",
    icon: Calculator,
    href: "/invata/mate",
  },
  {
    id: "info",
    label: "Informatică",
    icon: Code2,
    href: "/invata/info",
  },
]

export type InvataSubjectFilter = "all" | InvataSubjectId

export const INVATA_HUB_SUBJECT_FILTER_STORAGE_KEY = "invata-hub-subject-filter"

export const DEFAULT_INVATA_SUBJECT_FILTER: InvataSubjectFilter = "all"

function normalizeSubjectText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const SUBJECT_ALIASES: Record<InvataSubjectId, readonly string[]> = {
  fizica: ["fizica", "physics"],
  mate: ["mate", "matematica", "math"],
  info: ["info", "informatica"],
}

function matchSubjectAlias(value: string): InvataSubjectId | null {
  const normalized = normalizeSubjectText(value)
  if (!normalized) return null
  for (const subject of INVATA_SUBJECTS) {
    if (SUBJECT_ALIASES[subject.id].includes(normalized)) return subject.id
  }
  return null
}

export function isInvataSubjectFilter(value: unknown): value is InvataSubjectFilter {
  return value === "all" || INVATA_SUBJECTS.some((subject) => subject.id === value)
}

export function readStoredInvataSubjectFilter(): InvataSubjectFilter {
  if (typeof window === "undefined") return DEFAULT_INVATA_SUBJECT_FILTER
  try {
    const stored = window.localStorage.getItem(INVATA_HUB_SUBJECT_FILTER_STORAGE_KEY)
    return isInvataSubjectFilter(stored) ? stored : DEFAULT_INVATA_SUBJECT_FILTER
  } catch {
    return DEFAULT_INVATA_SUBJECT_FILTER
  }
}

export function writeStoredInvataSubjectFilter(filter: InvataSubjectFilter) {
  try {
    window.localStorage.setItem(INVATA_HUB_SUBJECT_FILTER_STORAGE_KEY, filter)
  } catch {
    // ignore quota / private mode
  }
}

export function getInvataSubjectForChapter(chapter: {
  slug?: string | null
  title?: string | null
  materie?: string | null
  problem_category?: string | null
  is_personalized?: boolean | null
}): InvataSubjectId | null {
  const fromMaterie = matchSubjectAlias(chapter.materie)
  if (fromMaterie) return fromMaterie

  const fromCategory = matchSubjectAlias(chapter.problem_category)
  if (fromCategory) return fromCategory

  const slug = normalizeSubjectText(chapter.slug)
  const title = normalizeSubjectText(chapter.title)
  const haystack = `${slug} ${title}`

  if (/\b(matematica|algebra|geometrie|analiza)\b/.test(haystack) || slug.includes("matematica")) {
    return "mate"
  }
  if (/\b(informatica|python|programare|algoritm)\b/.test(haystack) || slug.includes("python")) {
    return "info"
  }
  if (/\b(fizica|cinematica|dinamica|optica|termodinamica|electric)\b/.test(haystack)) {
    return "fizica"
  }

  if (chapter.is_personalized === true) return null
  return "fizica"
}

export function chapterMatchesInvataSubjectFilter(
  chapter: Parameters<typeof getInvataSubjectForChapter>[0],
  filter: InvataSubjectFilter,
): boolean {
  if (filter === "all") return true
  return getInvataSubjectForChapter(chapter) === filter
}
