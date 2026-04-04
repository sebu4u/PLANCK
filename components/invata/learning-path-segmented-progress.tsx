import type { LearningPathLesson } from "@/lib/supabase-learning-paths"

interface LearningPathSegmentedProgressProps {
  lessons: LearningPathLesson[]
  completedLessonIds: string[]
}

export function LearningPathSegmentedProgress({
  lessons,
  completedLessonIds,
}: LearningPathSegmentedProgressProps) {
  const completed = new Set(completedLessonIds)
  const doneCount = lessons.filter((l) => completed.has(l.id)).length

  return (
    <div
      role="progressbar"
      aria-valuenow={doneCount}
      aria-valuemax={lessons.length}
      aria-label={`Progres lecții: ${doneCount} din ${lessons.length} completate`}
      className="mt-3 flex w-full max-w-md gap-1"
    >
      {lessons.map((lesson) => {
        const isDone = completed.has(lesson.id)
        return (
          <div
            key={lesson.id}
            className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#ececec]"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                isDone ? "w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]" : "w-0"
              }`}
              aria-hidden="true"
            />
          </div>
        )
      })}
    </div>
  )
}
