import type { FizicaLessonStatus, FizicaLessonType } from "@/lib/invata-fizica-config"
import type { FizicaMapLessonLayout, FizicaMapLessonLayoutInput } from "@/lib/fizica-map-layout"

export type SubjectMapId = "mate" | "info"

export interface SubjectMapTables {
  routes: string
  chapters: string
  lessons: string
  lessonItems: string
  lessonIdColumn: string
}

export interface SubjectMapRouteConfig {
  id: SubjectMapId
  tables: SubjectMapTables
  basePath: string
  routeSlugs: readonly string[]
}

export type SubjectMapLessonType = FizicaLessonType
export type SubjectMapLessonStatus = FizicaLessonStatus

export interface SubjectMapRoute {
  id: string
  slug: string
  title: string
  order_index: number
  is_active: boolean
}

export interface SubjectMapChapter {
  id: string
  route_id: string
  slug: string
  title: string
  order_index: number
  is_active: boolean
}

export interface SubjectMapLesson {
  id: string
  chapter_id: string
  title: string
  duration_minutes: number
  lesson_type: SubjectMapLessonType
  order_index: number
  is_active: boolean
}

export interface SubjectMapLessonItemAssignment {
  id: string
  mapLessonId: string
  learning_path_lesson_item_id: string
  order_index: number
}

export interface SubjectMapLessonLayout extends FizicaMapLessonLayout {
  mapLessonId: string
}

export interface SubjectMapPageData {
  routes: SubjectMapRoute[]
  chapters: SubjectMapChapter[]
  selectedRoute: SubjectMapRoute | null
  selectedChapter: SubjectMapChapter | null
  nextChapter: SubjectMapChapter | null
  lessons: SubjectMapLessonLayout[]
  completedLessonCount: number
  isCurrentChapterComplete: boolean
}

export interface SubjectMapAssignmentItemRoute {
  chapterSlug: string
  lessonSlug: string
  itemIndex: number
}

export interface SubjectMapItemNavigation {
  nextItemHref: string
  prevItemHref: string | null
  isLastItemInAssignment: boolean
  assignmentItems: SubjectMapAssignmentItemRoute[]
  assignmentItemIds: string[]
  mapLessonTotalElo: number
}

export type SubjectMapLessonLayoutInput = FizicaMapLessonLayoutInput
