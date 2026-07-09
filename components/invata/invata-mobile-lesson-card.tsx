import Link from "next/link"
import { Lock } from "lucide-react"
import {
  getLearningPathLessonHref,
  learningPathLessonShowsHubNouBadge,
} from "@/lib/learning-path-routes"
import type {
  LearningPathHubChapter,
  LearningPathHubLesson,
} from "@/lib/supabase-learning-paths"
import { LessonItemProgressBar } from "@/components/invata/lesson-item-progress-bar"
import { InvataDeferredImage } from "@/components/invata/invata-chapter-image-load-context"
import { cn } from "@/lib/utils"

const LESSON_HUB_CARD_CLASS =
  "rounded-xl border-[3px] border-[#e6e6e6] bg-white px-3.5 py-3.5 shadow-[0_4px_0_#e6e6e6] transition-[transform,box-shadow] active:translate-y-0.5 active:shadow-[0_2px_0_#cfcfcf]"

export type LessonProgress = {
  completed: number
  total: number
}

interface InvataMobileLessonListProps {
  chapter: LearningPathHubChapter
  lessons: LearningPathHubLesson[]
  lessonProgressByLessonId: Record<string, LessonProgress>
  loadImages?: boolean
  isLocked?: boolean
}

export function InvataMobileLessonList({
  chapter,
  lessons,
  lessonProgressByLessonId,
  loadImages = true,
  isLocked = false,
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
        const showNouBadge = learningPathLessonShowsHubNouBadge(lesson)

        const cardInner = (
          <>
            {showNouBadge && !isLocked ? (
              <span
                className="absolute right-3 top-3 z-[2] rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold leading-none text-white"
                aria-hidden
              >
                nou
              </span>
            ) : null}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {isLocked ? (
                <div className="absolute inset-0 z-[1] flex items-center justify-center rounded-lg bg-white/60">
                  <Lock className="h-4 w-4 text-[#8a8a8a]" aria-hidden="true" />
                </div>
              ) : null}
              {lesson.image_url ? (
                <InvataDeferredImage
                  src={lesson.image_url}
                  enabled={loadImages}
                  alt=""
                  className={cn(
                    "h-full w-full object-contain p-0.5",
                    isLocked && "opacity-60 grayscale"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "h-full w-full rounded-md bg-[#f3f3f3]",
                    isLocked && "opacity-60 grayscale"
                  )}
                />
              )}
            </div>

            <div className={cn("min-w-0 flex-1", showNouBadge && !isLocked && "pr-11")}>
              <p className="line-clamp-2 text-sm font-semibold text-[#222]">{lesson.title}</p>
              {isLocked ? null : (
                <LessonItemProgressBar
                  completed={progress.completed}
                  total={progress.total}
                  className="mt-2.5"
                />
              )}
            </div>
          </>
        )

        if (isLocked) {
          return (
            <div
              key={lesson.id}
              aria-disabled="true"
              className={cn(
                "relative z-[1] flex w-full cursor-not-allowed items-center gap-3 opacity-60 grayscale",
                LESSON_HUB_CARD_CLASS
              )}
            >
              {cardInner}
            </div>
          )
        }

        return (
          <Link
            key={lesson.id}
            href={href}
            className={cn(
              "relative z-[1] flex w-full items-center gap-3",
              LESSON_HUB_CARD_CLASS
            )}
          >
            {cardInner}
          </Link>
        )
      })}
    </div>
  )
}
