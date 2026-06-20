import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, PlayCircle, Sparkles } from "lucide-react"
import type { PersonalizedCourseWithStructure } from "@/lib/personalized-courses/types"
import {
  getPersonalizedCourseHref,
  getPersonalizedCourseLessonHref,
  getPersonalizedCourseItemHref,
} from "@/lib/personalized-courses/data"

interface PersonalizedCourseOverviewProps {
  course: PersonalizedCourseWithStructure
}

function resolveResumeTarget(course: PersonalizedCourseWithStructure): {
  href: string
  label: string
} | null {
  const completedSet = new Set(course.completedItemIds)
  for (const lesson of course.lessons) {
    if (!lesson.items.length) continue
    const nextItem = lesson.items.find((item) => !completedSet.has(item.id))
    if (nextItem) {
      const index = lesson.items.indexOf(nextItem) + 1
      return {
        href: getPersonalizedCourseItemHref(course.id, lesson.id, index),
        label: "Continuă cursul",
      }
    }
  }
  const firstLesson = course.lessons[0]
  if (firstLesson?.items.length) {
    return {
      href: getPersonalizedCourseItemHref(course.id, firstLesson.id, 1),
      label: "Revizuiește cursul",
    }
  }
  if (firstLesson) {
    return {
      href: getPersonalizedCourseLessonHref(course.id, firstLesson.id),
      label: "Deschide prima lecție",
    }
  }
  return null
}

