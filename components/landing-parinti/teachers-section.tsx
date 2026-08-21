"use client"

import { useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { LandingTeacherCard } from "@/components/landing/teacher-card"
import { LANDING_TEACHERS } from "@/lib/landing-teachers"

export function ParentTeachersSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollByAmount = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const cardWidth = firstCard?.offsetWidth ?? 300
    const gap = 16
    const scrollAmount = cardWidth + gap

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }, [])

  return (
    <section className="relative w-full overflow-x-hidden bg-white py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Cine predă copilului tău
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Olimpici naționali și internaționali. Copilul vede sistemul lor de gândire — nu doar
            formulele pe care le folosesc.
          </p>
        </FadeInUp>
      </div>

      <FadeInUp delay={0.1} className="relative w-full">
        <div
          ref={scrollContainerRef}
          className="flex w-full gap-3 overflow-x-auto pt-1.5 pb-3 pl-8 pr-4 snap-x snap-mandatory sm:gap-4 sm:pl-12 md:pl-16 md:pr-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {LANDING_TEACHERS.map((teacher) => (
            <div key={teacher.id} className="flex-shrink-0 snap-center">
              <LandingTeacherCard teacher={teacher} />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            aria-label="Profesor anterior"
          >
            <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            aria-label="Profesor următor"
          >
            <ChevronRight className="h-5 w-5 stroke-[1.5]" />
          </button>
        </div>
      </FadeInUp>
    </section>
  )
}
