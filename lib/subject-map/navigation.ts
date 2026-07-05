import type { SubjectMapId } from "@/lib/subject-map/types"
import { getSubjectMapConfig } from "@/lib/subject-map/config"

export interface SubjectMapItemContext {
  subject: SubjectMapId
  routeSlug: string
  chapterSlug: string
  mapLessonId: string
}

export const SUBJECT_MAP_COMPLETED_LESSON_PARAM = "lectieCompleta"

type SearchParamSource = URLSearchParams | Record<string, string | string[] | undefined>

function readSearchParam(source: SearchParamSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    const value = source.get(key)
    return value?.trim() ? value.trim() : null
  }
  const raw = source[key]
  if (typeof raw === "string") return raw.trim() || null
  if (Array.isArray(raw)) return raw[0]?.trim() || null
  return null
}

function getSubjectQueryFlag(subject: SubjectMapId): string {
  return subject
}

function getSubjectLessonParam(subject: SubjectMapId): string {
  return `${subject}Lesson`
}

export function parseSubjectMapItemContext(
  subject: SubjectMapId,
  source: SearchParamSource,
): SubjectMapItemContext | null {
  const flag = readSearchParam(source, getSubjectQueryFlag(subject))
  if (flag !== "1") return null

  const routeSlug = readSearchParam(source, "traseu")
  const chapterSlug = readSearchParam(source, "capitol")
  const mapLessonId = readSearchParam(source, getSubjectLessonParam(subject))

  if (!routeSlug || !chapterSlug || !mapLessonId) return null
  return { subject, routeSlug, chapterSlug, mapLessonId }
}

export function parseAnySubjectMapItemContext(
  source: SearchParamSource,
): SubjectMapItemContext | null {
  for (const subject of ["mate", "info"] as const) {
    const context = parseSubjectMapItemContext(subject, source)
    if (context) return context
  }
  return null
}

export function buildSubjectMapItemQueryString(context: SubjectMapItemContext): string {
  const params = new URLSearchParams()
  params.set(getSubjectQueryFlag(context.subject), "1")
  params.set("traseu", context.routeSlug)
  params.set("capitol", context.chapterSlug)
  params.set(getSubjectLessonParam(context.subject), context.mapLessonId)
  return params.toString()
}

export function appendSubjectMapItemQuery(href: string, context: SubjectMapItemContext): string {
  const query = buildSubjectMapItemQueryString(context)
  const hashIndex = href.indexOf("#")
  const base = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : ""
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}${query}${hash}`
}

export function getSubjectMapItemCacheSuffix(context: SubjectMapItemContext | null | undefined): string {
  if (!context) return ""
  return `?${buildSubjectMapItemQueryString(context)}`
}

export function buildSubjectMapReturnAfterLessonHref(
  context: Pick<SubjectMapItemContext, "subject" | "routeSlug" | "chapterSlug">,
  completedMapLessonId: string,
): string {
  const config = getSubjectMapConfig(context.subject)
  const params = new URLSearchParams()
  params.set("traseu", context.routeSlug)
  params.set("capitol", context.chapterSlug)
  params.set(SUBJECT_MAP_COMPLETED_LESSON_PARAM, completedMapLessonId)
  return `${config.basePath}?${params.toString()}`
}

export function getSubjectMapHref(
  subject: SubjectMapId,
  routeSlug: string,
  chapterSlug: string,
): string {
  const config = getSubjectMapConfig(subject)
  return `${config.basePath}?traseu=${encodeURIComponent(routeSlug)}&capitol=${encodeURIComponent(chapterSlug)}`
}
