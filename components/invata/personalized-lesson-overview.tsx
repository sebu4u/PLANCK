import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  PlayCircle,
} from "lucide-react"
import type { PersonalizedCourseWithStructure } from "@/lib/personalized-courses/types"
import {
  getPersonalizedCourseHref,
  getPersonalizedCourseItemHref,
  getPersonalizedCourseLessonHref,
} from "@/lib/personalized-courses/data"
import {
  ITEM_TYPE_LABEL,
  getLessonItemDisplayIcon,
} from "@/components/invata/learning-path-item-body"
import { LessonItemProgressBar } from "@/components/invata/lesson-item-progress-bar"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

interface PersonalizedLessonOverviewProps {
  course: PersonalizedCourseWithStructure
  lessonId: string
}

export function PersonalizedLessonOverview({
  course,
  lessonId,
}: PersonalizedLessonOverviewProps) {
  const lesson = course.lessons.find((entry) => entry.id === lessonId)
  if (!lesson) return null

  const completedSet = new Set(course.completedItemIds)
  const total = lesson.items.length
  const completed = lesson.items.filter((item) => completedSet.has(item.id)).length
  const isLessonComplete = total > 0 && completed >= total

  const firstIncomplete = lesson.items.find((item) => !completedSet.has(item.id))
  const startHref = total > 0
    ? getPersonalizedCourseItemHref(
        course.id,
        lesson.id,
        firstIncomplete ? lesson.items.indexOf(firstIncomplete) + 1 : 1,
      )
    : getPersonalizedCourseLessonHref(course.id, lesson.id)

  const startLabel = !total
    ? "Nu are itemi"
    : isLessonComplete
      ? "Revizuiește lecția"
      : completed === 0
        ? "Începe lecția"
        : "Continuă lecția"

  const currentLessonIndex = course.lessons.findIndex((entry) => entry.id === lesson.id)
  const prevLesson = currentLessonIndex > 0 ? course.lessons[currentLessonIndex - 1] : null
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < course.lessons.length - 1
      ? course.lessons[currentLessonIndex + 1]
      : null

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-16 sm:px-8 lg:px-12">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/invata"
          className="font-medium text-[#7c3aed] transition-colors hover:text-[#5b21b6]"
        >
          Trasee
        </Link>
        <ChevronRight className="h-4 w-4 text-[#c4c4c4]" />
        <Link
          href={getPersonalizedCourseHref(course.id)}
          className="line-clamp-1 font-medium text-[#7c3aed] transition-colors hover:text-[#5b21b6]"
        >
          {course.title}
        </Link>
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-6 shadow-[0_18px_50px_rgba(124,58,237,0.10)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6fac]">
              Lecția {currentLessonIndex + 1} din {course.lessons.length}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              {lesson.title}
            </h1>
            {lesson.description ? (
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#4d4d4d] sm:text-base">
                {lesson.description}
              </p>
            ) : null}
          </div>

          {total > 0 ? (
            <Link
              href={startHref}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6] sm:self-center"
            >
              <PlayCircle className="h-4 w-4" />
              {startLabel}
            </Link>
          ) : null}
        </div>

        {total > 0 ? (
          <div className="mt-6 rounded-2xl border border-violet-100 bg-white/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#111111]">
                {isLessonComplete ? "Lecție completată" : "Progres lecție"}
              </p>
              <p className="text-sm font-medium text-[#6f657b]">
                {completed} / {total} itemi
              </p>
            </div>
            <div className="mt-3">
              <LessonItemProgressBar completed={completed} total={total} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8" aria-label="Itemi lecție">
        <h2 className="mb-4 text-lg font-bold text-[#111111] sm:text-xl">Conținut lecție</h2>

        {!total ? (
          <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-6 text-center text-sm text-[#7a7a7a]">
            Această lecție nu are încă itemi.
          </div>
        ) : (
          <ol className="relative flex flex-col gap-3.5">
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-4 left-[27px] top-4 z-0 w-0.5 bg-[#ece6f3]"
            />
            {lesson.items.map((item, index) => {
              const itemIndex = index + 1
              const isDone = completedSet.has(item.id)
              const itemHref = getPersonalizedCourseItemHref(course.id, lesson.id, itemIndex)
              const ItemIcon = getLessonItemDisplayIcon({
                item_type: item.item_type as LearningPathLessonType,
                content_json: item.content_json,
              })
              const typeLabel = ITEM_TYPE_LABEL[item.item_type as LearningPathLessonType] ?? "Item"

              return (
                <li key={item.id} className="relative z-[1]">
                  <Link
                    href={itemHref}
                    className="group flex items-center gap-3 rounded-2xl border border-[#ececec] bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_rgba(124,58,237,0.08)] sm:p-4"
                  >
                    <div
                      data-learning-path-anchor="circle"
                      data-trail-completed={isDone ? "true" : "false"}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isDone
                          ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                          : "border-violet-200 bg-violet-50 text-[#7c3aed]"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-6 w-6" /> : <ItemIcon className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8fb0]">
                        Pasul {itemIndex} · {typeLabel}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-[#111111] sm:text-base">
                        {item.title?.trim() || ITEM_TYPE_LABEL[item.item_type as LearningPathLessonType] || `Item ${itemIndex}`}
                      </p>
                      {item.source_title && item.source_title !== item.title ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#9a8a8a]">
                          Sursă: {item.source_title}
                        </p>
                      ) : null}
                    </div>

                    <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[#7c3aed] sm:inline-flex">
                      {isDone ? "Revizuire" : itemIndex === 1 ? "Începe" : "Deschide"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {(prevLesson || nextLesson) ? (
        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-[#ececec] pt-6">
          {prevLesson ? (
            <Link
              href={getPersonalizedCourseLessonHref(course.id, prevLesson.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#4d4d4d] transition-colors hover:border-violet-200 hover:text-[#7c3aed]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="line-clamp-1 max-w-[160px]">{prevLesson.title}</span>
            </Link>
          ) : <span />}

          {nextLesson ? (
            <Link
              href={getPersonalizedCourseLessonHref(course.id, nextLesson.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#4d4d4d] transition-colors hover:border-violet-200 hover:text-[#7c3aed]"
            >
              <span className="line-clamp-1 max-w-[160px]">{nextLesson.title}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={getPersonalizedCourseHref(course.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-[#7c3aed] transition-colors hover:bg-violet-100"
            >
              Înapoi la curs
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      ) : null}
    </div>
  )
}
