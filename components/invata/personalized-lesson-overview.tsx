import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  PlayCircle,
} from "lucide-react"
import type { PersonalizedCourseWithStructure } from "@/lib/personalized-courses/types"
import {
  getPersonalizedCourseHref,
  getPersonalizedCourseItemHref,
  getPersonalizedCourseLessonHref,
} from "@/lib/personalized-courses/data"
import { ITEM_TYPE_LABEL, getLessonItemDisplayIcon } from "@/components/invata/learning-path-item-body"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

interface PersonalizedLessonOverviewProps {
  course: PersonalizedCourseWithStructure
  lessonId: string
}

export function PersonalizedLessonOverview({ course, lessonId }: PersonalizedLessonOverviewProps) {
  const lesson = course.lessons.find((entry) => entry.id === lessonId)
  if (!lesson) return null

  const completedSet = new Set(course.completedItemIds)
  const total = lesson.items.length
  const completed = lesson.items.filter((item) => completedSet.has(item.id)).length
  const isLessonComplete = total > 0 && completed >= total

  const firstIncomplete = lesson.items.find((item) => !completedSet.has(item.id))
  const startHref = total > 0
    ? getPersonalizedCourseItemHref(course.id, lesson.id, firstIncomplete ? lesson.items.indexOf(firstIncomplete) + 1 : 1)
    : getPersonalizedCourseLessonHref(course.id, lesson.id)

  const startLabel = !total ? "Nu are itemi" : isLessonComplete ? "Revizuiește lecția" : completed === 0 ? "Începe lecția" : "Continuă lecția"

  const currentLessonIndex = course.lessons.findIndex((entry) => entry.id === lesson.id)
  const prevLesson = currentLessonIndex > 0 ? course.lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < course.lessons.length - 1 ? course.lessons[currentLessonIndex + 1] : null

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-12">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/invata" className="font-medium text-[#1f1f1f] hover:text-[#7c3aed]">Trasee</Link>
        <ChevronRight className="h-4 w-4 text-[#c4c4c4]" />
        <Link href={getPersonalizedCourseHref(course.id)} className="line-clamp-1 font-medium text-[#1f1f1f] hover:text-[#7c3aed]">
          {course.title}
        </Link>
      </div>

      <section className="mt-5">
        <div className="mb-5 hidden sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f] sm:h-28 sm:w-28">
              {isLessonComplete ? (
                <CheckCircle2 className="h-12 w-12 text-[#059669] sm:h-14 sm:w-14" />
              ) : (
                <BookOpen className="h-12 w-12 sm:h-14 sm:w-14" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#8a8a8a]">
                Lecția {currentLessonIndex + 1} din {course.lessons.length}
              </p>
              <h2 className="mt-0.5 text-xl font-semibold text-[#111111]">{lesson.title}</h2>
              {lesson.description ? (
                <p className="mt-0.5 text-sm text-[#707070]">{lesson.description}</p>
              ) : null}
              {total > 0 ? (
                <p className="mt-1 text-xs text-[#8a8a8a]">{completed} / {total} itemi</p>
              ) : null}
            </div>
          </div>
          {total > 0 ? (
            <Link
              href={startHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1f1f1f] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PlayCircle className="h-4 w-4" />
              {startLabel}
            </Link>
          ) : null}
        </div>

        <div className="relative mb-5 sm:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#8a8a8a]">Lecția {currentLessonIndex + 1} din {course.lessons.length}</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#111111]">{lesson.title}</h2>
              {lesson.description ? <p className="mt-1 text-sm text-[#707070]">{lesson.description}</p> : null}
            </div>
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f]">
              {isLessonComplete ? <CheckCircle2 className="h-10 w-10 text-[#059669]" /> : <BookOpen className="h-10 w-10" />}
            </div>
          </div>
          {total > 0 ? (
            <Link href={startHref} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm font-semibold text-white">
              <PlayCircle className="h-4 w-4" />
              {startLabel}
            </Link>
          ) : null}
        </div>
      </section>

      <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
        {total > 0 ? (
          <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
            <div className="flex min-w-max items-start gap-4 sm:gap-5">
              {lesson.items.map((item, index) => {
                const itemIndex = index + 1
                const isDone = completedSet.has(item.id)
                const itemHref = getPersonalizedCourseItemHref(course.id, lesson.id, itemIndex)
                const ItemIcon = getLessonItemDisplayIcon({ item_type: item.item_type as LearningPathLessonType, content_json: item.content_json })
                const typeLabel = ITEM_TYPE_LABEL[item.item_type as LearningPathLessonType] ?? "Item"

                return (
                  <Link key={item.id} href={itemHref} className="block shrink-0">
                    <div className="relative flex w-[168px] shrink-0 cursor-pointer flex-col items-center sm:w-[190px]">
                      <div className="flex h-[142px] w-[142px] items-center justify-center rounded-2xl border-[3px] border-[#e6e6e6] border-b-[7px] bg-white p-3 transition-[transform,border-color,border-bottom-width] duration-200 hover:translate-y-1 hover:border-[#cfcfcf] hover:border-b-[4px] sm:h-[162px] sm:w-[162px]">
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                          {isDone ? (
                            <CheckCircle2 className="h-10 w-10 text-[#059669] sm:h-12 sm:w-12" />
                          ) : (
                            <ItemIcon className="h-8 w-8 text-[#9a9a9a] sm:h-10 sm:w-10" />
                          )}
                          <span className="text-[10px] font-medium text-[#8a8a8a]">{typeLabel}</span>
                        </div>
                      </div>
                      {index < lesson.items.length - 1 ? (
                        <div className="pointer-events-none absolute left-[155px] top-[71px] h-[5px] w-[42px] bg-[#e6e6e6] sm:left-[176px] sm:top-[81px] sm:w-[48px]" />
                      ) : null}
                      <p className="mt-3 line-clamp-2 text-center text-base font-medium text-[#1f1f1f]">
                        {item.title?.trim() || `${typeLabel} ${itemIndex}`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#7a7a7a]">Această lecție nu are încă itemi.</p>
        )}
      </div>

      {(prevLesson || nextLesson) ? (
        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-[#ececec] pt-6">
          {prevLesson ? (
            <Link
              href={getPersonalizedCourseLessonHref(course.id, prevLesson.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e6e6] bg-white px-4 py-2 text-sm font-medium text-[#4d4d4d] transition-colors hover:border-[#cfcfcf] hover:text-[#111111]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="line-clamp-1 max-w-[160px]">{prevLesson.title}</span>
            </Link>
          ) : <span />}
          {nextLesson ? (
            <Link
              href={getPersonalizedCourseLessonHref(course.id, nextLesson.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e6e6] bg-white px-4 py-2 text-sm font-medium text-[#4d4d4d] transition-colors hover:border-[#cfcfcf] hover:text-[#111111]"
            >
              <span className="line-clamp-1 max-w-[160px]">{nextLesson.title}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={getPersonalizedCourseHref(course.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e6e6] bg-white px-4 py-2 text-sm font-medium text-[#4d4d4d] transition-colors hover:border-[#cfcfcf] hover:text-[#111111]"
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
