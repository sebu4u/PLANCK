import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, PlayCircle, Sparkles } from "lucide-react"
import type { PersonalizedCourseWithStructure } from "@/lib/personalized-courses/types"
import {
  getPersonalizedCourseHref,
  getPersonalizedCourseLessonHref,
  getPersonalizedCourseItemHref,
} from "@/lib/personalized-courses/data"
import { LessonItemProgressBar } from "@/components/invata/lesson-item-progress-bar"

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
  const allComplete = totalItems > 0 && completedItems >= totalItems
  const resumeTarget = resolveResumeTarget(course)
  const courseHref = getPersonalizedCourseHref(course.id)

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8 lg:px-12">
      <Link
        href="/invata"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7c3aed] transition-colors hover:text-[#5b21b6]"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la trasee
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-6 shadow-[0_18px_50px_rgba(124,58,237,0.10)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
              <Sparkles className="h-3.5 w-3.5" />
              Curs personalizat
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
              {course.title}
            </h1>
            {course.description ? (
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#4d4d4d] sm:text-base">
                {course.description}
              </p>
            ) : null}
            {course.original_prompt ? (
              <p className="mt-3 rounded-xl border border-violet-100 bg-white/70 px-3.5 py-2 text-xs italic text-[#8a7da0]">
                Obiectiv: “{course.original_prompt}”
              </p>
            ) : null}
          </div>

          {resumeTarget ? (
            <Link
              href={resumeTarget.href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6] sm:self-center"
            >
              <PlayCircle className="h-4 w-4" />
              {resumeTarget.label}
            </Link>
          ) : null}
        </div>

        {totalItems > 0 ? (
          <div className="mt-6 rounded-2xl border border-violet-100 bg-white/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#111111]">
                {allComplete ? "Curs completat" : "Progres curs"}
              </p>
              <p className="text-sm font-medium text-[#6f657b]">
                {completedItems} / {totalItems} itemi
              </p>
            </div>
            <div className="mt-3">
              <LessonItemProgressBar completed={completedItems} total={totalItems} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8" aria-label="Lecții curs">
        <h2 className="mb-4 text-lg font-bold text-[#111111] sm:text-xl">Lecții</h2>

        {!course.lessons.length ? (
          <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-6 text-center text-sm text-[#7a7a7a]">
            Acest curs personalizat nu are încă lecții.
          </div>
        ) : (
          <ol className="space-y-3 sm:space-y-4">
            {course.lessons.map((lesson, lessonIndex) => {
              const total = lesson.items.length
              const completed = lesson.items.filter((item) => completedSet.has(item.id)).length
              const isLessonComplete = total > 0 && completed >= total
              const lessonHref = getPersonalizedCourseLessonHref(course.id, lesson.id)
              const firstIncomplete = lesson.items.find((item) => !completedSet.has(item.id))
              const ctaHref = firstIncomplete
                ? getPersonalizedCourseItemHref(
                    course.id,
                    lesson.id,
                    lesson.items.indexOf(firstIncomplete) + 1,
                  )
                : total > 0
                  ? getPersonalizedCourseItemHref(course.id, lesson.id, 1)
                  : lessonHref
              const ctaLabel = !total
                ? "Deschide lecția"
                : isLessonComplete
                  ? "Revizuiește"
                  : completed === 0
                    ? "Începe lecția"
                    : "Continuă"

              return (
                <li key={lesson.id}>
                  <Link
                    href={lessonHref}
                    className="group flex flex-col gap-4 rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_rgba(124,58,237,0.08)] sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex items-center gap-3 sm:flex-1">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                          isLessonComplete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-violet-100 text-[#7c3aed]"
                        }`}
                      >
                        {isLessonComplete ? <CheckCircle2 className="h-5 w-5" /> : lessonIndex + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-base font-semibold text-[#111111] sm:text-lg">
                          {lesson.title}
                        </p>
                        {lesson.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-[#6f657b]">
                            {lesson.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-3 text-xs font-medium text-[#9a8a8a]">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {total} item{total === 1 ? "" : "i"}
                          </span>
                          {total > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              {isLessonComplete ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Circle className="h-3.5 w-3.5" />
                              )}
                              {completed}/{total} completați
                            </span>
                          ) : null}
                        </div>
                        {total > 0 ? (
                          <div className="mt-2.5 max-w-xs">
                            <LessonItemProgressBar completed={completed} total={total} />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-[#7c3aed] transition-colors group-hover:bg-violet-100 sm:self-center">
                      {ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-[#ececec] pt-6">
        <Link
          href="/invata"
          className="text-sm font-medium text-[#6f657b] transition-colors hover:text-[#111111]"
        >
          Toate traseele
        </Link>
        <Link
          href={courseHref}
          className="text-sm font-medium text-[#9a8a8a] hover:text-[#111111]"
        >
          Sus
        </Link>
      </div>
    </div>
  )
}
