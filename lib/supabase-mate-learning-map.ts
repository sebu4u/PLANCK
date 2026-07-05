import { MATE_MAP_CONFIG, MATE_ROUTE_SLUGS } from "@/lib/subject-map/config"
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

export type MateRouteSlug = (typeof MATE_ROUTE_SLUGS)[number]
export type MateRoute = SubjectMapRoute
export type MateChapter = SubjectMapChapter
export type MateLesson = SubjectMapLesson
export type MateLessonItemAssignment = SubjectMapLessonItemAssignment
export type MateMapPageData = SubjectMapPageData

export { MATE_ROUTE_SLUGS, getLearningPathItemLabel }

export function isMateRouteSlug(value: string | null | undefined): value is MateRouteSlug {
  return !!value && (MATE_ROUTE_SLUGS as readonly string[]).includes(value)
}

export function fetchMateMapPageData(
  options: Parameters<typeof fetchSubjectMapPageData>[1],
): Promise<MateMapPageData> {
  return fetchSubjectMapPageData(MATE_MAP_CONFIG, options)
}

export function fetchMateMapAdminTree() {
  return fetchSubjectMapAdminTree(MATE_MAP_CONFIG)
}

export function resolveMateMapItemNavigation(
  currentLearningPathItemId: string,
  context: Parameters<typeof resolveSubjectMapItemNavigation>[2],
) {
  return resolveSubjectMapItemNavigation(MATE_MAP_CONFIG, currentLearningPathItemId, context)
}

export function getMateMapHref(routeSlug: string, chapterSlug: string): string {
  return getSubjectMapHref("mate", routeSlug, chapterSlug)
}

export type { SubjectMapAssignmentItemRoute as MateMapAssignmentItemRoute } from "@/lib/subject-map/types"
