"use client"

import { useState } from "react"
import Image from "next/image"
import {
  landingInstagramHandle,
  landingInstagramHref,
  type LandingTeacher,
} from "@/lib/landing-teachers"
import { WORKSHOP_SUBJECT_LABELS, type WorkshopSubject } from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

const SUBJECT_TEXT_CLASS: Record<WorkshopSubject, string> = {
  fizica: "text-[#7C5CFC]",
  mate: "text-[#16a34a]",
  info: "text-[#2563eb]",
  biologie: "text-[#65a30d]",
  chimie: "text-[#ea580c]",
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
        style={{ objectPosition: teacher.imagePosition ?? "center" }}
        sizes="(max-width: 768px) 85vw, 280px"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

export function LandingTeacherCard({ teacher }: { teacher: LandingTeacher }) {
  const handle = landingInstagramHandle(teacher.instagram)
  const href = landingInstagramHref(teacher.instagram)
  const subjectLabels = [
    ...(teacher.roles ?? []),
    ...teacher.subjects.map((subject) => WORKSHOP_SUBJECT_LABELS[subject]),
  ]

  return (
    <article className="flex h-[28.75rem] w-[260px] flex-shrink-0 flex-col rounded-[24px] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)] ring-[3px] ring-black/[0.06] sm:h-[30rem] sm:w-[300px]">
      <TeacherImage teacher={teacher} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="min-h-[3.25rem]">
          <h3 className="line-clamp-2 text-base font-bold leading-none text-gray-900">
            {teacher.name}
          </h3>

          {handle && href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-sm font-semibold leading-none text-[#7C5CFC] transition-opacity hover:opacity-80"
            >
              {handle}
            </a>
          ) : (
            <span className="mt-1 block h-3.5" aria-hidden />
          )}
        </div>

        <p
          className="mt-4 line-clamp-5 min-h-[6.5rem] text-sm leading-relaxed text-gray-600"
          title={teacher.description || undefined}
        >
          {teacher.cardDescription}
        </p>

        <p className="mt-auto pt-4 text-sm font-bold leading-snug">
          {subjectLabels.map((label, index) => {
            const subject = teacher.subjects.find(
              (item) => WORKSHOP_SUBJECT_LABELS[item] === label,
            )
            return (
              <span key={`${teacher.id}-${label}`}>
                {index > 0 ? <span className="text-gray-300"> · </span> : null}
                <span
                  className={cn(subject ? SUBJECT_TEXT_CLASS[subject] : "text-[#7C5CFC]")}
                >
                  {label}
                </span>
              </span>
            )
          })}
        </p>
      </div>
    </article>
  )
}
