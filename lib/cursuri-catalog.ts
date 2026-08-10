import {
  getAllGrades,
  getChaptersByGradeIds,
  getLessonSummariesByChapterIds,
  type Chapter,
  type Grade,
  type LessonSummary,
} from "@/lib/supabase-physics"
import type { CursuriSubjectId } from "@/lib/cursuri-subjects"

export async function loadCursuriCatalog(subject: CursuriSubjectId): Promise<{
  grades: Grade[]
  chapters: Record<string, Chapter[]>
  lessons: Record<string, LessonSummary[]>
}> {
  const grades = await getAllGrades(subject)
  const chapters = await getChaptersByGradeIds(grades.map((g) => g.id))
  const allChapterIds = Object.values(chapters).flat().map((c) => c.id)
  const lessons = await getLessonSummariesByChapterIds(allChapterIds)
  return { grades, chapters, lessons }
}

export function findLessonIdBySlug(
  grades: Grade[],
  chapters: Record<string, Chapter[]>,
  lessons: Record<string, LessonSummary[]>,
  slug: string,
  slugifyFn: (title: string) => string
): string | undefined {
  for (const grade of grades) {
    for (const chapter of chapters[grade.id] ?? []) {
      for (const lesson of lessons[chapter.id] ?? []) {
        if (slugifyFn(lesson.title) === slug) {
          return lesson.id
        }
      }
    }
  }
  return undefined
}
