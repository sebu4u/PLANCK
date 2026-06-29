export interface LearningPathRouteChapter {
  id: string
  slug: string | null
}

export interface LearningPathRouteLesson {
  id: string
  slug: string | null
}

function normalizeLearningPathSlug(slug: string | null | undefined): string | null {
  const trimmed = slug?.trim()
  return trimmed ? trimmed : null
}

export function getLearningPathChapterNavTitle(chapter: {
  title: string
  nav_title: string | null
}): string {
  const navTitle = chapter.nav_title?.trim()
  return navTitle || chapter.title
}

export function learningPathLessonShowsHubNouBadge(lesson: {
  hub_show_nou_badge: boolean
}): boolean {
  return lesson.hub_show_nou_badge === true
}

export function getLearningPathRouteSegments(
  chapter: LearningPathRouteChapter,
  lesson: LearningPathRouteLesson
): { chapterSegment: string; lessonSegment: string } {
  const chapterSlug = normalizeLearningPathSlug(chapter.slug)
  const lessonSlug = normalizeLearningPathSlug(lesson.slug)
  return {
    chapterSegment: chapterSlug ?? chapter.id,
    lessonSegment: lessonSlug ?? lesson.id,
  }
}

export function getLearningPathLessonHref(
  chapter: LearningPathRouteChapter,
  lesson: LearningPathRouteLesson
): string {
  const { chapterSegment, lessonSegment } = getLearningPathRouteSegments(chapter, lesson)
  return `/invata/${chapterSegment}/${lessonSegment}`
}

export function getLearningPathItemHref(
  chapter: LearningPathRouteChapter,
  lesson: LearningPathRouteLesson,
  itemIndex: number
): string {
  return `${getLearningPathLessonHref(chapter, lesson)}/${itemIndex + 1}`
}

export function getCanonicalLearningPathLessonPath(
  chapter: LearningPathRouteChapter,
  lesson: LearningPathRouteLesson,
  itemIndex?: number
): string {
  const href = getLearningPathLessonHref(chapter, lesson)
  if (itemIndex == null || !Number.isFinite(itemIndex) || itemIndex < 1) {
    return href
  }
  return `${href}/${itemIndex}`
}

export function learningPathUrlNeedsCanonicalRedirect(
  chapterSlug: string,
  lessonSlug: string,
  chapter: LearningPathRouteChapter,
  lesson: LearningPathRouteLesson,
  itemIndex?: string
): string | null {
  const parsedItemIndex =
    itemIndex == null ? null : Number.parseInt(itemIndex, 10)
  const normalizedItemIndex =
    parsedItemIndex != null && Number.isFinite(parsedItemIndex) && parsedItemIndex >= 1
      ? parsedItemIndex
      : null

  const canonicalPath = getCanonicalLearningPathLessonPath(
    chapter,
    lesson,
    normalizedItemIndex ?? undefined
  )

  const currentPath =
    normalizedItemIndex != null
      ? `/invata/${chapterSlug}/${lessonSlug}/${normalizedItemIndex}`
      : `/invata/${chapterSlug}/${lessonSlug}`

  return currentPath === canonicalPath ? null : canonicalPath
}
