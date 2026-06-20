import Link from "next/link"
import { ArrowRight, BookOpen, Sparkles } from "lucide-react"
import type { PersonalizedCourse } from "@/lib/personalized-courses/types"
import { getPersonalizedCourseHref } from "@/lib/personalized-courses/data"

interface PersonalizedCoursesSectionProps {
  courses: PersonalizedCourse[]
}

function formatCreatedLabel(iso: string): string {
  const created = new Date(iso)
  if (Number.isNaN(created.getTime())) return ""
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.floor(diffMs / dayMs)
  if (days <= 0) return "Adăugat azi"
  if (days === 1) return "Adăugat ieri"
  if (days < 7) return `Adăugat acum ${days} zile`
  if (days < 30) return `Adăugat acum ${Math.floor(days / 7)} săptămâni`
  return `Adăugat pe ${created.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}`
}

export function PersonalizedCoursesSection({ courses }: PersonalizedCoursesSectionProps) {
  if (!courses.length) return null

  return (
    <section aria-label="Cursurile tale personalizate" className="relative border-t border-[#ececec] pt-10">
      <div className="mb-5 hidden sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f] sm:h-28 sm:w-28">
            <Sparkles className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[#111111]">Cursurile tale personalizate</h2>
            <p className="mt-0.5 text-sm text-[#707070]">
              {courses.length} curs{courses.length === 1 ? "" : "ri"} generate din obiectivele tale
            </p>
          </div>
        </div>
      </div>

      <div className="relative mb-5 sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#111111]">Cursurile tale</h2>
            <p className="mt-1 text-sm text-[#707070]">
              {courses.length} curs{courses.length === 1 ? "" : "ri"} personalizate
            </p>
          </div>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f]">
            <Sparkles className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
          <div className="flex min-w-max items-start gap-4 sm:gap-5">
            {courses.map((course, courseIndex) => {
              const href = getPersonalizedCourseHref(course.id)
              const lessonCount =
                typeof course.generation_metadata?.lessonCount === "number"
                  ? Number(course.generation_metadata.lessonCount)
                  : null
              const itemCount =
                typeof course.generation_metadata?.itemCount === "number"
                  ? Number(course.generation_metadata.itemCount)
                  : null

              return (
                <Link key={course.id} href={href} className="block shrink-0">
                  <div className="relative flex w-[168px] shrink-0 cursor-pointer flex-col items-center sm:w-[190px]">
                    <div className="flex h-[142px] w-[142px] items-center justify-center rounded-2xl border-[3px] border-[#e6e6e6] border-b-[7px] bg-white p-3 transition-[transform,border-color,border-bottom-width] duration-200 hover:translate-y-1 hover:border-[#cfcfcf] hover:border-b-[4px] sm:h-[162px] sm:w-[162px]">
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                        <BookOpen className="h-10 w-10 text-[#9a9a9a] sm:h-12 sm:w-12" />
                        {lessonCount ? (
                          <span className="text-[10px] font-medium text-[#8a8a8a]">
                            {lessonCount} lecț{lessonCount === 1 ? "ie" : "ii"}
                          </span>
                        ) : null}
                        {itemCount ? (
                          <span className="text-[10px] font-medium text-[#8a8a8a]">
                            {itemCount} item{itemCount === 1 ? "" : "i"}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {courseIndex < courses.length - 1 ? (
                      <div className="pointer-events-none absolute left-[155px] top-[71px] h-[5px] w-[42px] bg-[#e6e6e6] sm:left-[176px] sm:top-[81px] sm:w-[48px]" />
                    ) : null}

                    <p className="mt-3 line-clamp-2 text-center text-base font-medium text-[#1f1f1f]">
                      {course.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#9a9a9a]">
                      {formatCreatedLabel(course.created_at)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
