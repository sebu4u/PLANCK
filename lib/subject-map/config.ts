import type { SubjectMapId, SubjectMapRouteConfig } from "@/lib/subject-map/types"

export const MATE_ROUTE_SLUGS = ["algebra", "geometrie", "analiza", "trigonometrie"] as const
export const INFO_ROUTE_SLUGS = ["algoritmi", "structuri-date", "grafuri", "programare"] as const

export const MATE_MAP_CONFIG: SubjectMapRouteConfig = {
  id: "mate",
  basePath: "/invata/mate",
  routeSlugs: MATE_ROUTE_SLUGS,
  tables: {
    routes: "mate_routes",
    chapters: "mate_chapters",
    lessons: "mate_lessons",
    lessonItems: "mate_lesson_items",
    lessonIdColumn: "mate_lesson_id",
  },
}

export const INFO_MAP_CONFIG: SubjectMapRouteConfig = {
  id: "info",
  basePath: "/invata/info",
  routeSlugs: INFO_ROUTE_SLUGS,
  tables: {
    routes: "info_routes",
    chapters: "info_chapters",
    lessons: "info_lessons",
    lessonItems: "info_lesson_items",
    lessonIdColumn: "info_lesson_id",
  },
}

export const SUBJECT_MAP_CONFIGS: Record<SubjectMapId, SubjectMapRouteConfig> = {
  mate: MATE_MAP_CONFIG,
  info: INFO_MAP_CONFIG,
}

export function getSubjectMapConfig(id: SubjectMapId): SubjectMapRouteConfig {
  return SUBJECT_MAP_CONFIGS[id]
}

export function isSubjectMapRouteSlug(
  config: SubjectMapRouteConfig,
  value: string | null | undefined,
): value is string {
  return !!value && (config.routeSlugs as readonly string[]).includes(value)
}
