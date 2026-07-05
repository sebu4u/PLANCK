import {
  appendSubjectMapItemQuery,
  buildSubjectMapReturnAfterLessonHref,
  getSubjectMapItemCacheSuffix,
  parseSubjectMapItemContext,
  SUBJECT_MAP_COMPLETED_LESSON_PARAM,
  type SubjectMapItemContext,
} from "@/lib/subject-map/navigation"

export type MateMapItemContext = SubjectMapItemContext

export const MATE_MAP_COMPLETED_LESSON_PARAM = SUBJECT_MAP_COMPLETED_LESSON_PARAM

export function parseMateMapItemContext(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): MateMapItemContext | null {
  return parseSubjectMapItemContext("mate", source)
}

export function appendMateMapItemQuery(href: string, context: MateMapItemContext): string {
  return appendSubjectMapItemQuery(href, context)
}

export function getMateMapItemCacheSuffix(context: MateMapItemContext | null | undefined): string {
  return getSubjectMapItemCacheSuffix(context)
}

export function buildMateMapReturnAfterLessonHref(
  routeSlug: string,
  chapterSlug: string,
  completedMapLessonId: string,
): string {
  return buildSubjectMapReturnAfterLessonHref(
    { subject: "mate", routeSlug, chapterSlug },
    completedMapLessonId,
  )
}
