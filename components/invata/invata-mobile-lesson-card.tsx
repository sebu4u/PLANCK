import Link from "next/link"
import {
  getLearningPathLessonHref,
  type LearningPathChapter,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"
import { LessonItemProgressBar } from "@/components/invata/lesson-item-progress-bar"
import { cn } from "@/lib/utils"

/** Same surface as card_sort items in learning-path-interactive-lesson-item.tsx */
const LESSON_HUB_CARD_CLASS =
  "rounded-xl border-[3px] border-[#cfc3dc] bg-white px-3.5 py-3.5 shadow-[0_4px_0_#9d8ab3] transition-[transform,box-shadow] active:translate-y-0.5 active:shadow-[0_2px_0_#9d8ab3]"

export type LessonProgress = {
  completed: number
  total: number
}

interface InvataMobileLessonListProps {
  chapter: LearningPathChapter
  lessons: LearningPathLesson[]
  lessonProgressByLessonId: Record<string, LessonProgress>
}

export function InvataMobileLessonList({
  chapter,
  lessons,
  lessonProgressByLessonId,
}: InvataMobileLessonListProps) {
  if (!lessons.length) {
    return <p className="text-sm text-[#7a7a7a]">Acest capitol nu are încă lecții.</p>
  }

  return (
    <div className="relative flex flex-col gap-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-[31px] top-4 z-0 w-0.5 bg-[#e6e6e6]"
      />

      {lessons.map((lesson) => {
        const progress = lessonProgressByLessonId[lesson.id] ?? { completed: 0, total: 0 }
        const href = getLearningPathLessonHref(chapter, lesson)

        return (
          <Link
            key={lesson.id}
            href={href}
            className={cn(
              "relative z-[1] flex w-full items-center gap-3",
              LESSON_HUB_CARD_CLASS
            )}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {lesson.image_url ? (
                <img
                  src={lesson.image_url}
                  alt=""
                  className="h-full w-full object-contain p-0.5"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full rounded-md bg-[#f3f3f3]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-[#222]">{lesson.title}</p>
              <LessonItemProgressBar
                completed={progress.completed}
                total={progress.total}
                className="mt-2.5"
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
