"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { LANDING_TEACHERS, type LandingTeacher } from "@/lib/landing-teachers"
import { WORKSHOP_SUBJECT_LABELS, type WorkshopSubject } from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

const SUBJECT_TEXT_CLASS: Record<WorkshopSubject, string> = {
  fizica: "text-[#7C5CFC]",
  mate: "text-[#16a34a]",
  info: "text-[#2563eb]",
  biologie: "text-[#65a30d]",
  chimie: "text-[#ea580c]",
}

function instagramHref(handle: string): string {
  const username = handle.replace(/^@/, "").trim()
  return `https://instagram.com/${encodeURIComponent(username)}`
}

function TeacherInitials({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div
      className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-2xl font-semibold text-gray-400"
      aria-hidden
    >
      {initial}
    </div>
  )
}

function TeacherImage({ teacher }: { teacher: LandingTeacher }) {
  const [failed, setFailed] = useState(false)

  if (!teacher.imageSrc || failed) {
    return <TeacherInitials name={teacher.name} />
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
      <Image
        src={teacher.imageSrc}
        alt={teacher.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 85vw, 280px"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function TeacherCard({ teacher }: { teacher: LandingTeacher }) {
  return (
    <article className="flex h-full w-[260px] flex-shrink-0 flex-col rounded-[24px] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)] ring-[3px] ring-black/[0.06] sm:w-[300px]">
      <TeacherImage teacher={teacher} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <h3 className="text-base font-bold leading-tight text-gray-900">{teacher.name}</h3>
        <a
          href={instagramHref(teacher.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 text-sm font-semibold text-[#7C5CFC] transition-opacity hover:opacity-80"
        >
          {teacher.instagram}
        </a>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">{teacher.description}</p>

        <p className={cn("mt-4 text-sm font-bold", SUBJECT_TEXT_CLASS[teacher.subject])}>
          {WORKSHOP_SUBJECT_LABELS[teacher.subject]}
        </p>
      </div>
    </article>
  )
}

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
              <TeacherCard teacher={teacher} />
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
