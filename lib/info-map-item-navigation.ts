import {
  appendSubjectMapItemQuery,
  buildSubjectMapReturnAfterLessonHref,
  getSubjectMapItemCacheSuffix,
  parseSubjectMapItemContext,
  SUBJECT_MAP_COMPLETED_LESSON_PARAM,
  type SubjectMapItemContext,
} from "@/lib/subject-map/navigation"

export type InfoMapItemContext = SubjectMapItemContext

export const INFO_MAP_COMPLETED_LESSON_PARAM = SUBJECT_MAP_COMPLETED_LESSON_PARAM

export function parseInfoMapItemContext(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): InfoMapItemContext | null {
  return parseSubjectMapItemContext("info", source)
}

export function appendInfoMapItemQuery(href: string, context: InfoMapItemContext): string {
  return appendSubjectMapItemQuery(href, context)
}

export function getInfoMapItemCacheSuffix(context: InfoMapItemContext | null | undefined): string {
  return getSubjectMapItemCacheSuffix(context)
}

export function buildInfoMapReturnAfterLessonHref(
  routeSlug: string,
  chapterSlug: string,
  completedMapLessonId: string,
): string {
  return buildSubjectMapReturnAfterLessonHref(
    { subject: "info", routeSlug, chapterSlug },
    completedMapLessonId,
  )
}
