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
    <section aria-label="Cursurile tale personalizate" className="pb-2">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_6px_14px_rgba(124,58,237,0.28)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111111] sm:text-xl">Cursurile tale personalizate</h2>
            <p className="text-xs text-[#8a8a8a] sm:text-sm">
              {courses.length} curs{courses.length === 1 ? "" : "ri"} generate din obiectivele tale
            </p>
          </div>
        </div>
      </div>

      <div className="-mx-5 overflow-x-auto scrollbar-hide px-5 pb-2 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-stretch gap-4 sm:gap-5">
          {courses.map((course) => {
            const href = getPersonalizedCourseHref(course.id)
            const createdLabel = formatCreatedLabel(course.created_at)
            const itemCount =
              typeof course.generation_metadata?.itemCount === "number"
                ? Number(course.generation_metadata.itemCount)
                : null
            const lessonCount =
              typeof course.generation_metadata?.lessonCount === "number"
                ? Number(course.generation_metadata.lessonCount)
                : null

            return (
              <Link
                key={course.id}
                href={href}
                className="group flex w-[260px] shrink-0 flex-col rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white to-[#faf8ff] p-5 shadow-[0_10px_28px_rgba(124,58,237,0.08)] transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_16px_38px_rgba(124,58,237,0.14)] sm:w-[280px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    <Sparkles className="h-3 w-3" />
                    Personalizat
                  </span>
                  {createdLabel ? (
                    <span className="text-[11px] font-medium text-[#9a8a8a]">{createdLabel}</span>
                  ) : null}
                </div>

                <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-[#111111] sm:text-lg">
                  {course.title}
                </h3>
                {course.description ? (
                  <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-[#6f657b]">
                    {course.description}
                  </p>
                ) : (
                  <p className="mt-1.5 flex-1 text-sm italic text-[#9a8a8a]">
                    Curs generat din obiectivul tău.
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-violet-100/80 pt-3">
                  <div className="flex items-center gap-3 text-xs font-medium text-[#8a7da0]">
                    {lessonCount ? (
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {lessonCount} lecț{lessonCount === 1 ? "ie" : "ii"}
                      </span>
                    ) : null}
                    {itemCount ? (
                      <span className="inline-flex items-center gap-1">
                        <ArrowRight className="h-3.5 w-3.5" />
                        {itemCount} item{itemCount === 1 ? "" : "i"}
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-transform group-hover:translate-y-0.5 group-hover:shadow-[0_1px_0_#5b21b6]">
                    Deschide
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