export function PersonalizedCourseOverview({ course }: PersonalizedCourseOverviewProps) {
  const completedSet = new Set(course.completedItemIds)
  const totalItems = course.lessons.reduce((sum, lesson) => sum + lesson.items.length, 0)
  const completedItems = course.lessons
    .flatMap((lesson) => lesson.items)
    .filter((item) => completedSet.has(item.id)).length
  const resumeTarget = resolveResumeTarget(course)

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-12">
      <Link
        href="/invata"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1f1f1f] transition-colors hover:text-[#7c3aed]"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la trasee
      </Link>

      {/* Chapter header — same as InvataChapterSection */}
      <div className="mb-5 hidden sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f] sm:h-28 sm:w-28">
            <Sparkles className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[#111111]">{course.title}</h2>
            {course.description ? (
              <p className="mt-0.5 text-sm text-[#707070]">{course.description}</p>
            ) : null}
            {course.original_prompt ? (
              <p className="mt-1 text-xs text-[#9a9a9a]">Obiectiv: „{course.original_prompt}"</p>
            ) : null}
            {totalItems > 0 ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 w-32 overflow-hidden rounded-full bg-[#e6e6e6]">
                  <div
                    className="h-full rounded-full bg-[#1f1f1f] transition-all"
                    style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#8a8a8a]">
                  {completedItems} / {totalItems} itemi
                </span>
              </div>
            ) : null}
          </div>
        </div>
        {resumeTarget ? (
          <Link
            href={resumeTarget.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1f1f1f] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlayCircle className="h-4 w-4" />
            {resumeTarget.label}
          </Link>
        ) : null}
      </div>

      {/* Mobile header */}
      <div className="relative mb-5 sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#111111]">{course.title}</h2>
            {course.description ? <p className="mt-1 text-sm text-[#707070]">{course.description}</p> : null}
          </div>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f]">
            <Sparkles className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
        {resumeTarget ? (
          <Link href={resumeTarget.href} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm font-semibold text-white">
            <PlayCircle className="h-4 w-4" />
            {resumeTarget.label}
          </Link>
        ) : null}
      </div>

      {/* Lessons — same as InvataChapterSection: horizontal scroll cards */}
      <div className="space-y-12 sm:space-y-10">
        {course.lessons.map((lesson, lessonIndex) => {
          const total = lesson.items.length
          const completed = lesson.items.filter((item) => completedSet.has(item.id)).length
          const isLessonComplete = total > 0 && completed >= total
          const lessonHref = getPersonalizedCourseLessonHref(course.id, lesson.id)
          const firstIncomplete = lesson.items.find((item) => !completedSet.has(item.id))
          const ctaHref = firstIncomplete
            ? getPersonalizedCourseItemHref(course.id, lesson.id, lesson.items.indexOf(firstIncomplete) + 1)
            : total > 0
              ? getPersonalizedCourseItemHref(course.id, lesson.id, 1)
              : lessonHref

          return (
            <section key={lesson.id} className={lessonIndex === 0 ? "relative" : "relative border-t border-[#ececec] pt-10"}>
              {/* Lesson header — same as chapter header */}
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
                    <h3 className="text-lg font-semibold text-[#111111]">{lesson.title}</h3>
                    {lesson.description ? <p className="mt-0.5 text-sm text-[#707070]">{lesson.description}</p> : null}
                    {total > 0 ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2.5 w-24 overflow-hidden rounded-full bg-[#e6e6e6]">
                          <div
                            className="h-full rounded-full bg-[#1f1f1f]"
                            style={{ width: `${(completed / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#8a8a8a]">{completed} / {total} itemi</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Mobile lesson header */}
              <div className="relative mb-5 sm:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-[#111111]">{lesson.title}</h3>
                    {lesson.description ? <p className="mt-1 text-sm text-[#707070]">{lesson.description}</p> : null}
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f]">
                    {isLessonComplete ? <CheckCircle2 className="h-10 w-10 text-[#059669]" /> : <BookOpen className="h-10 w-10" />}
                  </div>
                </div>
              </div>

              {/* Item cards — exact same as ElasticLessonsScroller */}
              <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
                {total > 0 ? (
                  <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
                    <div className="flex min-w-max items-start gap-4 sm:gap-5">
                      {lesson.items.map((item, itemIndex) => {
                        const isDone = completedSet.has(item.id)
                        const itemHref = getPersonalizedCourseItemHref(course.id, lesson.id, itemIndex + 1)
                        return (
                          <Link key={item.id} href={itemHref} className="block shrink-0">
                            <div className="relative flex w-[168px] shrink-0 cursor-pointer flex-col items-center sm:w-[190px]">
                              <div className="flex h-[142px] w-[142px] items-center justify-center rounded-2xl border-[3px] border-[#e6e6e6] border-b-[7px] bg-white p-3 transition-[transform,border-color,border-bottom-width] duration-200 hover:translate-y-1 hover:border-[#cfcfcf] hover:border-b-[4px] sm:h-[162px] sm:w-[162px]">
                                <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                                  {isDone ? (
                                    <CheckCircle2 className="h-10 w-10 text-[#059669] sm:h-12 sm:w-12" />
                                  ) : (
                                    <BookOpen className="h-8 w-8 text-[#9a9a9a] sm:h-10 sm:w-10" />
                                  )}
                                  <span className="text-[10px] font-medium text-[#8a8a8a]">
                                    Pas {itemIndex + 1}
                                  </span>
                                </div>
                              </div>
                              {itemIndex < lesson.items.length - 1 ? (
                                <div className="pointer-events-none absolute left-[155px] top-[71px] h-[5px] w-[42px] bg-[#e6e6e6] sm:left-[176px] sm:top-[81px] sm:w-[48px]" />
                              ) : null}
                              <p className="mt-3 line-clamp-2 text-center text-base font-medium text-[#1f1f1f]">
                                {item.title?.trim() || `Pas ${itemIndex + 1}`}
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

              <div className="mt-4 flex items-center justify-between">
                <Link href={lessonHref} className="text-sm font-medium text-[#1f1f1f] hover:text-[#7c3aed]">
                  {total > 0 ? `Vezi toți cei ${total} itemi` : "Deschide lecția"}
                </Link>
                {total > 0 ? (
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {isLessonComplete ? "Revizuiește" : completed === 0 ? "Începe" : "Continuă"}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-[#ececec] pt-6">
        <Link href="/invata" className="text-sm font-medium text-[#707070] hover:text-[#111111]">
          Toate traseele
        </Link>
        <Link href={getPersonalizedCourseHref(course.id)} className="text-sm font-medium text-[#9a9a9a] hover:text-[#111111]">
          Sus
        </Link>
      </div>
    </div>
  )
}
