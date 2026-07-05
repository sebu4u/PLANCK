import { INFO_MAP_CONFIG, INFO_ROUTE_SLUGS } from "@/lib/subject-map/config"
import {
  fetchSubjectMapAdminTree,
  fetchSubjectMapPageData,
  getLearningPathItemLabel,
  resolveSubjectMapItemNavigation,
} from "@/lib/subject-map/supabase-learning-map"
import type {
  SubjectMapChapter,
  SubjectMapLesson,
  SubjectMapLessonItemAssignment,
  SubjectMapPageData,
  SubjectMapRoute,
} from "@/lib/subject-map/types"
import { getSubjectMapHref } from "@/lib/subject-map/navigation"

export type InfoRouteSlug = (typeof INFO_ROUTE_SLUGS)[number]
export type InfoRoute = SubjectMapRoute
export type InfoChapter = SubjectMapChapter
export type InfoLesson = SubjectMapLesson
export type InfoLessonItemAssignment = SubjectMapLessonItemAssignment
export type InfoMapPageData = SubjectMapPageData

export { INFO_ROUTE_SLUGS, getLearningPathItemLabel }

export function isInfoRouteSlug(value: string | null | undefined): value is InfoRouteSlug {
  return !!value && (INFO_ROUTE_SLUGS as readonly string[]).includes(value)
}

export function fetchInfoMapPageData(
  options: Parameters<typeof fetchSubjectMapPageData>[1],
): Promise<InfoMapPageData> {
  return fetchSubjectMapPageData(INFO_MAP_CONFIG, options)
}

export function fetchInfoMapAdminTree() {
  return fetchSubjectMapAdminTree(INFO_MAP_CONFIG)
}

export function resolveInfoMapItemNavigation(
  currentLearningPathItemId: string,
  context: Parameters<typeof resolveSubjectMapItemNavigation>[2],
) {
  return resolveSubjectMapItemNavigation(INFO_MAP_CONFIG, currentLearningPathItemId, context)
}

export function getInfoMapHref(routeSlug: string, chapterSlug: string): string {
  return getSubjectMapHref("info", routeSlug, chapterSlug)
}

export type { SubjectMapAssignmentItemRoute as InfoMapAssignmentItemRoute } from "@/lib/subject-map/types"
