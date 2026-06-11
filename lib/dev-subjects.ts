import { AI_LEARNING_PATH_MARKER } from "@/lib/learning-path-ai"
import { BIOLOGIE_LEARNING_PATH_MARKER } from "@/lib/learning-path-biologie"
import { INFORMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-informatica"
import { MATEMATICA_LEARNING_PATH_MARKER } from "@/lib/learning-path-matematica"

export const ALL_DEV_SUBJECTS = ["matematica", "fizica", "informatica", "biologie", "ai"] as const

export type DevSubjectKey = (typeof ALL_DEV_SUBJECTS)[number]
export type ApiDevSubject = "math" | "physics" | "informatics" | "biology" | "ai" | "all"
export type DevCatalog = "math" | "physics" | "informatics"

export const DEV_SUBJECT_LABELS: Record<DevSubjectKey, string> = {
  matematica: "Matematică",
  fizica: "Fizică",
  informatica: "Informatică",
  biologie: "Biologie",
  ai: "AI",
}

const subjectSet = new Set<string>(ALL_DEV_SUBJECTS)

export function isDevSubjectKey(value: unknown): value is DevSubjectKey {
  return typeof value === "string" && subjectSet.has(value)
}

export function normalizeDevSubjects(raw: unknown): DevSubjectKey[] | null {
  if (!Array.isArray(raw)) return null

  const subjects: DevSubjectKey[] = []
  for (const item of raw) {
    if (!isDevSubjectKey(item)) continue
    if (!subjects.includes(item)) subjects.push(item)
  }

  return subjects
}

export function parseDevSubjectsInput(raw: unknown): DevSubjectKey[] | null {
  if (raw === null || raw === undefined) return null
  if (!Array.isArray(raw)) return null

  const subjects: DevSubjectKey[] = []
  for (const item of raw) {
    if (!isDevSubjectKey(item)) return null
    if (!subjects.includes(item)) subjects.push(item)
  }

  return subjects
}

export function isSuperDev(isDev: boolean, devSubjects: DevSubjectKey[] | null | undefined): boolean {
  return isDev && (!devSubjects || devSubjects.length === 0)
}

export function toApiSubject(key: DevSubjectKey): ApiDevSubject {
  if (key === "fizica") return "physics"
  if (key === "informatica") return "informatics"
  if (key === "matematica") return "math"
  if (key === "biologie") return "biology"
  return "ai"
}

export function apiSubjectToDevSubjectKey(subject: ApiDevSubject): DevSubjectKey | null {
  if (subject === "physics") return "fizica"
  if (subject === "informatics") return "informatica"
  if (subject === "math") return "matematica"
  if (subject === "biology") return "biologie"
  if (subject === "ai") return "ai"
  return null
}

export function toCatalog(key: DevSubjectKey): DevCatalog | null {
  if (key === "fizica") return "physics"
  if (key === "informatica") return "informatics"
  if (key === "matematica") return "math"
  return null
}

export function catalogToDevSubjectKey(catalog: DevCatalog): DevSubjectKey {
  if (catalog === "physics") return "fizica"
  if (catalog === "informatics") return "informatica"
  return "matematica"
}

export function isReservedLearningPathMarker(problemCategory: string | null | undefined): boolean {
  const pc = problemCategory?.trim() || null
  return (
    pc === INFORMATICA_LEARNING_PATH_MARKER ||
    pc === MATEMATICA_LEARNING_PATH_MARKER ||
    pc === BIOLOGIE_LEARNING_PATH_MARKER ||
    pc === AI_LEARNING_PATH_MARKER
  )
}

export function subjectFromChapter(problemCategory: string | null | undefined): DevSubjectKey {
  const pc = problemCategory?.trim() || null
  if (pc === INFORMATICA_LEARNING_PATH_MARKER) return "informatica"
  if (pc === MATEMATICA_LEARNING_PATH_MARKER) return "matematica"
  if (pc === BIOLOGIE_LEARNING_PATH_MARKER) return "biologie"
  if (pc === AI_LEARNING_PATH_MARKER) return "ai"
  return "fizica"
}

export function chapterMatchesSubject(
  chapter: { problem_category: string | null },
  subject: ApiDevSubject
): boolean {
  if (subject === "all") return true
  return subjectFromChapter(chapter.problem_category) === apiSubjectToDevSubjectKey(subject)
}

export function canAccessSubject(
  isDev: boolean,
  devSubjects: DevSubjectKey[] | null | undefined,
  subject: DevSubjectKey,
  isAdmin = false
): boolean {
  if (isAdmin) return true
  if (!isDev) return false
  if (isSuperDev(isDev, devSubjects)) return true
  return Boolean(devSubjects?.includes(subject))
}

export function canAccessApiSubject(
  isDev: boolean,
  devSubjects: DevSubjectKey[] | null | undefined,
  subject: ApiDevSubject,
  isAdmin = false
): boolean {
  if (isAdmin) return true
  if (subject === "all") return isSuperDev(isDev, devSubjects)
  const devSubject = apiSubjectToDevSubjectKey(subject)
  return devSubject ? canAccessSubject(isDev, devSubjects, devSubject, isAdmin) : false
}

export function canAccessCatalog(
  isDev: boolean,
  devSubjects: DevSubjectKey[] | null | undefined,
  catalog: DevCatalog,
  isAdmin = false
): boolean {
  return canAccessSubject(isDev, devSubjects, catalogToDevSubjectKey(catalog), isAdmin)
}
